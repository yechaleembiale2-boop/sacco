import { IsOptional, IsString, Matches } from 'class-validator';

export class WithdrawalDto {
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a positive decimal with up to 2 decimal places',
  })
  amount!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
