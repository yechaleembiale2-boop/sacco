import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from './loan.entity';
import { LoanSchedule } from './loan-schedule.entity';
import { Guarantor } from './guarantor.entity';
import { SavingsAccount } from '../savings/savings-account.entity';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { InterestService } from './interest.service';
import { LedgerModule } from '../ledger/ledger.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan, LoanSchedule, Guarantor, SavingsAccount]),
    LedgerModule,
    AuditModule,
  ],
  controllers: [LoansController],
  providers: [LoansService, InterestService],
  exports: [LoansService, InterestService],
})
export class LoansModule {}