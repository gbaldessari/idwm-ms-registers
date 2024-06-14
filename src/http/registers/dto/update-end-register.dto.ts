import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDateString } from 'class-validator';

export class UpdateEndRegisterDto {
    @ApiProperty({
        example: '5f8b9a2b-6b1e-4e9f-8e5f-9f1e8b6a2b5f',
        description: 'Id del registro',
    })
    @IsNotEmpty()
    id?: number;

    @ApiProperty({
        example: '2021-10-10T10:00:00.000Z',
        description: 'Fecha de fin del registro',
    })
    @IsNotEmpty()
    @IsDateString()
    endDate?: string;
}