import { Controller, Get, Post, Body, Param, Delete, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { RegistersService } from './registers.service';
import { CreateRegisterDto } from './dto/create-register.dto';
import { GetRegistersByRangeDateDto } from "./dto/get-registers-by-range-date.dto";
import { AdminGetRegistersByRangeDateDto } from "./dto/admin-get-registers-by-range-date.dto";
import { IsAdminGuard } from "./guards/isAdmin.guard";
import { UpdateStartRegisterDto } from "./dto/update-start-register.dto";
import { UpdateEndRegisterDto } from "./dto/update-end-register.dto";
import { AdminCreateRegisterDto } from './dto/admin-create-resgister.dto';

@Controller('registers')
export class RegistersController {
  constructor(private readonly registersService: RegistersService) { }

  @Post('/create-register')
  @UsePipes(ValidationPipe)
  async createRegister(@Body() createRegisterDto: CreateRegisterDto) {
    return await this.registersService.createRegister(createRegisterDto);
  }

  @Post('/admin-create-register')
  @UsePipes(ValidationPipe)
  async adminCreateRegister(@Body() adminCreateRegisterDto: AdminCreateRegisterDto) {
    return await this.registersService.adminCreateRegister(adminCreateRegisterDto);
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
  async adminFindRegisters(@Body() params: AdminGetRegistersByRangeDateDto) {
    return await this.registersService.adminFindRegistersByRangeTime(
      params.id,
      params.startDate,
      params.endDate
    );
  }

  @Post('/update-start-register')
  @UsePipes(ValidationPipe)
  async updateStartRegister(@Body() params: UpdateStartRegisterDto) {
    return await this.registersService.updateStartRegister(params.startDate, params.id);
  }

  @Post('/update-end-register')
  @UsePipes(ValidationPipe)
  async updateEndRegister(@Body() params: UpdateEndRegisterDto) {
    return await this.registersService.updateEndRegister(params.endDate, params.id);
  }

}
