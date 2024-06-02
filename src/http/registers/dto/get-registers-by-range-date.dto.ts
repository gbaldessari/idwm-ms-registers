import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class GetRegistersByRangeDateDto {
    @IsNotEmpty()
    token?: string;

    @IsNotEmpty()
    @IsDateString()
    startDate?: string;

    @IsNotEmpty()
    @IsDateString()
    endDate?: string;
}