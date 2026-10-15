import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Decimal from 'decimal.js';
import { SavingsAccount } from './savings-account.entity';
import { SavingsTransaction } from './savings-transaction.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawalDto } from './dto/withdrawal.dto';
import { LedgerService } from '../ledger/ledger.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SavingsService {
  constructor(
    @InjectRepository(SavingsAccount)
    private readonly accountsRepo: Repository<SavingsAccount>,
    @InjectRepository(SavingsTransaction)
    private readonly txnRepo: Repository<SavingsTransaction>,
    private readonly ledger: LedgerService,
    private readonly audit: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  async openAccount(dto: CreateAccountDto, actorUserId: string) {
    const existing = await this.accountsRepo.findOne({
      where: { memberId: dto.memberId, accountType: dto.accountType },
    });
    if (existing) {
      throw new ConflictException(
        `Member ${dto.memberId} already has a ${dto.accountType} account`,
      );
    }
    const account = this.accountsRepo.create({
      memberId: dto.memberId,
      accountType: dto.accountType,
      balance: '0',
      openedAt: new Date().toISOString().slice(0, 10),
    });
    const saved = await this.accountsRepo.save(account);
    await this.audit.record({
      userId: actorUserId,
      action: 'open_account',
      entity: 'savings_account',
      entityId: saved.id,
      afterData: { ...saved },
    });
    return saved;
  }

  async listAccounts() {
    return this.accountsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const account = await this.accountsRepo.findOne({ where: { id } });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  async deposit(id: string, dto: DepositDto, actorUserId: string) {
    const amount = new Decimal(dto.amount);
    return this.dataSource.transaction(async (tx) => {
      const account = await tx.getRepository(SavingsAccount).findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!account) throw new NotFoundException(`Account ${id} not found`);
      const txn = await tx.getRepository(SavingsTransaction).save(
        tx.getRepository(SavingsTransaction).create({
          accountId: id,
          txnType: 'deposit',
          amount: amount.toFixed(2),
          notes: dto.notes ?? null,
          createdBy: actorUserId,
        }),
      );
      account.balance = new Decimal(account.balance).plus(amount).toFixed(2);
      await tx.getRepository(SavingsAccount).save(account);
      await this.ledger.post(
        'savings_deposit',
        txn.id,
        [
          { accountCode: '1000', debit: amount.toFixed(2) },
          { accountCode: '2000', credit: amount.toFixed(2) },
        ],
        actorUserId,
      );
      await this.audit.record({
        userId: actorUserId,
        action: 'deposit',
        entity: 'savings_account',
        entityId: id,
        afterData: {
          amount: amount.toFixed(2),
          newBalance: account.balance,
          txnId: txn.id,
        },
      });
      return { account, transaction: txn };
    });
  }

  async withdraw(id: string, dto: WithdrawalDto, actorUserId: string) {
    const amount = new Decimal(dto.amount);
    return this.dataSource.transaction(async (tx) => {
      const account = await tx.getRepository(SavingsAccount).findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!account) throw new NotFoundException(`Account ${id} not found`);
      const currentBalance = new Decimal(account.balance);
      if (currentBalance.lessThan(amount)) {
        throw new BadRequestException(
          `Insufficient balance: have ${currentBalance}, need ${amount}`,
        );
      }
      const txn = await tx.getRepository(SavingsTransaction).save(
        tx.getRepository(SavingsTransaction).create({
          accountId: id,
          txnType: 'withdrawal',
          amount: amount.toFixed(2),
          notes: dto.notes ?? null,
          createdBy: actorUserId,
        }),
      );
      account.balance = currentBalance.minus(amount).toFixed(2);
      await tx.getRepository(SavingsAccount).save(account);
      await this.ledger.post(
        'savings_withdrawal',
        txn.id,
        [
          { accountCode: '2000', debit: amount.toFixed(2) },
          { accountCode: '1000', credit: amount.toFixed(2) },
        ],
        actorUserId,
      );
      await this.audit.record({
        userId: actorUserId,
        action: 'withdrawal',
        entity: 'savings_account',
        entityId: id,
        afterData: {
          amount: amount.toFixed(2),
          newBalance: account.balance,
          txnId: txn.id,
        },
      });
      return { account, transaction: txn };
    });
  }
}
