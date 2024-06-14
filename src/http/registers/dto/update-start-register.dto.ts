import {IsDateString, IsNotEmpty} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";


export class UpdateStartRegisterDto {
    @ApiProperty({
        description: 'Token to mark the user entry or exit',
    })
    @IsNotEmpty()
    id?: number;

    @IsNotEmpty()
    @IsDateString()
    startDate?: string;
}