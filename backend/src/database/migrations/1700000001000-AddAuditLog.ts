import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLog1700000001000 implements MigrationInterface {
  name = 'AddAuditLog1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE audit_log (
        id           BIGSERIAL PRIMARY KEY,
        user_id      BIGINT,
        action       TEXT NOT NULL,
        entity       TEXT NOT NULL,
        entity_id    BIGINT,
        before_data  JSONB,
        after_data   JSONB,
        ip_address   TEXT,
        at           TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audit_log_entity
        ON audit_log (entity, entity_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audit_log_at
        ON audit_log (at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE audit_log;`);
  }
}