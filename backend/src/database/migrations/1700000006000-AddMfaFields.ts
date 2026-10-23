import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMfaFields1700000006000 implements MigrationInterface {
  name = 'AddMfaFields1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN totp_secret TEXT,
      ADD COLUMN mfa_enrolled_at TIMESTAMPTZ;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN totp_secret,
      DROP COLUMN mfa_enrolled_at;
    `);
  }
}