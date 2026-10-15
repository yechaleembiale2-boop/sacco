import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { DisburseLoanDto } from './dto/disburse-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  constructor(private readonly loans: LoansService) {}

  @Post()
  @Roles('cashier', 'admin')
  apply(@Body() dto: CreateLoanDto, @CurrentUser() user: User) {
    return this.loans.apply(dto, user.id);
  }

  @Get()
  @Roles('cashier', 'accountant', 'credit_committee', 'chairperson', 'auditor', 'admin')
  list() {
    return this.loans.listAll();
  }

  @Get(':id')
  @Roles('cashier', 'accountant', 'credit_committee', 'chairperson', 'auditor', 'admin')
  findOne(@Param('id') id: string) {
    return this.loans.findOne(id);
  }

  @Get(':id/schedule')
  @Roles('cashier', 'accountant', 'credit_committee', 'chairperson', 'auditor', 'admin')
  schedule(@Param('id') id: string) {
    return this.loans.getSchedule(id);
  }

  @Post(':id/approve')
  @Roles('credit_committee', 'chairperson', 'admin')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveLoanDto,
    @CurrentUser() user: User,
  ) {
    return this.loans.approve(id, dto, user.id);
  }

  @Post(':id/disburse')
  @Roles('cashier', 'admin')
  disburse(
    @Param('id') id: string,
    @Body() dto: DisburseLoanDto,
    @CurrentUser() user: User,
  ) {
    return this.loans.disburse(id, dto, user.id);
  }

  @Post(':id/repay')
  @Roles('cashier', 'admin')
  repay(
    @Param('id') id: string,
    @Body() dto: RepayLoanDto,
    @CurrentUser() user: User,
  ) {
    return this.loans.repay(id, dto, user.id);
  }
}