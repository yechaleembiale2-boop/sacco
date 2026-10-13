import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Member } from './members/member.entity';
import { LedgerAccount } from './ledger/ledger-account.entity';
import { LedgerEntry } from './ledger/ledger-entry.entity';
import { InitialSchema1700000000000 } from './database/migrations/1700000000000-InitialSchema';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5433', 10),
  username: process.env.DB_USER ?? 'sacco',
  password: process.env.DB_PASSWORD ?? 'change_me_pg',
  database: process.env.DB_NAME ?? 'sacco_db',
  entities: [Member, LedgerAccount, LedgerEntry],
  migrations: [InitialSchema1700000000000],
  synchronize: false,
});