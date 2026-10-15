import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollRun } from './payroll-run.entity';
import { PayrollRunItem } from './payroll-run-item.entity';
import { SavingsAccount } from '../savings/savings-account.entity';
import { Loan } from '../loans/loan.entity';
import { LoanSchedule } from '../loans/loan-schedule.entity';
import { Member } from '../members/member.entity';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollRun,
      PayrollRunItem,
      SavingsAccount,
      Loan,
      LoanSchedule,
      Member,
    ]),
    AuditModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}