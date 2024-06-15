import {IsNotEmpty, IsString} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";


export class UpdateStartRegisterDto {
    @ApiProperty({
        description: 'Token to mark the user entry or exit',
        type: Number,
        example: 8,
    })
    @IsNotEmpty()
    id!: number;

    @ApiProperty({
        description: 'Start date of the register',
        type: String,
        example: 'YYYY-MM-DDThh:mm:ssTZD',
    })
    @IsNotEmpty()
    @IsString()
    startDate?: string;
}