import { IsDateString, IsNotEmpty } from 'class-validator';

export class AdminCreateRegisterDto {
  @IsNotEmpty()
  id!: number;

  @IsDateString()
  date!: string;
}

