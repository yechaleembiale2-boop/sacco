import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class GuarantorDto {
  @IsString()
  memberId!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;
}

export class CreateLoanDto {
  @IsString()
  memberId!: string;

  @IsIn(['emergency', 'education', 'housing'])
  loanType!: 'emergency' | 'education' | 'housing';

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'principal must be a positive decimal with up to 2 decimals',
  })
  principal!: string;

  @IsInt()
  @Min(1)
  termMonths!: number;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GuarantorDto)
  guarantors!: GuarantorDto[];
}