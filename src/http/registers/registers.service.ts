import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { 
  Connection, 
  EntityManager, 
  Repository, 
  Between, 
  Not, 
  IsNull 
} from 'typeorm';
import { 
  differenceInCalendarDays, 
  startOfYear, 
  endOfYear 
} from 'date-fns';
import { CreateRegisterDto } from './dto/create-register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Register } from './entities/register.entity';
import { MsUsersService } from 'src/conection/ms-users.service';
import { throwHttpException } from 'src/utils/exception';
import { I18nService } from 'nestjs-i18n';
import { 
  AdminCreateRegisterDto 
} from './dto/admin-create-resgister.dto';
import { UpdateRegisterDto } from './dto/update-register.dto';
import { 
  GetRegistersByRangeDateDto 
} from './dto/get-registers-by-range-date.dto';
import { 
  AdminGetRegistersByRangeDateDto 
} from './dto/admin-get-registers-by-range-date.dto';
import { Cron } from '@nestjs/schedule';
import { DailysHoursWorked } from './entities/dailyHours.entity';
import { MonthHoursWorked } from './entities/monthHours.entity';
import { locale, tz } from 'moment-timezone';
import 'moment/locale/es';

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

  async createRegister(
    token: string, 
    createRegisterDto: CreateRegisterDto
  ) {
    const { isEntry, latitude, longitude } = createRegisterDto;

    if (!token) throw new Error('Token is required');
    if (isEntry === null) throw new Error('isEntry is required');
    if (!latitude) throw new Error('latitude is required');
    if (!longitude) throw new Error('latitude is required');

    const { id } = await this.msUsersService
      .getAccessToken(token)
      .toPromise();

    if (id == null || isNaN(id)) throw new Error('User id not found');

    if (isEntry) {
      return this.registerEntry(
        id, 
        latitude,
        longitude
      );
    } else {
      return this.registerExit(
        id, 
        latitude,
        longitude
      );
    }
  }

  async adminCreateRegister(
    token: string, 
    adminCreateRegisterDto: AdminCreateRegisterDto
  ) {
    if (!token) throw new Error('Token is required');
    if (!this.adminToken(token)) throw new Error('User is not admin');

    const { id, date } = adminCreateRegisterDto;
    if (!id || id == null || isNaN(id)) {
      throw new Error('Id is required');
    }

    const isValidDate = this.isValidDate(date);
    if (!isValidDate) {
      throw new BadRequestException('Invalid date format');
    }

    return this.adminRegisterCreation(id, date);
  }

  async findRegistersByRangeTime(
    token: string, 
    params: GetRegistersByRangeDateDto
  ) {
    const { startDate, endDate } = params;

    if (!token) throw new Error('Token is required');

    if (!startDate || !endDate) 
      throw new BadRequestException('startDate and endDate is required');

    const isValidStartDate = this.isValidDate(startDate);
    const isValidEndDate = this.isValidDate(endDate);

    if (!isValidStartDate || !isValidEndDate) 
      throw new BadRequestException('Invalid dates format');

    const { id } = await this.msUsersService
      .getAccessToken(token)
      .toPromise();

    if (id == null || isNaN(id)) throw new Error('User id not found');

    const registers: Register[] = await this.registerRepository.find({
      where: {
        userId: id,
        date: Between(startDate, endDate)
      }
    });

    return registers;
  }

  async adminFindRegistersByRangeTime(
    token: string, 
    params: AdminGetRegistersByRangeDateDto
  ) {
    if (!token) throw new Error('Token is required');
    if (!this.adminToken(token)) throw new Error('User is not admin');

    const { id, startDate, endDate } = params;
    if (!startDate || !endDate) 
      throw new BadRequestException('startDate y endDate is required');

    if (!id || id == null || isNaN(id)) 
      throw new BadRequestException('Id is required');

    const isValidStartDate = this.isValidDate(startDate);
    const isValidEndDate = this.isValidDate(endDate);

    if (!isValidStartDate || !isValidEndDate) 
      throw new BadRequestException('Invalid dates format');

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

  async updateStartRegister(token: string, params: UpdateRegisterDto) {
    if (!token) throw new Error('Token is required');
    if (!this.adminToken(token)) throw new Error('User is not admin');

    const { time, id } = params;

    if (!time) throw new BadRequestException('time is required');
    if (!id) throw new BadRequestException('id is required');

    if(!this.isValidTime(time)) 
      throw new BadRequestException('Invalid time format');

    try {
      const result = await this.registerRepository.update(id, {
        timeEntry: time,
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

  async updateEndRegister(token: string, params: UpdateRegisterDto) {
    if (!token) throw new Error('Token is required');
    if (!this.adminToken(token)) throw new Error('User is not admin');

    const { time, id } = params;
    if (!time) throw new BadRequestException('time is required');
    if (!id) throw new BadRequestException('id is required');

    if (!this.isValidTime(time)) 
      throw new BadRequestException('Invalid time format');

    try {
      const result = await this.registerRepository.update(id, {
        timeExit: time,
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

  async getWeekHours(
    token: string, 
    params: AdminGetRegistersByRangeDateDto
  ) {
    if (!token) throw new Error('Token is required');
    if (!this.adminToken(token)) throw new Error('User is not admin');

    const { id, startDate, endDate } = params;

    if (!startDate || !endDate) 
      throw new BadRequestException('startDate and endDate is required');

    if (!id) throw new BadRequestException('id is required');

    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) 
      throw new BadRequestException('Invalid dates format');

    const daysDifference = differenceInCalendarDays(
      new Date(endDate), 
      new Date(startDate)
    );

    if (daysDifference !== 6) {
      throw new Error('Weekly range must be 7 days.');
    }

    const weekHours = await this.dailyHoursRepository.find({
      where: {
        idUser: id,
        date: Between(startDate, endDate),
      }
    });

    return weekHours;
  }

  async getYearHours(
    token: string, 
    params: AdminGetRegistersByRangeDateDto
  ) {
    if (!token) throw new Error('Token is required');
    if (!this.adminToken(token)) throw new Error('User is not admin');

    const { id, startDate, endDate } = params;

    if (!startDate || !endDate) 
      throw new BadRequestException('startDate and endDate is required');

    if (!id) throw new BadRequestException('id is required');

    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) 
      throw new BadRequestException('Invalid dates format');

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!startOfYear(start) || !endOfYear(end)) {
      throw new Error('The range must be a full year.');
    }

    const year = start.getUTCFullYear();

    const yearHours = await this.monthHoursRepository.find({
      where: {
        idUser: id,
        year: year,
      }
    });

    return yearHours;
  }

  @Cron('0 23 * * *')
  async handleCront() {
    const registers: Register[] = await this.registerRepository.find({
      where: {
        dailyHoursCalc: false,
        timeExit: Not(IsNull()),
      }
    });

    for (const register of registers) {
      locale('es');
      const date = tz(register.date ?? '', 'America/Santiago');
      const dayName = date.format('dddd'); 
      const timeEntry = tz(
        `${register.date}T${register.timeEntry}`, 
        'America/Santiago'
      );
      const timeExit = tz(
        `${register.date}T${register.timeExit}`, 
        'America/Santiago'
      );

      const totalMinutes = timeExit.diff(timeEntry, 'minutes');
      const hours = totalMinutes / 60;

      const dailyHours: DailysHoursWorked = {
        idUser: register.userId,
        day: dayName,
        date: date.format(), 
        hoursWorked: parseFloat(hours.toFixed(2)),
      };

      this.dailyHoursRepository.save(dailyHours);
      this.registerRepository.update(
        register.id ?? '', 
        { dailyHoursCalc: true }
      );
    }

    const today = tz('America/Santiago');
    const tomorrow = tz('America/Santiago').add(1, 'days');

    if (tomorrow.month() !== today.month()) {
      const firstDayOfMonth = tz('America/Santiago').startOf('month');
      const lastDayOfMonth = tz('America/Santiago').endOf('month');

      const result = await this.dailyHoursRepository
      .createQueryBuilder("dailyHours")
      .select("dailyHours.idUser")
      .addSelect("SUM(dailyHours.hoursWorked)", "totalHours")
      .where("dailyHours.date BETWEEN :start AND :end", { 
        start: firstDayOfMonth.format('YYYY-MM-DD'), 
        end: lastDayOfMonth.format('YYYY-MM-DD') })
      .andWhere("EXTRACT(ISODOW FROM dailyHours.date) NOT IN (6, 7)")
      .andWhere("dailyHours.monthHoursCalc = :monthHoursCalc", 
        { monthHoursCalc: false })
      .groupBy("dailyHours.idUser")
      .getRawMany();

      const totalWorkdays = this.calculateWorkdays(
        firstDayOfMonth, 
        lastDayOfMonth
      );

      for (const userHours of result) {
        const totalHours = parseFloat(userHours.totalHours);
        const averageHours = totalHours / totalWorkdays;

        const monthHours = {
          idUser: userHours.dailyHours_idUser,
          month: today.month() + 1, 
          year: today.year(),
          hoursWorked: parseFloat(averageHours.toFixed(2))
        };

        await this.monthHoursRepository.save(monthHours);
        await this.dailyHoursRepository.update(
          { idUser: userHours.dailyHours_idUser }, 
          { monthHoursCalc: true } 
        );
      }
    }
  }

  async registerEntry(id: number, latitude: number, longitude: number) {
    const createRegister: Register = {
      userId: id,
      timeExit: undefined,
      latitudeStart: latitude,
      longitudeStart: longitude,
    };
    const today = new Date().toLocaleDateString()
    .split('/')
    .reverse()
    .join('-');

    const register: Register = this.registerRepository.
    create(createRegister);
    const registerToUpdate = await this.registerRepository.
    findOne({
      where: {
        userId: id,
        date: today,
      },
    });
    if (registerToUpdate) {
      return { message: 'Already exist a register of entry today' };
    }

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
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
    return { message: 'Entry registered successfully' };
  }

  async registerExit(id: number, latitude: number, longitude: number) {
    const today = new Date().toLocaleDateString()
    .split('/')
    .reverse()
    .join('-');

    const registerToUpdate = await this.registerRepository.findOne({
      where: {
        userId: id,
        date: today,
      },
    });

    if (!registerToUpdate) {
      return { message: 'No entry registered today' };
    }

    if (registerToUpdate.timeExit !== null) {
      return { message: 'Already exist a register of exit today' };
    }

    registerToUpdate.timeExit = new Date().
      toLocaleTimeString('es-ES', { hour12: false });
    registerToUpdate.latitudeEnd = latitude;
    registerToUpdate.longitudeEnd = longitude;

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
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
    return { message: 'Exit registered successfully' };
  }

  async adminRegisterCreation(userId: number, date: string) {
    const createRegister: Register = {
      userId,
      date,
      timeEntry: "00:00:00",
      timeExit: "00:00:00",
      isAdminEdited: true
    };

    const register = this.registerRepository.create(createRegister);
    const registerToUpdate = await this.registerRepository.findOne({
      where: { userId, date },
    });
    if (registerToUpdate) {
      throw new BadRequestException('Already exist a register of entry today');
    }

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
          await transactionalEntityManager.save(register);
        } catch (error: unknown) {
          throw new InternalServerErrorException('Error to register the entry');
        }
      },
    );
    return userId;
  }

  async adminToken(token: string): Promise<boolean> {
    const { isAdmin } = await this.msUsersService
    .getAccessToken(token)
    .toPromise();
    if (isAdmin === 3) return false;
    return true;
  }

  isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regex)) return false;
    const date = new Date(dateString);
    const timestamp = date.getTime();
    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) return false;
    return dateString === date.toISOString().split('T')[0];
  }

  isValidTime(time: string): boolean {
    const matchesFormat = /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9])$/
    .test(time);
    return matchesFormat;
  }

  calculateWorkdays(start: any, end: any) {
    let count = 0;
    let date = start.clone(); 
  
    while (date <= end) {
      if (date.isoWeekday() < 6) { 
        count++;
      }
      date = date.add(1, 'days');
    }
  
    return count;
  }
}