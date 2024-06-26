import { ApiProperty } from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

export class UpdateRegisterDto {
    @ApiProperty({
        description: 'ID of the register to update',
        type: Number,
        example: 8,
    })
    @IsNotEmpty()
    id!: number;

    @ApiProperty({
        description: 'Time of the register to update',
        type: String,
        example: 'HH:MM:SS',
    })
    @IsNotEmpty()
    @IsString()
    time!: string;

}