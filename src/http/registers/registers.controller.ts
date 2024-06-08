import {Controller, Get, Post, Body, Param, Delete, UsePipes, ValidationPipe, UseGuards} from '@nestjs/common';
import { RegistersService } from './registers.service';
import { CreateRegisterDto } from './dto/create-register.dto';
import {GetRegistersByRangeDateDto} from "./dto/get-registers-by-range-date.dto";
import {AdminGetRegistersByRangeDateDto} from "./dto/admin-get-registers-by-range-date.dto";
import {IsAdminGuard} from "./guards/isAdmin.guard";

@Controller('registers')
export class RegistersController {
  constructor(private readonly registersService: RegistersService) {}

  @Post('/create-register')
  @UsePipes(ValidationPipe)
  async createRegister(@Body() createRegisterDto: CreateRegisterDto) {
    return await this.registersService.createRegister(createRegisterDto);
  }

  @Get('/get-registers')
  getAllRegisters() {
    return this.registersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registersService.findOne(+id);
  }

  @Post('/get-registers-by-rangeData')
  @UsePipes(ValidationPipe)
  async findRegisters(@Body() params: GetRegistersByRangeDateDto) {
    return await this.registersService.findRegistersByRangeTime(
        params.token,
        params.startDate,
        params.endDate);
  }

  @Post('/admin-get-registers-by-rangeData')
  @UsePipes(ValidationPipe)
  @UseGuards(IsAdminGuard)
  async adminFindRegisters(@Body() params: AdminGetRegistersByRangeDateDto) {
    return await this.registersService.adminFindRegistersByRangeTime(
        params.token,
        params.id,
        params.startDate,
        params.endDate);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registersService.remove(+id);
  }
}
