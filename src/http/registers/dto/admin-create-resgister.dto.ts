import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class AdminCreateRegisterDto {
  @IsNotEmpty()
  id!: number;

  @IsNotEmpty()
  isEntry?: boolean;

  @IsDateString()
  date!: string;

  @IsString()
  @IsNotEmpty()
  time!: string;
}

