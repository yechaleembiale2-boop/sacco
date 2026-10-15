import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayroll1700000005000 implements MigrationInterface {
  name = 'AddPayroll1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE payroll_runs (
        id             BIGSERIAL PRIMARY KEY,
        period         TEXT NOT NULL UNIQUE,     -- e.g. "2026-10"
        generated_by   BIGINT NOT NULL REFERENCES users(id),
        generated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        total_amount   NUMERIC(18,2) NOT NULL DEFAULT 0,
        total_items    INTEGER NOT NULL DEFAULT 0,
        status         TEXT NOT NULL DEFAULT 'generated'
                       CHECK (status IN ('generated','submitted','reconciled')),
        reconciled_at  TIMESTAMPTZ,
        reconciled_by  BIGINT REFERENCES users(id),
        notes          TEXT
      );
    `);

    await queryRunner.query(`
      CREATE TABLE payroll_run_items (
        id                   BIGSERIAL PRIMARY KEY,
        run_id               BIGINT NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
        member_id            BIGINT NOT NULL REFERENCES members(id),
        savings_account_id   BIGINT REFERENCES savings_accounts(id),
        loan_id              BIGINT REFERENCES loans(id),
        savings_amount       NUMERIC(18,2) NOT NULL DEFAULT 0,
        loan_amount          NUMERIC(18,2) NOT NULL DEFAULT 0,
        total_amount         NUMERIC(18,2) NOT NULL DEFAULT 0,
        reconciled           BOOLEAN NOT NULL DEFAULT false,
        UNIQUE (run_id, member_id)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_payroll_items_run ON payroll_run_items (run_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE payroll_run_items;`);
    await queryRunner.query(`DROP TABLE payroll_runs;`);
  }
}