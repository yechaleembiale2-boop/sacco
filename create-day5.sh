distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-9.1.0-bin.zip#!/usr/bin/env bash
set -e

cd ~/sacco/backend

mkdir -p src/savings/dto

cat > src/database/migrations/1700000003000-AddSavings.ts <<'EOF'
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSavings1700000003000 implements MigrationInterface {
  name = 'AddSavings1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE savings_accounts (
        id           BIGSERIAL PRIMARY KEY,
        member_id    BIGINT NOT NULL REFERENCES members(id),
        account_type TEXT NOT NULL
                     CHECK (account_type IN ('mandatory','voluntary','share')),
        balance      NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
        opened_at    DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (member_id, account_type)
      );
    `);
    await queryRunner.query(`
      CREATE TABLE savings_transactions (
        id          BIGSERIAL PRIMARY KEY,
        account_id  BIGINT NOT NULL REFERENCES savings_accounts(id),
        txn_type    TEXT NOT NULL CHECK (txn_type IN ('deposit','withdrawal')),
        amount      NUMERIC(18,2) NOT NULL CHECK (amount > 0),
        notes       TEXT,
        posted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by  BIGINT REFERENCES users(id)
      );
    `);
    await queryRunner.query(`
      CREATE INDEX idx_savings_txn_account
        ON savings_transactions (account_id, posted_at DESC);
    `);
    await queryRunner.query(`
      INSERT INTO ledger_accounts (code, name, type) VALUES
        ('1000','Cash',              'asset'),
        ('1100','Bank',              'asset'),
        ('1200','Loans Receivable',  'asset'),
        ('2000','Member Savings',    'liability'),
        ('2100','Share Capital',     'equity'),
        ('4000','Interest Income',   'income'),
        ('4100','Penalty Income',    'income')
      ON CONFLICT (code) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE savings_transactions;`);
    await queryRunner.query(`DROP TABLE savings_accounts;`);
  }
}
EOF

cat > src/savings/savings-account.entity.ts <<'EOF'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type SavingsAccountType = 'mandatory' | 'voluntary' | 'share';

@Entity({ name: 'savings_accounts' })
@Index(['memberId', 'accountType'], { unique: true })
export class SavingsAccount {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'member_id', type: 'bigint' })
  memberId!: string;

  @Column({ name: 'account_type', type: 'text' })
  accountType!: SavingsAccountType;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  balance!: string;

  @Column({ name: 'opened_at', type: 'date' })
  openedAt!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
EOF

cat > src/savings/savings-transaction.entity.ts <<'EOF'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type SavingsTxnType = 'deposit' | 'withdrawal';

@Entity({ name: 'savings_transactions' })
@Index(['accountId', 'postedAt'])
export class SavingsTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'account_id', type: 'bigint' })
  accountId!: string;

  @Column({ name: 'txn_type', type: 'text' })
  txnType!: SavingsTxnType;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'posted_at', type: 'timestamptz' })
  postedAt!: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy!: string | null;
}
EOF

cat > src/savings/dto/create-account.dto.ts <<'EOF'
import { IsIn, IsString } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  memberId!: string;

  @IsIn(['mandatory', 'voluntary', 'share'])
  accountType!: 'mandatory' | 'voluntary' | 'share';
}
EOF

cat > src/savings/dto/deposit.dto.ts <<'EOF'
import { IsOptional, IsString, Matches } from 'class-validator';

export class DepositDto {
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a positive decimal with up to 2 decimal places',
  })
  amount!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
EOF

cat > src/savings/dto/withdrawal.dto.ts <<'EOF'
import { IsOptional, IsString, Matches } from 'class-validator';

export class WithdrawalDto {
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a positive decimal with up to 2 decimal places',
  })
  amount!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
EOF

cat > src/ledger/ledger.service.ts <<'EOF'
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LedgerAccount } from './ledger-account.entity';
import { LedgerEntry } from './ledger-entry.entity';
import Decimal from 'decimal.js';

export interface LedgerLine {
  accountCode: string;
  debit?: string;
  credit?: string;
}

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(LedgerAccount)
    private readonly accountsRepo: Repository<LedgerAccount>,
    @InjectRepository(LedgerEntry)
    private readonly entriesRepo: Repository<LedgerEntry>,
    private readonly dataSource: DataSource,
  ) {}

  async post(
    refType: string,
    refId: string,
    lines: LedgerLine[],
    createdBy: string | null,
  ): Promise<LedgerEntry[]> {
    const totalDebit = lines.reduce(
      (s, l) => s.plus(l.debit ?? '0'),
      new Decimal(0),
    );
    const totalCredit = lines.reduce(
      (s, l) => s.plus(l.credit ?? '0'),
      new Decimal(0),
    );

    if (!totalDebit.equals(totalCredit)) {
      throw new InternalServerErrorException(
        `Ledger does not balance: debit=${totalDebit} credit=${totalCredit}`,
      );
    }

    const codes = lines.map((l) => l.accountCode);
    const accounts = await this.accountsRepo.find({
      where: codes.map((code) => ({ code })),
    });
    const byCode = new Map(accounts.map((a) => [a.code, a]));
    for (const code of codes) {
      if (!byCode.has(code)) {
        throw new InternalServerErrorException(
          `Unknown ledger account code: ${code}`,
        );
      }
    }

    return this.dataSource.transaction(async (tx) => {
      const rows = lines.map((l) =>
        tx.getRepository(LedgerEntry).create({
          ledgerAccountId: byCode.get(l.accountCode)!.id,
          debit: l.debit ?? '0',
          credit: l.credit ?? '0',
          refType,
          refId,
          reversesEntryId: null,
        }),
      );
      return tx.getRepository(LedgerEntry).save(rows);
    });
  }
}
EOF

cat > src/ledger/ledger.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerAccount } from './ledger-account.entity';
import { LedgerEntry } from './ledger-entry.entity';
import { LedgerService } from './ledger.service';

@Module({
  imports: [TypeOrmModule.forFeature([LedgerAccount, LedgerEntry])],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
EOF

cat > src/savings/savings.service.ts <<'EOF'
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
EOF

cat > src/savings/savings.controller.ts <<'EOF'
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SavingsService } from './savings.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawalDto } from './dto/withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('savings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SavingsController {
  constructor(private readonly savings: SavingsService) {}

  @Post('accounts')
  @Roles('cashier', 'admin')
  openAccount(@Body() dto: CreateAccountDto, @CurrentUser() user: User) {
    return this.savings.openAccount(dto, user.id);
  }

  @Get('accounts')
  @Roles('cashier', 'accountant', 'credit_committee', 'chairperson', 'auditor', 'admin')
  list() {
    return this.savings.listAccounts();
  }

  @Get('accounts/:id')
  @Roles('cashier', 'accountant', 'credit_committee', 'chairperson', 'auditor', 'admin')
  findOne(@Param('id') id: string) {
    return this.savings.findOne(id);
  }

  @Post('accounts/:id/deposits')
  @Roles('cashier', 'admin')
  deposit(
    @Param('id') id: string,
    @Body() dto: DepositDto,
    @CurrentUser() user: User,
  ) {
    return this.savings.deposit(id, dto, user.id);
  }

  @Post('accounts/:id/withdrawals')
  @Roles('cashier', 'admin')
  withdraw(
    @Param('id') id: string,
    @Body() dto: WithdrawalDto,
    @CurrentUser() user: User,
  ) {
    return this.savings.withdraw(id, dto, user.id);
  }
}
EOF

cat > src/savings/savings.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsAccount } from './savings-account.entity';
import { SavingsTransaction } from './savings-transaction.entity';
import { SavingsService } from './savings.service';
import { SavingsController } from './savings.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavingsAccount, SavingsTransaction]),
    LedgerModule,
    AuditModule,
  ],
  controllers: [SavingsController],
  providers: [SavingsService],
  exports: [SavingsService],
})
export class SavingsModule {}
EOF

echo "🎉 All Day 5 files created."
