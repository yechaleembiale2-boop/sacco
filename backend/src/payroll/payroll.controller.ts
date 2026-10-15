import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import express from 'express';
import { PayrollService } from './payroll.service';
import { GenerateRunDto } from './dto/generate-run.dto';
import { ReconcileDto } from './dto/reconcile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Post('runs')
  @Roles('accountant', 'admin')
  generate(@Body() dto: GenerateRunDto, @CurrentUser() user: User) {
    return this.payroll.generateRun(dto.period, user.id);
  }

  @Get('runs')
  @Roles('accountant', 'auditor', 'admin', 'chairperson')
  list() {
    return this.payroll.listRuns();
  }

  @Get('runs/:id')
  @Roles('accountant', 'auditor', 'admin', 'chairperson')
  getOne(@Param('id') id: string) {
    return this.payroll.getRun(id);
  }

  @Get('runs/:id/export.csv')
  @Roles('accountant', 'admin')
  async exportCsv(@Param('id') id: string, @Res() res: express.Response) {
    const csv = await this.payroll.buildCsv(id);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="payroll-run-${id}.csv"`,
    });
    res.send(csv);
  }

  @Post('runs/:id/reconcile')
  @Roles('accountant', 'admin')
  reconcile(
    @Param('id') id: string,
    @Body() dto: ReconcileDto,
    @CurrentUser() user: User,
  ) {
    return this.payroll.reconcile(id, dto.rows, user.id);
  }
}