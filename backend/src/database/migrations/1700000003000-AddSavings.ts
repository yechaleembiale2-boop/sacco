import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSavings1700000003000 implements MigrationInterface {
  name = 'AddSavings1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE savings_accounts (
        id           BIGSERIAL PRIMARY KEY,
        member_id    BIGINT NOT NULL REFERENCES members(id),
        account_type TEXT NOT NULL
                     CHECK (account_type IN ('mandatory','voluntary','share')),
        balance      NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
        opened_at    DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (member_id, account_type)
      );
    `);
    await queryRunner.query(`
      CREATE TABLE savings_transactions (
        id          BIGSERIAL PRIMARY KEY,
        account_id  BIGINT NOT NULL REFERENCES savings_accounts(id),
        txn_type    TEXT NOT NULL CHECK (txn_type IN ('deposit','withdrawal')),
        amount      NUMERIC(18,2) NOT NULL CHECK (amount > 0),
        notes       TEXT,
        posted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by  BIGINT REFERENCES users(id)
      );
    `);
    await queryRunner.query(`
      CREATE INDEX idx_savings_txn_account
        ON savings_transactions (account_id, posted_at DESC);
    `);
    await queryRunner.query(`
      INSERT INTO ledger_accounts (code, name, type) VALUES
        ('1000','Cash',              'asset'),
        ('1100','Bank',              'asset'),
        ('1200','Loans Receivable',  'asset'),
        ('2000','Member Savings',    'liability'),
        ('2100','Share Capital',     'equity'),
        ('4000','Interest Income',   'income'),
        ('4100','Penalty Income',    'income')
      ON CONFLICT (code) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE savings_transactions;`);
    await queryRunner.query(`DROP TABLE savings_accounts;`);
  }
}
