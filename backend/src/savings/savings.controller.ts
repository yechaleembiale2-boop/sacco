import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SavingsService } from './savings.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawalDto } from './dto/withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('savings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SavingsController {
  constructor(private readonly savings: SavingsService) {}

  @Post('accounts')
  @Roles('cashier', 'admin')
  openAccount(@Body() dto: CreateAccountDto, @CurrentUser() user: User) {
    return this.savings.openAccount(dto, user.id);
  }

  @Get('accounts')
  @Roles('cashier', 'accountant', 'credit_committee', 'chairperson', 'auditor', 'admin')
  list() {
    return this.savings.listAccounts();
  }

  @Get('accounts/:id')
  @Roles('cashier', 'accountant', 'credit_committee', 'chairperson', 'auditor', 'admin')
  findOne(@Param('id') id: string) {
    return this.savings.findOne(id);
  }

  @Post('accounts/:id/deposits')
  @Roles('cashier', 'admin')
  deposit(
    @Param('id') id: string,
    @Body() dto: DepositDto,
    @CurrentUser() user: User,
  ) {
    return this.savings.deposit(id, dto, user.id);
  }

  @Post('accounts/:id/withdrawals')
  @Roles('cashier', 'admin')
  withdraw(
    @Param('id') id: string,
    @Body() dto: WithdrawalDto,
    @CurrentUser() user: User,
  ) {
    return this.savings.withdraw(id, dto, user.id);
  }
}
