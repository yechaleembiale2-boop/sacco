import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsers1700000002000 implements MigrationInterface {
  name = 'AddUsers1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id             BIGSERIAL PRIMARY KEY,
        member_id      BIGINT REFERENCES members(id),
        username       TEXT UNIQUE NOT NULL,
        password_hash  TEXT NOT NULL,
        role           TEXT NOT NULL CHECK (role IN (
                         'member','cashier','accountant',
                         'credit_committee','chairperson','auditor','admin'
                       )),
        mfa_enabled    BOOLEAN NOT NULL DEFAULT false,
        is_active      BOOLEAN NOT NULL DEFAULT true,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_login_at  TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_users_username ON users (username);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE users;`);
  }
}
