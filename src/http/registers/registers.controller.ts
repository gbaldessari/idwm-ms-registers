import { 
  Controller, 
  Post, 
  Body, 
  UsePipes, 
  ValidationPipe, 
  Headers,
  Get,
  Put
} from '@nestjs/common';
import { 
  ApiBody, 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiHeader 
} from '@nestjs/swagger';
import { RegistersService } from './registers.service';
import { CreateRegisterDto } from './dto/create-register.dto';
import { 
  GetRegistersByRangeDateDto 
} from './dto/get-registers-by-range-date.dto';
import { 
  AdminGetRegistersByRangeDateDto 
} from './dto/admin-get-registers-by-range-date.dto';
import { UpdateRegisterDto } from './dto/update-register.dto';
import { 
  AdminCreateRegisterDto 
} from './dto/admin-create-resgister.dto'

@Controller('registers')
@ApiTags('registers')
export class RegistersController {
  constructor(private readonly registersService: RegistersService) { }

  @Post('/create-register')
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: 'Create a new work register' })
  @ApiBody({
    type: CreateRegisterDto,
    description: 'Data for creating a new work register',
  })
  @ApiResponse({ status: 201, description: 'Register successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  async createRegister(
    @Headers ('Authorization') token: string,
    @Body() createRegisterDto: CreateRegisterDto
  ) {
    try {
      return await this.registersService.createRegister(
        token, 
        createRegisterDto
      );
    } catch(e) {
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }

  @Get('/get-registers-by-rangeData')
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: 'Get registers by date range' })
  @ApiBody({
    type: GetRegistersByRangeDateDto,
    description: 'Data for retrieving registers by date range',
  })
  @ApiResponse({ status: 200, description: 'Registers retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  async findRegisters(
    @Headers ('Authorization') token: string,
    @Body() params: GetRegistersByRangeDateDto
  ) {
    try {
      return await this.registersService.findRegistersByRangeTime(
        token, 
        params
      );
    } catch(e) {
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }

  @Get('/admin-get-registers-by-rangeData')
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: 'Admin: Get registers by date range' })
  @ApiBody({
    type: AdminGetRegistersByRangeDateDto,
    description: 'Data for retrieving registers by date range for admin',
  })
  @ApiResponse({ status: 200, description: 'Registers retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  async adminFindRegisters(
    @Headers ('Authorization') token: string,
    @Body() params: AdminGetRegistersByRangeDateDto
  ) {
    try {
      return await this.registersService.adminFindRegistersByRangeTime(
        token, 
        params
      );
    } catch(e) {
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }

  @Post('/admin-create-register')
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: 'Admin: Create a new work register' })
  @ApiBody({
    type: AdminCreateRegisterDto,
    description: 'Data for creating a new work register by admin',
  })
  @ApiResponse({ status: 201, description: 'Register successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  async adminCreateRegister(
    @Headers ('Authorization') token: string,
    @Body() adminCreateRegisterDto: AdminCreateRegisterDto
  ) {
    try {
      return await this.registersService.adminCreateRegister(
        token, 
        adminCreateRegisterDto
      );
    } catch(e) {
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }

  @Put('/update-start-register')
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: 'Update start of a register' })
  @ApiBody({
    type: UpdateRegisterDto,
    description: 'Data for updating the start of a register',
  })
  @ApiResponse({ status: 200, description: 'Register start updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  async updateStartRegister(
    @Headers ('Authorization') token: string,
    @Body() updateRegisterDto: UpdateRegisterDto
  ) {
    try {
      return await this.registersService.updateStartRegister(
        token, 
        updateRegisterDto
      );
    } catch(e) {
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }

  @Put('/update-end-register')
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: 'Update end of a register' })
  @ApiBody({
    type: UpdateRegisterDto,
    description: 'Data for updating the end of a register',
  })
  @ApiResponse({ status: 200, description: 'Register end updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  async updateEndRegister(
    @Headers ('Authorization') token: string,
    @Body() params: UpdateRegisterDto
  ) {
    try {
      return await this.registersService.updateEndRegister(
        token, 
        params
      );
    } catch(e) {
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }

  @Get('/get-hours-week')
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: 'Get work hours for the week' })
  @ApiBody({
    type: AdminGetRegistersByRangeDateDto,
    description: 'Data for retrieving work hours for the week',
  })
  @ApiResponse({ status: 200, description: 'Work hours retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  async getWeekHours(
    @Headers ('Authorization') token: string,
    @Body() params: AdminGetRegistersByRangeDateDto
  ) {
    try {
      return await this.registersService.getWeekHours(token, params);
    } catch(e) {
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }

  @Get('/get-hours-year')
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: 'Get work hours for the year' })
  @ApiBody({
    type: AdminGetRegistersByRangeDateDto,
    description: 'Data for retrieving work hours for the year',
  })
  @ApiResponse({ status: 200, description: 'Work hours retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiHeader({ name: 'Authorization', description: 'Bearer token' })
  async getYearHours(
    @Headers ('Authorization') token: string,
    @Body() params: AdminGetRegistersByRangeDateDto
  ) {
    try {
      return await this.registersService.getYearHours(token, params);
    } catch(e) {
      throw new Error("INTERNAL_SERVER_ERROR");
    }
  }
}