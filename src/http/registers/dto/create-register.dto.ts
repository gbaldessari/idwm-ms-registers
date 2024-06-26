import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegisterDto {
  @ApiProperty({
    description: 'Is entry or exit',
    type: Boolean,
    example: true,
  })
  @IsNotEmpty()
  isEntry?: boolean;

  @ApiProperty({
      description: 'Latitude of the register',
      type: Number,
      example: -29.964993332648977,
  })
  @IsNotEmpty()
  latitude?: number;

    @ApiProperty({
        description: 'Longitude of the register',
        type: Number,
        example: -71.34911966555899,
    })
  @IsNotEmpty()
  longitude?: number;
}
