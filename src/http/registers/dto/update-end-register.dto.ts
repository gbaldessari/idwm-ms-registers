import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDateString } from 'class-validator';

export class UpdateEndRegisterDto {
    @ApiProperty({
        description: 'Id del registro',
    })
    @IsNotEmpty()
    id!: number;

    @IsNotEmpty()
    @IsDateString()
    endDate!: string;
}