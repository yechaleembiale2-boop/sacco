import { IsOptional, IsString } from 'class-validator';

export class DisburseLoanDto {
  @IsOptional()
  @IsString()
  notes?: string;
}