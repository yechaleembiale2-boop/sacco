import { IsString, Matches } from 'class-validator';

export class RepayLoanDto {
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;
}