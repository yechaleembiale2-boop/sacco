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
