import { IsOptional, IsString } from 'class-validator';

export class ApproveLoanDto {
  @IsOptional()
  @IsString()
  notes?: string;
}