import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import Decimal from 'decimal.js';
import { PayrollRun } from './payroll-run.entity';
import { PayrollRunItem } from './payroll-run-item.entity';
import { SavingsAccount } from '../savings/savings-account.entity';
import { Loan } from '../loans/loan.entity';
import { LoanSchedule } from '../loans/loan-schedule.entity';
import { Member } from '../members/member.entity';
import { AuditService } from '../audit/audit.service';

const MONTHLY_SAVINGS_TARGET = '500.00';

export interface ReconcileRow {
  memberNo: string;
  amount: string;
}

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollRun)
    private readonly runsRepo: Repository<PayrollRun>,
    @InjectRepository(PayrollRunItem)
    private readonly itemsRepo: Repository<PayrollRunItem>,
    @InjectRepository(SavingsAccount)
    private readonly savingsRepo: Repository<SavingsAccount>,
    @InjectRepository(Loan)
    private readonly loansRepo: Repository<Loan>,
    @InjectRepository(LoanSchedule)
    private readonly schedulesRepo: Repository<LoanSchedule>,
    @InjectRepository(Member)
    private readonly membersRepo: Repository<Member>,
    private readonly audit: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  async generateRun(period: string, actorUserId: string) {
    // Validate period format YYYY-MM
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      throw new BadRequestException(
        'period must be in YYYY-MM format, e.g. "2026-10"',
      );
    }

    const existing = await this.runsRepo.findOne({ where: { period } });
    if (existing) {
      throw new ConflictException(
        `Payroll run for ${period} already exists (id ${existing.id})`,
      );
    }

    // Members with an active savings account (mandatory) OR active loan
    const savingsAccounts = await this.savingsRepo.find({
      where: { accountType: 'mandatory' },
    });
    const activeLoans = await this.loansRepo.find({
      where: { status: 'disbursed' },
    });

    const memberIds = new Set<string>();
    for (const s of savingsAccounts) memberIds.add(s.memberId);
    for (const l of activeLoans) memberIds.add(l.memberId);

    if (memberIds.size === 0) {
      throw new BadRequestException(
        'No members with savings accounts or active loans',
      );
    }

    const rows: Partial<PayrollRunItem>[] = [];
    let total = new Decimal(0);

    for (const memberId of memberIds) {
      const savingsAcc = savingsAccounts.find((s) => s.memberId === memberId);
      const loan = activeLoans.find((l) => l.memberId === memberId);

      const savingsAmount = savingsAcc
        ? new Decimal(MONTHLY_SAVINGS_TARGET)
        : new Decimal(0);

      let loanAmount = new Decimal(0);
      if (loan) {
        // Find the next unpaid installment for this loan
        const nextInst = await this.schedulesRepo.findOne({
          where: { loanId: loan.id, paid: false },
          order: { installmentNo: 'ASC' },
        });
        if (nextInst) {
          loanAmount = new Decimal(nextInst.totalDue);
        }
      }

      const itemTotal = savingsAmount.plus(loanAmount);
      if (itemTotal.eq(0)) continue;

      total = total.plus(itemTotal);
      rows.push({
        memberId,
        savingsAccountId: savingsAcc?.id ?? null,
        loanId: loan?.id ?? null,
        savingsAmount: savingsAmount.toFixed(2),
        loanAmount: loanAmount.toFixed(2),
        totalAmount: itemTotal.toFixed(2),
      });
    }

    return this.dataSource.transaction(async (tx) => {
      const run = await tx.getRepository(PayrollRun).save(
        tx.getRepository(PayrollRun).create({
          period,
          generatedBy: actorUserId,
          totalAmount: total.toFixed(2),
          totalItems: rows.length,
          status: 'generated',
        }),
      );

      const itemRows = rows.map((r) =>
        tx.getRepository(PayrollRunItem).create({ ...r, runId: run.id }),
      );
      await tx.getRepository(PayrollRunItem).save(itemRows);

      await this.audit.record({
        userId: actorUserId,
        action: 'payroll_generate',
        entity: 'payroll_run',
        entityId: run.id,
        afterData: {
          period,
          totalAmount: run.totalAmount,
          totalItems: run.totalItems,
        },
      });

      return run;
    });
  }

  async listRuns() {
    return this.runsRepo.find({ order: { generatedAt: 'DESC' } });
  }

  async getRun(id: string) {
    const run = await this.runsRepo.findOne({ where: { id } });
    if (!run) throw new NotFoundException(`Payroll run ${id} not found`);
    const items = await this.itemsRepo.find({
      where: { runId: id },
      order: { memberId: 'ASC' },
    });

    // Enrich items with member info
    const memberIds = items.map((i) => i.memberId);
    const members = await this.membersRepo.find({
      where: { id: In(memberIds) },
    });
    const byId = new Map(members.map((m) => [m.id, m]));

    return {
      run,
      items: items.map((item) => ({
        ...item,
        memberNo: byId.get(item.memberId)?.memberNo ?? '?',
        fullName: byId.get(item.memberId)?.fullName ?? '?',
      })),
    };
  }

  /**
   * Generates a CSV for the payroll office.
   * Format: employee_no,full_name,savings_amount,loan_amount,total
   */
  async buildCsv(id: string): Promise<string> {
    const { run, items } = await this.getRun(id);

    const lines: string[] = [];
    lines.push(
      'employee_no,full_name,savings_amount,loan_amount,total_amount',
    );

    for (const item of items) {
      lines.push(
        [
          item.memberNo,
          this.escapeCsv(item.fullName),
          item.savingsAmount,
          item.loanAmount,
          item.totalAmount,
        ].join(','),
      );
    }

    lines.push(
      [
        '',
        'TOTAL',
        '',
        '',
        run.totalAmount,
      ].join(','),
    );

    return lines.join('\n') + '\n';
  }

  private escapeCsv(s: string): string {
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  async reconcile(
    id: string,
    rows: ReconcileRow[],
    actorUserId: string,
  ) {
    const run = await this.runsRepo.findOne({ where: { id } });
    if (!run) throw new NotFoundException(`Payroll run ${id} not found`);
    if (run.status === 'reconciled') {
      throw new BadRequestException('Run already reconciled');
    }

    const items = await this.itemsRepo.find({ where: { runId: id } });
    const members = await this.membersRepo.find({
      where: { id: In(items.map((i) => i.memberId)) },
    });
    const memberById = new Map(members.map((m) => [m.id, m]));

    // Build lookup by member_no
    const expected = new Map<string, PayrollRunItem>();
    for (const item of items) {
      const member = memberById.get(item.memberId);
      if (member) expected.set(member.memberNo, item);
    }

    const mismatches: Array<{
      memberNo: string;
      expected?: string;
      received?: string;
      reason: string;
    }> = [];

    const receivedSet = new Set<string>();

    for (const row of rows) {
      const exp = expected.get(row.memberNo);
      if (!exp) {
        mismatches.push({
          memberNo: row.memberNo,
          received: row.amount,
          reason: 'not in payroll run',
        });
        continue;
      }
      receivedSet.add(row.memberNo);

      const expAmt = new Decimal(exp.totalAmount);
      const recAmt = new Decimal(row.amount);
      if (!expAmt.eq(recAmt)) {
        mismatches.push({
          memberNo: row.memberNo,
          expected: expAmt.toFixed(2),
          received: recAmt.toFixed(2),
          reason: 'amount mismatch',
        });
      } else {
        exp.reconciled = true;
      }
    }

    // Members expected but not received
    for (const [memberNo, item] of expected.entries()) {
      if (!receivedSet.has(memberNo)) {
        mismatches.push({
          memberNo,
          expected: item.totalAmount,
          reason: 'missing in received file',
        });
      }
    }

    await this.dataSource.transaction(async (tx) => {
      await tx.getRepository(PayrollRunItem).save(items);
      run.status = mismatches.length === 0 ? 'reconciled' : 'submitted';
      run.reconciledAt = new Date();
      run.reconciledBy = actorUserId;
      await tx.getRepository(PayrollRun).save(run);

      await this.audit.record({
        userId: actorUserId,
        action: 'payroll_reconcile',
        entity: 'payroll_run',
        entityId: run.id,
        afterData: {
          period: run.period,
          matched: receivedSet.size,
          mismatches: mismatches.length,
        },
      });
    });

    return {
      period: run.period,
      matched: receivedSet.size,
      mismatchCount: mismatches.length,
      mismatches,
      status: run.status,
    };
  }
}