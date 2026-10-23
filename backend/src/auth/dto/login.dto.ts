import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(3, 32)
  username!: string;

  @IsString()
  @Length(8, 128)
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'MFA code must be 6 digits' })
  totpCode?: string;
}