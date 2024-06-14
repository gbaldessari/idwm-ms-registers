import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegisterDto {
  @ApiProperty({
    description: 'Token to mark the user entry or exit',
  })
  @IsNotEmpty()
  token?: string;

  @IsNotEmpty()
  isEntry?: boolean;

  @IsNotEmpty()
  latitude?: number;

  @IsNotEmpty()
  longitude?: number;
}
