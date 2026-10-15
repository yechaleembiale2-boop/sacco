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
