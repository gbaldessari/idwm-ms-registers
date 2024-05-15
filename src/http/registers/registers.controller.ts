import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { RegistersService } from './registers.service';
import { CreateRegisterDto } from './dto/create-register.dto';

@Controller('registers')
export class RegistersController {
  constructor(private readonly registersService: RegistersService) {}

  @Post('/create-register')
  createRegister(@Body() createRegisterDto: CreateRegisterDto) {
    return this.registersService.createRegister(createRegisterDto);
  }

  @Get('get-registers')
  getAllRegisters() {
    return this.registersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registersService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registersService.remove(+id);
  }
}
