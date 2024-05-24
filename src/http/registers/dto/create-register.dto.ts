import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegisterDto {
  @ApiProperty({
    description: 'Token to verify the user',
  })
  @IsNotEmpty()
  token?: string;

  @IsNotEmpty()
  isEntry?: boolean;
}
