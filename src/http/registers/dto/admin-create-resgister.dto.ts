import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class AdminCreateRegisterDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID',
    type: String,
    example: 8,
  })
  id!: number;

  @ApiProperty({
    description: 'Date of the register',
    type: String,
    example: '2024-06-14',
  })
  @IsDateString()
  date!: string;
}

