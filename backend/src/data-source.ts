import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Member } from './members/member.entity';
import { LedgerAccount } from './ledger/ledger-account.entity';
import { LedgerEntry } from './ledger/ledger-entry.entity';
import { AuditLog } from './audit/audit-log.entity';
import { User } from './users/user.entity';
import { SavingsAccount } from './savings/savings-account.entity';
import { SavingsTransaction } from './savings/savings-transaction.entity';
import { Loan } from './loans/loan.entity';
import { LoanSchedule } from './loans/loan-schedule.entity';
import { Guarantor } from './loans/guarantor.entity';
import { PayrollRun } from './payroll/payroll-run.entity';
import { PayrollRunItem } from './payroll/payroll-run-item.entity';
import { InitialSchema1700000000000 } from './database/migrations/1700000000000-InitialSchema';
import { AddAuditLog1700000001000 } from './database/migrations/1700000001000-AddAuditLog';
import { AddUsers1700000002000 } from './database/migrations/1700000002000-AddUsers';
import { AddSavings1700000003000 } from './database/migrations/1700000003000-AddSavings';
import { AddLoans1700000004000 } from './database/migrations/1700000004000-AddLoans';
import { AddPayroll1700000005000 } from './database/migrations/1700000005000-AddPayroll';
import { AddMfaFields1700000006000 } from './database/migrations/1700000006000-AddMfaFields';


dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5433', 10),
  username: process.env.DB_USER ?? 'sacco',
  password: process.env.DB_PASSWORD ?? 'change_me_pg',
  database: process.env.DB_NAME ?? 'sacco_db',
  entities: [
    Member,
    LedgerAccount,
    LedgerEntry,
    AuditLog,
    User,
    SavingsAccount,
    SavingsTransaction,
    Loan,
    LoanSchedule,
    Guarantor,
    PayrollRun,
    PayrollRunItem,
  ],
  migrations: [
    InitialSchema1700000000000,
    AddAuditLog1700000001000,
    AddUsers1700000002000,
    AddSavings1700000003000,
    AddLoans1700000004000,
    AddPayroll1700000005000,
    AddMfaFields1700000006000,
  ],
  synchronize: false,
});