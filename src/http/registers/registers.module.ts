import { Module } from '@nestjs/common';
import { RegistersService } from './registers.service';
import { RegistersController } from './registers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Register } from './entities/register.entity';
import { MsUsersService } from 'src/conection/ms-users.service';
import { HttpModule } from '@nestjs/axios';
import { DailysHoursWorked } from './entities/dailyHours.entity';
import { MonthHoursWorked } from './entities/monthHours.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Register, 
      DailysHoursWorked, 
      MonthHoursWorked
    ]), 
    HttpModule
  ],
  controllers: [RegistersController],
  providers: [RegistersService, MsUsersService],
})
export class RegistersModule {}
