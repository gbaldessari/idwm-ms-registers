import { Module } from '@nestjs/common';
import { RegistersService } from './registers.service';
import { RegistersController } from './registers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Register } from './entities/register.entity';
import { MsUsersService } from 'src/conection/ms-users.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Register]), HttpModule],
  controllers: [RegistersController],
  providers: [RegistersService, MsUsersService],
})
export class RegistersModule {}
