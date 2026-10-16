import { InternalServerErrorException } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { LedgerAccount } from './ledger-account.entity';
import { LedgerEntry } from './ledger-entry.entity';

describe('LedgerService', () => {
  let service: LedgerService;
  let mockAccountsRepo: { find: jest.Mock };
  let mockEntriesRepo: { save: jest.Mock; create: jest.Mock };
  let mockDataSource: { transaction: jest.Mock };

  beforeEach(() => {
    // Two fake ledger accounts
    const accounts: Partial<LedgerAccount>[] = [
      { id: '1', code: '1000', name: 'Cash', type: 'asset' },
      { id: '2', code: '2000', name: 'Member Savings', type: 'liability' },
    ];

    mockAccountsRepo = {
      find: jest.fn().mockResolvedValue(accounts),
    };

    mockEntriesRepo = {
      create: jest.fn((data) => data),
      save: jest.fn((rows) => Promise.resolve(rows)),
    };

    // Simulate the DB transaction: run the callback with a fake tx
    mockDataSource = {
      transaction: jest.fn(async (cb) => {
        const tx = {
          getRepository: jest.fn(() => mockEntriesRepo),
        };
        return cb(tx);
      }),
    };

    service = new LedgerService(
      mockAccountsRepo as never,
      mockEntriesRepo as never,
      mockDataSource as never,
    );
  });

  it('rejects a set of lines where debits ≠ credits', async () => {
    await expect(
      service.post(
        'savings_deposit',
        '1',
        [
          { accountCode: '1000', debit: '500.00' },
          { accountCode: '2000', credit: '400.00' }, // wrong
        ],
        '1',
      ),
    ).rejects.toThrow(InternalServerErrorException);

    // Ensure nothing was written
    expect(mockDataSource.transaction).not.toHaveBeenCalled();
  });

  it('accepts balanced lines and writes 2 ledger entries', async () => {
    const result = await service.post(
      'savings_deposit',
      '1',
      [
        { accountCode: '1000', debit: '500.00' },
        { accountCode: '2000', credit: '500.00' },
      ],
      '1',
    );

    expect(result).toHaveLength(2);
    expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects an unknown ledger account code', async () => {
    await expect(
      service.post(
        'savings_deposit',
        '1',
        [
          { accountCode: '9999', debit: '100.00' },
          { accountCode: '2000', credit: '100.00' },
        ],
        '1',
      ),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('accepts multi-line entries that sum to zero', async () => {
    // Debit 300, Credit 100+200 = 300 → balanced
    const result = await service.post(
      'loan_disbursement',
      '5',
      [
        { accountCode: '1000', debit: '300.00' },
        { accountCode: '2000', credit: '100.00' },
        { accountCode: '2000', credit: '200.00' },
      ],
      '1',
    );
    expect(result).toHaveLength(3);
  });
});