import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateRegisterDto } from './dto/create-register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, EntityManager, Repository, Between, Not, IsNull } from 'typeorm';
import { Register } from './entities/register.entity';
import { MsUsersService } from 'src/conection/ms-users.service';
import { throwHttpException } from 'src/utils/exception';
import { I18nService } from 'nestjs-i18n';
import { AdminCreateRegisterDto } from './dto/admin-create-resgister.dto';
import { UpdateStartRegisterDto } from './dto/update-start-register.dto';
import { UpdateEndRegisterDto } from './dto/update-end-register.dto';
import { GetRegistersByRangeDateDto } from './dto/get-registers-by-range-date.dto';
import { 
  AdminGetRegistersByRangeDateDto 
} from './dto/admin-get-registers-by-range-date.dto';
import { Cron } from '@nestjs/schedule';
import { DailysHoursWorked } from './entities/dailyHours.entity';
import { MonthHoursWorked } from './entities/monthHours.entity';
import { differenceInMinutes } from 'date-fns';

@Injectable()
export class RegistersService {
  constructor(
    @InjectRepository(Register)
    private readonly registerRepository: Repository<Register>,
    @InjectRepository(DailysHoursWorked)
    private readonly dailyHoursRepository: Repository<DailysHoursWorked>,
    @InjectRepository(MonthHoursWorked)
    private readonly monthHoursRepository: Repository<MonthHoursWorked>,
    private readonly msUsersService: MsUsersService,
    private readonly connection: Connection,
    private readonly i18n: I18nService,
  ) {}

