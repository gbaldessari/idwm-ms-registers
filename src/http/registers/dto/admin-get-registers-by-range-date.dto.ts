import {IsNotEmpty, IsString, IsDateString, IS_NUMBER} from 'class-validator';

export class AdminGetRegistersByRangeDateDto {
    @IsNotEmpty()
    @IsString()
    token?: string;

    @IsNotEmpty()
    id?: number;

    @IsNotEmpty()
    @IsDateString()
    startDate?: string;

    @IsNotEmpty()
    @IsDateString()
    endDate?: string;
}