import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { PasswordService } from '../users/password.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';
import { TotpService } from './totp.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly password: PasswordService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly totp: TotpService,
  ) {}

  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.usersRepo.findOne({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException(`Username "${dto.username}" is taken`);
    }

    const user = this.usersRepo.create({
      username: dto.username,
      passwordHash: await this.password.hash(dto.password),
      role: dto.role,
      memberId: dto.memberId ?? null,
      isActive: true,
    });

    const saved = await this.usersRepo.save(user);

    await this.audit.record({
      userId: saved.id,
      action: 'register',
      entity: 'user',
      entityId: saved.id,
      afterData: { username: saved.username, role: saved.role },
    });

    return saved;
  }

  /**
   * Login — supports two-step flow for MFA-enabled users:
   *
   * 1st call: { username, password } → returns { mfaRequired: true, userId }
   * 2nd call: { username, password, totpCode } → returns { accessToken, user }
   */
  async login(dto: LoginDto): Promise<{
    accessToken?: string;
    user?: { id: string; username: string; role: string };
    mfaRequired?: boolean;
    userId?: string;
  }> {
    const user = await this.usersRepo.findOne({
      where: { username: dto.username },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await this.password.verify(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If user has MFA enabled
    if (user.mfaEnabled && user.totpSecret) {
      // If no code provided yet → ask for it
      if (!dto.totpCode) {
        return {
          mfaRequired: true,
          userId: user.id,
        };
      }

      // Verify the code
      if (!this.totp.verify(user.totpSecret, dto.totpCode)) {
        await this.audit.record({
          userId: user.id,
          action: 'mfa_failed',
          entity: 'user',
          entityId: user.id,
        });
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Success — issue token
    user.lastLoginAt = new Date();
    await this.usersRepo.save(user);

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
      memberId: user.memberId,
    });

    await this.audit.record({
      userId: user.id,
      action: 'login',
      entity: 'user',
      entityId: user.id,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  /**
   * Setup MFA for a user.
   * Returns a QR code the user scans with their authenticator app.
   */
  async setupMfa(userId: string): Promise<{
    secret: string;
    otpauthUrl: string;
    qrDataUrl: string;
  }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.mfaEnabled && user.totpSecret) {
      throw new BadRequestException('MFA is already enabled');
    }

    const setup = await this.totp.generateSetup(user.username);

    // Store the secret (but don't enable MFA yet — user must verify first)
    user.totpSecret = setup.secret;
    await this.usersRepo.save(user);

    await this.audit.record({
      userId: user.id,
      action: 'mfa_setup_initiated',
      entity: 'user',
      entityId: user.id,
    });

    return setup;
  }

  /**
   * Verify the MFA setup with the first code from the authenticator app.
   * If valid → enables MFA for the user.
   */
  async verifyMfaSetup(userId: string, code: string): Promise<{ success: boolean }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || !user.totpSecret) {
      throw new BadRequestException('MFA setup not started');
    }

    if (!this.totp.verify(user.totpSecret, code)) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    user.mfaEnabled = true;
    user.mfaEnrolledAt = new Date();
    await this.usersRepo.save(user);

    await this.audit.record({
      userId: user.id,
      action: 'mfa_enabled',
      entity: 'user',
      entityId: user.id,
    });

    return { success: true };
  }

  /**
   * Disable MFA (requires password confirmation).
   */
  async disableMfa(userId: string, password: string): Promise<{ success: boolean }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const ok = await this.password.verify(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid password');
    }

    user.mfaEnabled = false;
    user.totpSecret = null;
    user.mfaEnrolledAt = null;
    await this.usersRepo.save(user);

    await this.audit.record({
      userId: user.id,
      action: 'mfa_disabled',
      entity: 'user',
      entityId: user.id,
    });

    return { success: true };
  }
}