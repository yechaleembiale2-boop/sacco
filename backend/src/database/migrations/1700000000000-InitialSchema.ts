import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE members (
        id           BIGSERIAL PRIMARY KEY,
        member_no    TEXT UNIQUE NOT NULL,
        full_name    TEXT NOT NULL,
        phone        TEXT,
        email        TEXT,
        national_id  TEXT,
        status       TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','suspended','closed')),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE ledger_accounts (
        id    BIGSERIAL PRIMARY KEY,
        code  TEXT UNIQUE NOT NULL,
        name  TEXT NOT NULL,
        type  TEXT NOT NULL
              CHECK (type IN ('asset','liability','equity','income','expense'))
      );
    `);

    await queryRunner.query(`
      CREATE TABLE ledger_entries (
        id                  BIGSERIAL PRIMARY KEY,
        ledger_account_id   BIGINT NOT NULL REFERENCES ledger_accounts(id),
        debit               NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (debit  >= 0),
        credit              NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
        ref_type            TEXT NOT NULL,
        ref_id              BIGINT NOT NULL,
        posted_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        reverses_entry_id   BIGINT REFERENCES ledger_entries(id),
        CHECK (
          (debit > 0 AND credit = 0) OR
          (credit > 0 AND debit = 0)
        )
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_ledger_entries_ref
        ON ledger_entries (ref_type, ref_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ledger_entries;`);
    await queryRunner.query(`DROP TABLE ledger_accounts;`);
    await queryRunner.query(`DROP TABLE members;`);
  }
}