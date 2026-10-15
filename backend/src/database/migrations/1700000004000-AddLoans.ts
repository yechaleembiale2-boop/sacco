import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoans1700000004000 implements MigrationInterface {
  name = 'AddLoans1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE loans (
        id                  BIGSERIAL PRIMARY KEY,
        member_id           BIGINT NOT NULL REFERENCES members(id),
        loan_type           TEXT NOT NULL
                            CHECK (loan_type IN ('emergency','education','housing')),
        principal           NUMERIC(18,2) NOT NULL CHECK (principal > 0),
        interest_rate       NUMERIC(6,3) NOT NULL CHECK (interest_rate >= 0),
        term_months         INTEGER NOT NULL CHECK (term_months > 0),
        purpose             TEXT,
        status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','approved','rejected',
                                              'disbursed','repaid','defaulted')),
        applied_by          BIGINT NOT NULL REFERENCES users(id),
        applied_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        approved_by         BIGINT REFERENCES users(id),
        approved_at         TIMESTAMPTZ,
        disbursed_by        BIGINT REFERENCES users(id),
        disbursed_at        TIMESTAMPTZ,
        total_interest      NUMERIC(18,2) NOT NULL DEFAULT 0,
        total_payable       NUMERIC(18,2) NOT NULL DEFAULT 0,
        outstanding_balance NUMERIC(18,2) NOT NULL DEFAULT 0
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_loans_member ON loans (member_id, status);
    `);

    await queryRunner.query(`
      CREATE TABLE loan_schedules (
        id              BIGSERIAL PRIMARY KEY,
        loan_id         BIGINT NOT NULL REFERENCES loans(id),
        installment_no  INTEGER NOT NULL,
        due_date        DATE NOT NULL,
        principal_due   NUMERIC(18,2) NOT NULL,
        interest_due    NUMERIC(18,2) NOT NULL,
        total_due       NUMERIC(18,2) NOT NULL,
        paid            BOOLEAN NOT NULL DEFAULT false,
        paid_at         TIMESTAMPTZ,
        UNIQUE (loan_id, installment_no)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE guarantors (
        id          BIGSERIAL PRIMARY KEY,
        loan_id     BIGINT NOT NULL REFERENCES loans(id),
        member_id   BIGINT NOT NULL REFERENCES members(id),
        amount      NUMERIC(18,2) NOT NULL CHECK (amount > 0),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (loan_id, member_id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE guarantors;`);
    await queryRunner.query(`DROP TABLE loan_schedules;`);
    await queryRunner.query(`DROP TABLE loans;`);
  }
}