  async registerEntry(id: number, latitude: number, longitude: number) {
    const createRegister: Register = {
      userId: id,
      timeExit: undefined,
      latitudeStart: latitude,
      longitudeStart: longitude,
    };
    const today = new Date().toLocaleDateString().split('/').reverse().join('-');

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
          const register: Register = this.registerRepository.
          create(createRegister);
          const registerToUpdate = await transactionalEntityManager.
          findOne(Register, {
            where: {
              userId: id,
              date: today,
            },
          });
          if (registerToUpdate) {
            throw new BadRequestException('Already exist a register of entry today');
          }
          await transactionalEntityManager.save(register);
        } catch (error: unknown) {
          return throwHttpException(
            HttpStatus.INTERNAL_SERVER_ERROR,
            await this.i18n.translate('http.ERROR_TRX'),
            { error },
          );
        }
      },
    );
    return id;
  }

  async registerExit(id: number, latitude: number, longitude: number) {
    const today = new Date().toLocaleDateString().split('/').reverse().join('-');

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
          const registerToUpdate = await transactionalEntityManager.findOne(Register, {
            where: {
              userId: id,
              date: today,
            },
          });

          if (!registerToUpdate) {
            throw new BadRequestException('You have not yet registered your entry today.');
          }

          if (registerToUpdate.timeExit !== null) {
            throw new BadRequestException('Already exist a register of exit today');
          }

          registerToUpdate.timeExit = new Date().
            toLocaleTimeString('es-ES', { hour12: false });
          registerToUpdate.latitudeEnd = latitude;
          registerToUpdate.longitudeEnd = longitude;

          await transactionalEntityManager.update(
            Register, 
            registerToUpdate.id, 
            registerToUpdate
          );
        } catch (e) {
          if (e instanceof BadRequestException) {
            throw e;
          } else {
            throw new InternalServerErrorException('Error to register the exit');
          }
        }
      },
    );
  }

  async adminRegisterEntry(id: number, date: string, time: string) {
    const createRegister: Register = {
      userId: id,
      date,
      timeEntry: time,
      timeExit: undefined,
      isAdminEdited: true
    };

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
          const register = this.registerRepository.create(createRegister);
          const registerToUpdate = await transactionalEntityManager.findOne(Register, {
            where: { userId: id, date },
          });
          if (registerToUpdate) {
            throw new BadRequestException('Already exist a register of entry today');
          }
          await transactionalEntityManager.save(register);
        } catch (error: unknown) {
          throw new InternalServerErrorException('Error to register the entry');
        }
      },
    );
    return id;
  }

  async adminRegisterExit(id: number, date: string, time: string) {
    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
          const registerToUpdate = await transactionalEntityManager.findOne(Register, {
            where: { userId: id, date },
          });

          if (!registerToUpdate) {
            throw new BadRequestException('You have not yet registered your entry today.');
          }

          if (registerToUpdate.timeExit !== null) {
            throw new BadRequestException('Already exist a register of exit today');
          }

          registerToUpdate.timeExit = time;
          registerToUpdate.isAdminEdited = true;

          await transactionalEntityManager.update(
            Register, 
            registerToUpdate.id, 
            registerToUpdate
          );
        } catch (e) {
          if (e instanceof BadRequestException) {
            throw e;
          } else {
            throw new InternalServerErrorException('Error to register the exit');
          }
        }
      },
    );
  }

  async createRegister(createRegisterDto: CreateRegisterDto) {
    if (!createRegisterDto.token) throw new Error('Token is required');
    const { id } = await this.msUsersService
      .getAccessToken(createRegisterDto.token)
      .toPromise();

    if (id == null || isNaN(id)) throw new Error('User id not found');
    if (createRegisterDto.isEntry == null) throw new Error('isEntry is required');
    if (createRegisterDto.latitude == null) throw new Error('latitude is required');
    if (createRegisterDto.longitude == null) throw new Error('longitude is required');

    if (createRegisterDto.isEntry) {
      return this.registerEntry(
        id, 
        createRegisterDto.latitude, 
        createRegisterDto.longitude
      );
    } else {
      return this.registerExit(
        id, 
        createRegisterDto.latitude, 
        createRegisterDto.longitude
      );
    }
  }

  async adminCreateRegister(adminCreateRegisterDto: AdminCreateRegisterDto) {
    console.log(adminCreateRegisterDto);
    if (!adminCreateRegisterDto.id) throw new Error('Id is required');
    if (adminCreateRegisterDto.id == null || isNaN(adminCreateRegisterDto.id))
       throw new Error('User id not found');
    if (adminCreateRegisterDto.isEntry == null) throw new Error('isEntry is required');

    const { id, isEntry, date, time } = adminCreateRegisterDto;

    if (isEntry) {
      return this.adminRegisterEntry(id, date, time);
    } else {
      return this.adminRegisterExit(id, date, time);
    }
  }

  async findRegistersByRangeTime(params: GetRegistersByRangeDateDto) {
    const { token, startDate, endDate } = params;
    if (!token) throw new BadRequestException('Token is required');
    if (!startDate || !endDate) 
      throw new BadRequestException('startDate y endDate is required');

    const { id } = await this.msUsersService
      .getAccessToken(token)
      .toPromise();

    const registers: Register[] = await this.registerRepository.find({
      where: {
        userId: id,
        date: Between(startDate, endDate)
      }
    });

    return registers;
  }

  async adminFindRegistersByRangeTime(params: AdminGetRegistersByRangeDateDto) {
    const { id, startDate, endDate } = params;
    if (!startDate || !endDate) 
      throw new BadRequestException('startDate y endDate is required');

    const registers: Register[] = await this.registerRepository.find({
      where: {
        userId: id,
        date: Between(startDate, endDate)
      }
    });

    if (registers.length === 0) {
      return [];
    }

    return registers;
  }

  async updateStartRegister(params: UpdateStartRegisterDto) {
    const { startDate, id } = params;
    if (!startDate) throw new BadRequestException('startDate is required');
    if (!id) throw new BadRequestException('id is required');

    try {
      const result = await this.registerRepository.update(id, {
        timeEntry: startDate,
        isAdminEdited: true,
      });
      if (result.affected === 0) {
        throw new Error('No register found with the given id');
      }
      return { success: true, message: 'Start register updated successfully' };
    } catch (e) {
      throw new Error('Error updating start register');
    }
  }

  async updateEndRegister(params: UpdateEndRegisterDto) {
    const { endDate, id } = params;
    if (!endDate) throw new BadRequestException('endDate is required');
    if (!id) throw new BadRequestException('id is required');

    try {
      const result = await this.registerRepository.update(id, {
        timeExit: endDate,
        isAdminEdited: true,
      });
      if (result.affected === 0) {
        throw new Error('No register found with the given id');
      }
      return { success: true, message: 'End register updated successfully' };
    } catch (e) {
      throw new Error('Error updating end register');
    }
  }

  async findAll() {
    return await this.registerRepository.find();
  }

  async findOne(id: number) {
    console.log(id);
    if (id == null || isNaN(id)) {
      throw new Error('ID cannot be null or undefined');
    }
    return await this.registerRepository.findOneBy({ id });
  }

  async remove(id: number) {
    if (id == null || isNaN(id)) {
      throw new Error('ID cannot be null or undefined');
    }
    const result = await this.registerRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('No register found with this ID');
    }
    return result;
  }

  @Cron('*/5 * * * *')
  async handleCront() {
    const registers: Register[] = await this.registerRepository.
    find({
      where: {
        dailyHoursCalc: false,
        timeEntry: Not(IsNull()),
        timeExit: Not(IsNull()),
        monthHoursCalc: false,
      }
    });
    
    for (const register of registers) {
      const date = new Date(register.date ?? '');
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });

      const timeEntry = new Date(`${register.date}T${register.timeEntry}`);
      const timeExit = new Date(`${register.date}T${register.timeExit}`);

      const totalMinutes = differenceInMinutes(timeExit, timeEntry);
      const hours = totalMinutes / 60;

      const dailyHours: DailysHoursWorked = {
        idUser: register.userId,
        day: dayName,
        date: register.date,
        hoursWorked: parseFloat(hours.toFixed(2)),
      };

      this.dailyHoursRepository.save(dailyHours);
      this.registerRepository.update(register.id ?? '', { dailyHoursCalc: true });
    }

    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    if (tomorrow.getMonth() !== today.getMonth()) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const result = await this.dailyHoursRepository
        .createQueryBuilder("dailyHours")
        .select("dailyHours.idUser")
        .addSelect("AVG(dailyHours.hoursWorked)", "averageHours")
        .where("dailyHours.date BETWEEN :start AND :end", { 
          start: firstDayOfMonth, 
          end: lastDayOfMonth })
        .groupBy("dailyHours.idUser")
        .getRawMany();
      
      for (const userHours of result) {
        const monthHours = {
          idUser: userHours.idUser,
          month: today.getMonth() + 1,
          year: today.getFullYear(),
          hoursWorked: parseFloat(userHours.averageHours.toFixed(2))
        }

        await this.monthHoursRepository.save(monthHours);
      }
    }

  }

}


