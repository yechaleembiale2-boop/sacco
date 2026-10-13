import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  @Get()
  async check() {
    const rows = await this.db.query('SELECT 1 AS ok');
    return {
      status: 'ok',
      db: rows[0]?.ok === 1 ? 'connected' : 'unknown',
      timestamp: new Date().toISOString(),
    };
  }
}