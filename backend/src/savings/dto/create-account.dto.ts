import { IsIn, IsString } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  memberId!: string;

  @IsIn(['mandatory', 'voluntary', 'share'])
  accountType!: 'mandatory' | 'voluntary' | 'share';
}
