import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import express from 'express';
import { ReportsService } from './reports.service';
import { ExcelService } from './excel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly excel: ExcelService,
  ) {}

  @Get('trial-balance')
  @Roles('accountant', 'auditor', 'admin', 'chairperson')
  trialBalance() {
    return this.reports.trialBalance();
  }

  @Get('trial-balance/export.xlsx')
  @Roles('accountant', 'auditor', 'admin', 'chairperson')
  async trialBalanceExcel(@Res() res: express.Response) {
    const rows = await this.reports.trialBalance();
    const buffer = await this.excel.trialBalanceToBuffer(rows);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="trial-balance.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('income-statement')
  @Roles('accountant', 'auditor', 'admin', 'chairperson')
  incomeStatement() {
    return this.reports.incomeStatement();
  }

  @Get('portfolio-at-risk')
  @Roles('credit_committee', 'chairperson', 'admin', 'auditor')
  portfolioAtRisk() {
    return this.reports.portfolioAtRisk();
  }

  @Get('defaulters')
  @Roles('credit_committee', 'chairperson', 'admin', 'auditor')
  defaulters() {
    return this.reports.defaulters();
  }

  @Get('savings-summary')
  @Roles('accountant', 'auditor', 'admin', 'chairperson')
  savingsSummary() {
    return this.reports.savingsSummary();
  }

  @Get('dividend')
  @Roles('accountant', 'chairperson', 'admin')
  dividend(
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    const y = year ?? new Date().getFullYear();
    return this.reports.dividend(y);
  }
}