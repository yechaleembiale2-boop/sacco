import {
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly password: PasswordService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
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

  async login(dto: LoginDto): Promise<{ accessToken: string; user: Partial<User> }> {
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

    user.lastLoginAt = new Date();
    await this.usersRepo.save(user);

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
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
}
