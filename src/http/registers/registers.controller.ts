import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UsePipes, 
  ValidationPipe, 
  UseGuards, 
  Delete
} from '@nestjs/common';
import { RegistersService } from './registers.service';
import { CreateRegisterDto } from './dto/create-register.dto';
import { GetRegistersByRangeDateDto } from "./dto/get-registers-by-range-date.dto";
import { AdminGetRegistersByRangeDateDto } from "./dto/admin-get-registers-by-range-date.dto";
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
  async adminCreateRegister(
    @Body() adminCreateRegisterDto: AdminCreateRegisterDto
  ) {
    return await this.registersService.adminCreateRegister(adminCreateRegisterDto);
  }

  @Get('/get-registers')
  async getAllRegisters() {
    return await this.registersService.findAll();
  }

  @Get('get-register')
  async findOne(@Param('id') id: string) {
    return await this.registersService.findOne(+id);
  }

  @Post('/get-registers-by-rangeData')
  @UsePipes(ValidationPipe)
  async findRegisters(@Body() params: GetRegistersByRangeDateDto) {
    return await this.registersService.findRegistersByRangeTime(params);
  }

  @Post('/admin-get-registers-by-rangeData')
  @UsePipes(ValidationPipe)
  async adminFindRegisters(@Body() params: AdminGetRegistersByRangeDateDto) {
    return await this.registersService.adminFindRegistersByRangeTime(params);
  }

  @Post('/update-start-register')
  @UsePipes(ValidationPipe)
  async updateStartRegister(@Body() params: UpdateStartRegisterDto) {
    return await this.registersService.updateStartRegister(params);
  }

  @Post('/update-end-register')
  @UsePipes(ValidationPipe)
  async updateEndRegister(@Body() params: UpdateEndRegisterDto) {
    return await this.registersService.updateEndRegister(params);
  }

  @Delete('/delete-register')
  async deleteRegister(@Body() id: number) {
    return await this.registersService.remove(id);
  }

}
