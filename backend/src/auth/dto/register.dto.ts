import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import type { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @IsString()
  @Length(3, 32)
  @Matches(/^[a-z0-9_.-]+$/, {
    message: 'username may only contain lowercase letters, digits, _ . -',
  })
  username!: string;

  @IsString()
  @Length(8, 128)
  password!: string;

  @IsEnum([
    'member',
    'cashier',
    'accountant',
    'credit_committee',
    'chairperson',
    'auditor',
    'admin',
  ] as const)
  role!: UserRole;

  @IsOptional()
  @IsString()
  memberId?: string;
}
