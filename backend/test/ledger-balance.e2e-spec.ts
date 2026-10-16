import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Ledger Balance Invariant (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let baseUrl: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.listen(0);

    const server = app.getHttpServer();
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;

    db = app.get(DataSource);

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'AdminPass123!' }),
    });
    const loginBody = (await loginRes.json()) as { accessToken: string };
    adminToken = loginBody.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps debits = credits after creating a new savings account and deposit', async () => {
    const before = await db.query(`
      SELECT
        COALESCE(SUM(debit), 0) AS dr,
        COALESCE(SUM(credit), 0) AS cr
      FROM ledger_entries
    `);
    const drBefore = Number(before[0].dr);
    const crBefore = Number(before[0].cr);
    expect(drBefore).toBe(crBefore);

    const memberRes = await fetch(`${baseUrl}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        memberNo: `E2E-${Date.now()}`,
        fullName: 'E2E Test Member',
      }),
    });
    expect(memberRes.status).toBe(201);
    const member = (await memberRes.json()) as { id: string };

    const accRes = await fetch(`${baseUrl}/savings/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        memberId: member.id,
        accountType: 'mandatory',
      }),
    });
    expect(accRes.status).toBe(201);
    const account = (await accRes.json()) as { id: string };

    const depRes = await fetch(
      `${baseUrl}/savings/accounts/${account.id}/deposits`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          amount: '250.00',
          notes: 'E2E test deposit',
        }),
      },
    );
    expect(depRes.status).toBe(201);

    const after = await db.query(`
      SELECT
        COALESCE(SUM(debit), 0) AS dr,
        COALESCE(SUM(credit), 0) AS cr
      FROM ledger_entries
    `);
    const drAfter = Number(after[0].dr);
    const crAfter = Number(after[0].cr);

    expect(drAfter).toBe(crAfter);
    expect(drAfter - drBefore).toBeCloseTo(250, 2);
    expect(crAfter - crBefore).toBeCloseTo(250, 2);
  });

  it('rejects an unbalanced ledger insert directly via SQL', async () => {
    await expect(
      db.query(`
        INSERT INTO ledger_entries
          (ledger_account_id, debit, credit, ref_type, ref_id)
        VALUES
          (1, 100.00, 100.00, 'bad_test', 9999)
      `),
    ).rejects.toThrow();
  });
});
