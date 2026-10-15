import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { MembersModule } from './members/members.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { SavingsModule } from './savings/savings.module';
import { LedgerModule } from './ledger/ledger.module';
import { Member } from './members/member.entity';
import { LedgerAccount } from './ledger/ledger-account.entity';
import { LedgerEntry } from './ledger/ledger-entry.entity';
import { AuditLog } from './audit/audit-log.entity';
import { User } from './users/user.entity';
import { SavingsAccount } from './savings/savings-account.entity';
import { SavingsTransaction } from './savings/savings-transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST', 'localhost'),
        port: parseInt(cfg.get<string>('DB_PORT', '5433'), 10),
        username: cfg.get<string>('DB_USER', 'sacco'),
        password: cfg.get<string>('DB_PASSWORD', 'change_me_pg'),
        database: cfg.get<string>('DB_NAME', 'sacco_db'),
        entities: [
          Member,
          LedgerAccount,
          LedgerEntry,
          AuditLog,
          User,
          SavingsAccount,
          SavingsTransaction,
        ],
        migrations: ['dist/database/migrations/*.js'],
        synchronize: false,
        logging: ['error', 'warn'],
      }),
    }),
    HealthModule,
    MembersModule,
    AuditModule,
    AuthModule,
    SavingsModule,
    LedgerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}