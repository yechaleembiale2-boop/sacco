import { BadRequestException } from '@nestjs/common';
import { SavingsService } from './savings.service';
import { SavingsAccount } from './savings-account.entity';
import { SavingsTransaction } from './savings-transaction.entity';

describe('SavingsService — balance validation', () => {
  let service: SavingsService;

  beforeEach(() => {
    const mockAccountsRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const mockTxnRepo = { find: jest.fn() };
    const mockLedger = { post: jest.fn() };
    const mockAudit = { record: jest.fn() };

    const mockDataSource = {
      transaction: jest.fn(async (cb) => {
        const tx = {
          getRepository: jest.fn((entity: unknown) => {
            if (entity === SavingsAccount) {
              return {
                findOne: jest.fn().mockResolvedValue({
                  id: '1',
                  balance: '100.00',
                }),
                save: jest.fn((a) => Promise.resolve(a)),
              };
            }
            if (entity === SavingsTransaction) {
              return {
                create: jest.fn((x) => x),
                save: jest.fn((x) => Promise.resolve({ ...x, id: '99' })),
              };
            }
            return {};
          }),
        };
        return cb(tx);
      }),
    };

    service = new SavingsService(
      mockAccountsRepo as never,
      mockTxnRepo as never,
      mockLedger as never,
      mockAudit as never,
      mockDataSource as never,
    );
  });

  it('rejects a withdrawal larger than the current balance', async () => {
    await expect(
      service.withdraw('1', { amount: '500.00' }, '1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows a withdrawal within the balance', async () => {
    const result = await service.withdraw('1', { amount: '50.00' }, '1');
    expect(result.account.balance).toBe('50.00');
  });
});