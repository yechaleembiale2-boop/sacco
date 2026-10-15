import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import Decimal from 'decimal.js';
import { LedgerAccount } from '../ledger/ledger-account.entity';
import { LedgerEntry } from '../ledger/ledger-entry.entity';
import { Loan } from '../loans/loan.entity';
import { LoanSchedule } from '../loans/loan-schedule.entity';
import { SavingsAccount } from '../savings/savings-account.entity';
import { Member } from '../members/member.entity';

export interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  totalDebit: string;
  totalCredit: string;
  balance: string;
}

export interface AgingBucket {
  bucket: string;
  count: number;
  principalOutstanding: string;
}

export interface DefaulterRow {
  loanId: string;
  memberId: string;
  memberNo: string;
  fullName: string;
  outstanding: string;
  overdueInstallments: number;
  oldestDueDate: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(LedgerAccount)
    private readonly accountsRepo: Repository<LedgerAccount>,
    @InjectRepository(LedgerEntry)
    private readonly entriesRepo: Repository<LedgerEntry>,
    @InjectRepository(Loan)
    private readonly loansRepo: Repository<Loan>,
    @InjectRepository(LoanSchedule)
    private readonly schedulesRepo: Repository<LoanSchedule>,
    @InjectRepository(SavingsAccount)
    private readonly savingsRepo: Repository<SavingsAccount>,
    @InjectRepository(Member)
    private readonly membersRepo: Repository<Member>,
  ) {}

  async trialBalance(): Promise<TrialBalanceRow[]> {
    const accounts = await this.accountsRepo.find({ order: { code: 'ASC' } });
    const rows: TrialBalanceRow[] = [];

    for (const acc of accounts) {
      const result = await this.entriesRepo
        .createQueryBuilder('e')
        .select('COALESCE(SUM(e.debit), 0)', 'totalDebit')
        .addSelect('COALESCE(SUM(e.credit), 0)', 'totalCredit')
        .where('e.ledgerAccountId = :id', { id: acc.id })
        .getRawOne<{ totalDebit: string; totalCredit: string }>();

      const dr = new Decimal(result?.totalDebit ?? '0');
      const cr = new Decimal(result?.totalCredit ?? '0');
      // Balance = debit − credit for asset/expense; credit − debit for others
      const balance =
        acc.type === 'asset' || acc.type === 'expense'
          ? dr.minus(cr)
          : cr.minus(dr);

      rows.push({
        code: acc.code,
        name: acc.name,
        type: acc.type,
        totalDebit: dr.toFixed(2),
        totalCredit: cr.toFixed(2),
        balance: balance.toFixed(2),
      });
    }

    return rows;
  }

  async incomeStatement() {
    const accounts = await this.accountsRepo.find({
      where: { type: 'income' },
    });
    const rows: Array<{ code: string; name: string; amount: string }> = [];
    let totalIncome = new Decimal(0);

    for (const acc of accounts) {
      const result = await this.entriesRepo
        .createQueryBuilder('e')
        .select('COALESCE(SUM(e.credit), 0)', 'credit')
        .addSelect('COALESCE(SUM(e.debit), 0)', 'debit')
        .where('e.ledgerAccountId = :id', { id: acc.id })
        .getRawOne<{ credit: string; debit: string }>();

      const amount = new Decimal(result?.credit ?? '0').minus(
        new Decimal(result?.debit ?? '0'),
      );
      rows.push({
        code: acc.code,
        name: acc.name,
        amount: amount.toFixed(2),
      });
      totalIncome = totalIncome.plus(amount);
    }

    return {
      period: 'all-time',
      income: rows,
      totalIncome: totalIncome.toFixed(2),
      netIncome: totalIncome.toFixed(2),
    };
  }

  async portfolioAtRisk(): Promise<AgingBucket[]> {
    // Find all unpaid scheduled installments that are past due
    const today = new Date();
    const unpaid = await this.schedulesRepo.find({
      where: { paid: false },
    });

    const buckets: Record<string, { count: number; principal: Decimal }> = {
      '1-30 days': { count: 0, principal: new Decimal(0) },
      '31-60 days': { count: 0, principal: new Decimal(0) },
      '61-90 days': { count: 0, principal: new Decimal(0) },
      '90+ days': { count: 0, principal: new Decimal(0) },
    };

    for (const inst of unpaid) {
      const dueDate = new Date(inst.dueDate);
      const daysOverdue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysOverdue <= 0) continue;

      let bucket: string;
      if (daysOverdue <= 30) bucket = '1-30 days';
      else if (daysOverdue <= 60) bucket = '31-60 days';
      else if (daysOverdue <= 90) bucket = '61-90 days';
      else bucket = '90+ days';

      buckets[bucket].count += 1;
      buckets[bucket].principal = buckets[bucket].principal.plus(
        inst.principalDue,
      );
    }

    return Object.entries(buckets).map(([bucket, data]) => ({
      bucket,
      count: data.count,
      principalOutstanding: data.principal.toFixed(2),
    }));
  }

  async defaulters(): Promise<DefaulterRow[]> {
    const today = new Date();
    const overdueSchedules = await this.schedulesRepo
      .createQueryBuilder('s')
      .where('s.paid = false AND s.dueDate < :today', {
        today: today.toISOString().slice(0, 10),
      })
      .orderBy('s.dueDate', 'ASC')
      .getMany();

    // Group by loan
    const byLoan = new Map<string, LoanSchedule[]>();
    for (const s of overdueSchedules) {
      if (!byLoan.has(s.loanId)) byLoan.set(s.loanId, []);
      byLoan.get(s.loanId)!.push(s);
    }

    const out: DefaulterRow[] = [];
    for (const [loanId, schedules] of byLoan.entries()) {
      const loan = await this.loansRepo.findOne({ where: { id: loanId } });
      if (!loan || loan.status !== 'disbursed') continue;

      const member = await this.membersRepo.findOne({
        where: { id: loan.memberId },
      });
      if (!member) continue;

      out.push({
        loanId: loan.id,
        memberId: member.id,
        memberNo: member.memberNo,
        fullName: member.fullName,
        outstanding: loan.outstandingBalance,
        overdueInstallments: schedules.length,
        oldestDueDate: schedules[0].dueDate,
      });
    }

    return out;
  }

  async savingsSummary() {
    const accounts = await this.savingsRepo.find();

    const summary: Record<string, { count: number; totalBalance: string }> = {
      mandatory: { count: 0, totalBalance: '0.00' },
      voluntary: { count: 0, totalBalance: '0.00' },
      share: { count: 0, totalBalance: '0.00' },
    };

    const totals: Record<string, Decimal> = {
      mandatory: new Decimal(0),
      voluntary: new Decimal(0),
      share: new Decimal(0),
    };

    for (const acc of accounts) {
      summary[acc.accountType].count += 1;
      totals[acc.accountType] = totals[acc.accountType].plus(acc.balance);
    }

    for (const key of Object.keys(summary)) {
      summary[key].totalBalance = totals[key].toFixed(2);
    }

    const grandTotal = Object.values(totals).reduce(
      (s, d) => s.plus(d),
      new Decimal(0),
    );

    return {
      byType: summary,
      grandTotal: grandTotal.toFixed(2),
    };
  }

  /**
   * Dividend calculation:
   *   - Only income accounts (Interest Income + Penalty Income) count.
   *   - Weight = member's total savings balance / total SACCO savings.
   *   - Dividend = member weight × total income × payout ratio.
   *
   * ⚠️ Payout ratio is a placeholder; the actual ratio is decided
   * by the general assembly each year. Default 70%.
   */
  async dividend(year: number, payoutRatio = 0.7) {
    const start = new Date(`${year}-01-01T00:00:00Z`);
    const end = new Date(`${year + 1}-01-01T00:00:00Z`);

    const incomeAccounts = await this.accountsRepo.find({
      where: { type: 'income' },
    });
    const incomeIds = incomeAccounts.map((a) => a.id);

    const incomeEntries = await this.entriesRepo.find({
      where: {
        ledgerAccountId: In(incomeIds),
        postedAt: Between(start, end),
      },
    });

    let totalIncome = new Decimal(0);
    for (const e of incomeEntries) {
      totalIncome = totalIncome
        .plus(e.credit ?? '0')
        .minus(e.debit ?? '0');
    }

    const pool = totalIncome.times(payoutRatio);

    const accounts = await this.savingsRepo.find();
    const totalSavings = accounts.reduce(
      (s, a) => s.plus(a.balance),
      new Decimal(0),
    );

    const byMember = new Map<string, Decimal>();
    for (const acc of accounts) {
      const prev = byMember.get(acc.memberId) ?? new Decimal(0);
      byMember.set(acc.memberId, prev.plus(acc.balance));
    }

    const rows: Array<{
      memberId: string;
      savingsBalance: string;
      share: string;
      dividend: string;
    }> = [];

    for (const [memberId, balance] of byMember.entries()) {
      const weight = totalSavings.eq(0)
        ? new Decimal(0)
        : balance.div(totalSavings);
      rows.push({
        memberId,
        savingsBalance: balance.toFixed(2),
        share: weight.times(100).toFixed(2) + '%',
        dividend: weight.times(pool).toFixed(2),
      });
    }

    return {
      year,
      totalIncome: totalIncome.toFixed(2),
      payoutRatio: payoutRatio.toFixed(2),
      dividendPool: pool.toFixed(2),
      totalSavings: totalSavings.toFixed(2),
      perMember: rows,
    };
  }
}