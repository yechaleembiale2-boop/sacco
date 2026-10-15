import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerAccount } from '../ledger/ledger-account.entity';
import { LedgerEntry } from '../ledger/ledger-entry.entity';
import { Loan } from '../loans/loan.entity';
import { LoanSchedule } from '../loans/loan-schedule.entity';
import { SavingsAccount } from '../savings/savings-account.entity';
import { Member } from '../members/member.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ExcelService } from './excel.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LedgerAccount,
      LedgerEntry,
      Loan,
      LoanSchedule,
      SavingsAccount,
      Member,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ExcelService],
  exports: [ReportsService],
})
export class ReportsModule {}