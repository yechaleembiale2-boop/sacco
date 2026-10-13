import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Post()
  @Roles('cashier', 'admin')
  create(@Body() dto: CreateMemberDto, @CurrentUser() user: User) {
    return this.members.create(dto, user.id);
  }

  @Get()
  @Roles('cashier', 'accountant', 'credit_committee', 'chairperson', 'auditor', 'admin')
  findAll() {
    return this.members.findAll();
  }

  @Get(':id')
  @Roles('cashier', 'accountant', 'credit_committee', 'chairperson', 'auditor', 'admin')
  findOne(@Param('id') id: string) {
    return this.members.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: User,
  ) {
    return this.members.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.members.softDelete(id, user.id);
  }
}