import {
  IsArray,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReconcileRowDto {
  @IsString()
  memberNo!: string;

  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;
}

export class ReconcileDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReconcileRowDto)
  rows!: ReconcileRowDto[];
}