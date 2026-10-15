import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Decimal from 'decimal.js';
import { Loan } from './loan.entity';
import { LoanSchedule } from './loan-schedule.entity';
import { Guarantor } from './guarantor.entity';
import { SavingsAccount } from '../savings/savings-account.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { DisburseLoanDto } from './dto/disburse-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';
import { InterestService } from './interest.service';

const LOAN_RATE_BY_TYPE: Record<string, string> = {
  emergency: '12.000',
  education: '10.000',
  housing: '14.000',
};
const SAVINGS_TO_LOAN_RATIO = 3;

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private readonly loansRepo: Repository<Loan>,
    @InjectRepository(LoanSchedule)
    private readonly schedulesRepo: Repository<LoanSchedule>,
    @InjectRepository(Guarantor)
    private readonly guarantorsRepo: Repository<Guarantor>,
    @InjectRepository(SavingsAccount)
    private readonly savingsRepo: Repository<SavingsAccount>,
    private readonly ledger: LedgerService,
    private readonly audit: AuditService,
    private readonly interest: InterestService,
    private readonly dataSource: DataSource,
  ) {}

  async apply(dto: CreateLoanDto, actorUserId: string) {
    const principal = new Decimal(dto.principal);
    const accounts = await this.savingsRepo.find({ where: { memberId: dto.memberId } });
    const totalSavings = accounts.reduce((s, a) => s.plus(a.balance), new Decimal(0));
    const maxLoan = totalSavings.times(SAVINGS_TO_LOAN_RATIO);
    if (principal.greaterThan(maxLoan)) {
      throw new BadRequestException(
        `Loan amount exceeds limit: max ${maxLoan} (= 3× savings of ${totalSavings})`,
      );
    }
    const active = await this.loansRepo.findOne({
      where: [
        { memberId: dto.memberId, status: 'pending' },
        { memberId: dto.memberId, status: 'approved' },
        { memberId: dto.memberId, status: 'disbursed' },
      ],
    });
    if (active) {
      throw new ConflictException(
        `Member ${dto.memberId} already has an active loan (id ${active.id})`,
      );
    }
    const loan = this.loansRepo.create({
      memberId: dto.memberId,
      loanType: dto.loanType,
      principal: principal.toFixed(2),
      interestRate: LOAN_RATE_BY_TYPE[dto.loanType],
      termMonths: dto.termMonths,
      purpose: dto.purpose ?? null,
      status: 'pending',
      appliedBy: actorUserId,
    });
    const saved = await this.loansRepo.save(loan);
    const guarantorRows = dto.guarantors.map((g) =>
      this.guarantorsRepo.create({
        loanId: saved.id,
        memberId: g.memberId,
        amount: new Decimal(g.amount).toFixed(2),
      }),
    );
    await this.guarantorsRepo.save(guarantorRows);
    await this.audit.record({
      userId: actorUserId,
      action: 'loan_apply',
      entity: 'loan',
      entityId: saved.id,
      afterData: { memberId: saved.memberId, principal: saved.principal, loanType: saved.loanType },
    });
    return saved;
  }

  async approve(id: string, _dto: ApproveLoanDto, actorUserId: string) {
    const loan = await this.findOne(id);
    if (loan.status !== 'pending') {
      throw new BadRequestException(`Cannot approve loan in status "${loan.status}"`);
    }
    if (loan.appliedBy === actorUserId) {
      throw new ForbiddenException('Segregation of duties: the user who applied cannot approve the loan');
    }
    const schedule = this.interest.calculateSchedule(
      loan.principal,
      loan.interestRate,
      loan.termMonths,
    );
    return this.dataSource.transaction(async (tx) => {
      loan.status = 'approved';
      loan.approvedBy = actorUserId;
      loan.approvedAt = new Date();
      loan.totalInterest = schedule.totalInterest;
      loan.totalPayable = schedule.totalPayable;
      loan.outstandingBalance = schedule.totalPayable;
      const saved = await tx.getRepository(Loan).save(loan);
      const rows = schedule.rows.map((r) =>
        tx.getRepository(LoanSchedule).create({
          loanId: saved.id,
          installmentNo: r.installmentNo,
          dueDate: r.dueDate,
          principalDue: r.principalDue,
          interestDue: r.interestDue,
          totalDue: r.totalDue,
          paid: false,
        }),
      );
      await tx.getRepository(LoanSchedule).save(rows);
      await this.audit.record({
        userId: actorUserId,
        action: 'loan_approve',
        entity: 'loan',
        entityId: saved.id,
        afterData: { status: 'approved', totalPayable: saved.totalPayable },
      });
      return saved;
    });
  }

  async disburse(id: string, _dto: DisburseLoanDto, actorUserId: string) {
    const loan = await this.findOne(id);
    if (loan.status !== 'approved') {
      throw new BadRequestException(`Cannot disburse loan in status "${loan.status}"`);
    }
    if (loan.approvedBy === actorUserId) {
      throw new ForbiddenException('Segregation of duties: the approver cannot disburse the loan');
    }
    const amount = new Decimal(loan.principal);
    return this.dataSource.transaction(async (tx) => {
      loan.status = 'disbursed';
      loan.disbursedBy = actorUserId;
      loan.disbursedAt = new Date();
      const saved = await tx.getRepository(Loan).save(loan);
      await this.ledger.post(
        'loan_disbursement',
        saved.id,
        [
          { accountCode: '1200', debit: amount.toFixed(2) },
          { accountCode: '1000', credit: amount.toFixed(2) },
        ],
        actorUserId,
      );
      await this.audit.record({
        userId: actorUserId,
        action: 'loan_disburse',
        entity: 'loan',
        entityId: saved.id,
        afterData: { status: 'disbursed', amount: amount.toFixed(2) },
      });
      return saved;
    });
  }

  async repay(id: string, dto: RepayLoanDto, actorUserId: string) {
    const loan = await this.findOne(id);
    if (loan.status !== 'disbursed') {
      throw new BadRequestException(`Cannot repay loan in status "${loan.status}"`);
    }
    const amount = new Decimal(dto.amount);
    const outstanding = new Decimal(loan.outstandingBalance);
    if (amount.greaterThan(outstanding)) {
      throw new BadRequestException(`Repayment exceeds outstanding balance (${outstanding})`);
    }
    return this.dataSource.transaction(async (tx) => {
      loan.outstandingBalance = outstanding.minus(amount).toFixed(2);
      if (new Decimal(loan.outstandingBalance).eq(0)) {
        loan.status = 'repaid';
      }
      const saved = await tx.getRepository(Loan).save(loan);
      await this.ledger.post(
        'loan_repayment',
        saved.id,
        [
          { accountCode: '1000', debit: amount.toFixed(2) },
          { accountCode: '1200', credit: amount.toFixed(2) },
        ],
        actorUserId,
      );
      await this.audit.record({
        userId: actorUserId,
        action: 'loan_repay',
        entity: 'loan',
        entityId: saved.id,
        afterData: {
          amount: amount.toFixed(2),
          outstanding: saved.outstandingBalance,
          status: saved.status,
        },
      });
      return saved;
    });
  }

  async findOne(id: string): Promise<Loan> {
    const loan = await this.loansRepo.findOne({ where: { id } });
    if (!loan) throw new NotFoundException(`Loan ${id} not found`);
    return loan;
  }

  async listAll(): Promise<Loan[]> {
    return this.loansRepo.find({ order: { appliedAt: 'DESC' } });
  }

  async getSchedule(id: string): Promise<LoanSchedule[]> {
    return this.schedulesRepo.find({
      where: { loanId: id },
      order: { installmentNo: 'ASC' },
    });
  }
}