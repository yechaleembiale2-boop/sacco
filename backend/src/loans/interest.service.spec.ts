import { InterestService } from './interest.service';

describe('InterestService', () => {
  let service: InterestService;

  beforeEach(() => {
    service = new InterestService();
  });

  it('computes the correct total payable for 1000 @ 12% over 6 months', () => {
    const result = service.calculateSchedule('1000.00', '12.000', 6);

    // Reference values from the Day 6 loan in the running system
    expect(result.totalInterest).toBe('35.29');
    expect(result.totalPayable).toBe('1035.29');
    expect(result.rows).toHaveLength(6);
  });

  it('produces 6 equal monthly payments that sum to the total payable', () => {
    const result = service.calculateSchedule('1000.00', '12.000', 6);

    const sum = result.rows.reduce(
      (acc, r) => acc + Number(r.totalDue),
      0,
    );
    expect(sum).toBeCloseTo(1035.29, 1);

    // All rows should have the same total due (equal installment)
    const first = result.rows[0].totalDue;
    for (const row of result.rows) {
      expect(row.totalDue).toBe(first);
    }
  });

  it('sums principal installments back to the original principal', () => {
    const result = service.calculateSchedule('1000.00', '12.000', 6);
    const principalSum = result.rows.reduce(
      (acc, r) => acc + Number(r.principalDue),
      0,
    );
    expect(principalSum.toFixed(2)).toBe('1000.00');
  });

  it('handles 0% interest correctly', () => {
    const result = service.calculateSchedule('1200.00', '0', 12);
    expect(result.totalInterest).toBe('0.00');
    expect(result.totalPayable).toBe('1200.00');
    // Each monthly payment should be exactly 100.00
    for (const row of result.rows) {
      expect(row.principalDue).toBe('100.00');
    }
  });

  it('handles a short 1-month term', () => {
    const result = service.calculateSchedule('100.00', '12.000', 1);
    // One month at 12% annual = 1% monthly = 1.00 interest
    expect(result.rows).toHaveLength(1);
    expect(result.totalPayable).toBe('101.00');
  });

  it('produces descending interest and ascending principal across installments', () => {
    const result = service.calculateSchedule('1000.00', '12.000', 6);
    for (let i = 1; i < result.rows.length; i++) {
      // Interest decreases
      expect(Number(result.rows[i].interestDue)).toBeLessThan(
        Number(result.rows[i - 1].interestDue),
      );
      // Principal increases
      expect(Number(result.rows[i].principalDue)).toBeGreaterThan(
        Number(result.rows[i - 1].principalDue),
      );
    }
  });
});