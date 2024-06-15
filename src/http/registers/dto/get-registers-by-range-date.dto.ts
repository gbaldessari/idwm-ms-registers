import { IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetRegistersByRangeDateDto {
    @ApiProperty({
        description: 'User token to obtain the records registers',
        type: String,
    })
    @IsNotEmpty()
    token?: string;

    @ApiProperty({
        description: 'Start date of the range',
        type: String,
        example: '2024-05-01',
    })
    @IsNotEmpty()
    @IsDateString()
    startDate?: string;

    @ApiProperty({
        description: 'End date of the range',
        type: String,
        example: '2024-06-14',
    })
    @IsNotEmpty()
    @IsDateString()
    endDate?: string;
}