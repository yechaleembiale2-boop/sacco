import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Post()
  create(@Body() dto: CreateMemberDto) {
    // TODO(day-4): pass actorUserId from JWT
    return this.members.create(dto);
  }

  @Get()
  findAll() {
    return this.members.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.members.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.members.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.members.softDelete(id);
  }
}