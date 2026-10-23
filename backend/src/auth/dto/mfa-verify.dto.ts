import { IsString, Matches } from 'class-validator';

export class MfaVerifyDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'MFA code must be 6 digits' })
  code!: string;
}