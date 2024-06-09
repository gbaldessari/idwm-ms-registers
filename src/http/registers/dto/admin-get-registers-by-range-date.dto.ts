import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class AdminGetRegistersByRangeDateDto {
  @IsNotEmpty()
  id!: number;

  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @IsNotEmpty()
  @IsDateString()
  endDate!: string;
}
