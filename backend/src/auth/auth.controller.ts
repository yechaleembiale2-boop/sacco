import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      memberId: user.memberId,
      mfaEnabled: user.mfaEnabled,
    };
  }

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  setupMfa(@CurrentUser() user: User) {
    return this.auth.setupMfa(user.id);
  }

  @Post('mfa/verify-setup')
  @UseGuards(JwtAuthGuard)
  verifyMfaSetup(@CurrentUser() user: User, @Body() dto: MfaVerifyDto) {
    return this.auth.verifyMfaSetup(user.id, dto.code);
  }

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  disableMfa(@CurrentUser() user: User, @Body() body: { password: string }) {
    return this.auth.disableMfa(user.id, body.password);
  }
}