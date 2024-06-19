import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateRegisterDto } from './dto/create-register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Connection, EntityManager, Repository } from 'typeorm';
import { Register } from './entities/register.entity';
import { MsUsersService } from 'src/conection/ms-users.service';
import { throwHttpException } from 'src/utils/exception';
import { I18nService } from 'nestjs-i18n';
import { AdminCreateRegisterDto } from './dto/admin-create-resgister.dto';

@Injectable()
export class RegistersService {
  constructor(
    @InjectRepository(Register)
    private readonly registerRepository: Repository<Register>,
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
    const today = new Date()
      .toLocaleDateString()
      .split('/')
      .reverse()
      .join('-');

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
          const register: Register =
            this.registerRepository.create(createRegister);
          const registerToUpdate = await transactionalEntityManager.findOne(
            Register,
            {
              where: {
                userId: id,
                date: today,
              },
            },
          );
          if (registerToUpdate) {
            throw new BadRequestException(
              'Already exist a register of entry today',
            );
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
    const today = new Date()
      .toLocaleDateString()
      .split('/')
      .reverse()
      .join('-');

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
          const registerToUpdate = await transactionalEntityManager.findOne(
            Register,
            {
              where: {
                userId: id,
                date: today,
              },
            },
          );

          if (!registerToUpdate) {
            throw new BadRequestException(
              'You have not yet registered your entry today.',
            );
          }

          if (registerToUpdate.timeExit !== null) {
            throw new BadRequestException(
              'Already exist a register of exit today',
            );
          }

          registerToUpdate.timeExit = new Date().toLocaleTimeString('es-ES', {
            hour12: false,
          });
          registerToUpdate.latitudeEnd = latitude;
          registerToUpdate.longitudeEnd = longitude;

          await transactionalEntityManager.update(
            Register,
            registerToUpdate.id,
            registerToUpdate,
          );
        } catch (e) {
          if (e instanceof BadRequestException) {
            throw e;
          } else {
            throw new InternalServerErrorException(
              'Error to register the exit',
            );
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
      isAdminEdited: true,
    };

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
          const register = this.registerRepository.create(createRegister);
          const registerToUpdate = await transactionalEntityManager.findOne(
            Register,
            {
              where: { userId: id, date },
            },
          );
          if (registerToUpdate) {
            throw new BadRequestException(
              'Already exist a register of entry today',
            );
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
          const registerToUpdate = await transactionalEntityManager.findOne(
            Register,
            {
              where: { userId: id, date },
            },
          );

          if (!registerToUpdate) {
            throw new BadRequestException(
              'You have not yet registered your entry today.',
            );
          }

          if (registerToUpdate.timeExit !== null) {
            throw new BadRequestException(
              'Already exist a register of exit today',
            );
          }

          registerToUpdate.timeExit = time;
          registerToUpdate.isAdminEdited = true;

          await transactionalEntityManager.update(
            Register,
            registerToUpdate.id,
            registerToUpdate,
          );
        } catch (e) {
          if (e instanceof BadRequestException) {
            throw e;
          } else {
            throw new InternalServerErrorException(
              'Error to register the exit',
            );
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
    if (createRegisterDto.isEntry == null)
      throw new Error('isEntry is required');
    if (createRegisterDto.latitude == null)
      throw new Error('latitude is required');
    if (createRegisterDto.longitude == null)
      throw new Error('longitude is required');

    if (createRegisterDto.isEntry) {
      return this.registerEntry(
        id,
        createRegisterDto.latitude,
        createRegisterDto.longitude,
      );
    } else {
      return this.registerExit(
        id,
        createRegisterDto.latitude,
        createRegisterDto.longitude,
      );
    }
  }

  async adminCreateRegister(adminCreateRegisterDto: AdminCreateRegisterDto) {
    if (!adminCreateRegisterDto.id) throw new Error('Id is required');
    if (isNaN(adminCreateRegisterDto.id)) throw new Error('User id not found');
    if (adminCreateRegisterDto.isEntry == null)
      throw new Error('isEntry is required');

    const { id, isEntry, date, time } = adminCreateRegisterDto;

    if (isEntry) {
      return this.adminRegisterEntry(id, date, time);
    } else {
      return this.adminRegisterExit(id, date, time);
    }
  }

  async findRegistersByRangeTime(
    token?: string,
    startDate?: string,
    endDate?: string,
  ) {
    if (!token) throw new BadRequestException('Token is required');
    if (!startDate || !endDate)
      throw new BadRequestException('startDate y endDate is required');

    const { id } = await this.msUsersService.getAccessToken(token).toPromise();

    const registers: Register[] = await this.registerRepository.find({
      where: {
        userId: id,
        date: Between(startDate, endDate),
      },
    });

    return registers;
  }

  async adminFindRegistersByRangeTime(
    idToFind?: number,
    startDate?: string,
    endDate?: string,
  ) {
    if (!startDate || !endDate)
      throw new BadRequestException('startDate y endDate is required');

    const registers: Register[] = await this.registerRepository.find({
      where: {
        userId: idToFind,
        date: Between(startDate, endDate),
      },
    });

    if (registers.length === 0) {
      return [];
    }

    return registers;
  }

  async updateStartRegister(startDate: string, id: number) {
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

  async updateEndRegister(endDate: string, id: number) {
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

  convertToTime(decimalTime: number) {
    const hours = Math.floor(decimalTime);
    const minutes = Math.floor((decimalTime - hours) * 60);
    const seconds = Math.round(((decimalTime - hours) * 60 - minutes) * 60);

    return `${hours}:${minutes}:${seconds}`;
  }

  async statisticUserPerDay(id: number, startDate: string, endDate: string) {
    if (!startDate || !endDate)
      throw new BadRequestException('startDate y endDate is required');
    if (!id) throw new BadRequestException('id is required');

    return await this.registerRepository
      .createQueryBuilder('register')
      .select(['register'])
      .addSelect(
        'EXTRACT(EPOCH FROM (register.timeExit - register.timeEntry))/3600',
        'hoursTotal',
      )
      .where('register.userId = :id', { id })
      .andWhere('register.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .getRawMany();
  }

  async getStatisticUserPerDay(id: number, startDate: string, endDate: string) {
    if (!startDate || !endDate)
      throw new BadRequestException('startDate y endDate is required');
    if (!id) throw new BadRequestException('id is required');

    const registers = await this.statisticUserPerDay(id, startDate, endDate);

    for (const register of registers) {
      register.hoursTotal = this.convertToTime(register.hoursTotal);
    }
    return registers;
  }

  calcBusinessDays(startDate: string, endDate: string): number {
    //total of business day by { month : first day of the month [dom - sab] }
    const business: { [key: string]: number[] } = {
      '31': [22, 23, 23, 23, 22, 21, 21],
      '30': [21, 22, 22, 22, 22, 21, 20],
      '29': [20, 21, 21, 21, 21, 21, 20],
      '28': [20, 20, 20, 20, 20, 20, 20],
    };

    const daysOfMonth = endDate.split('-')[2];

    const arrayStartDate = startDate.split('-');
    const firstDay: number = new Date(
      +arrayStartDate[0],
      +arrayStartDate[1] - 1,
      +arrayStartDate[2],
    ).getDay();

    return business[daysOfMonth][firstDay];
  }

  async getStatisticUserPerMonth(
    id: number,
    startDate: string,
    endDate: string,
  ) {
    if (!startDate || !endDate)
      throw new BadRequestException('startMonth y endMonth is required');
    if (!id) throw new BadRequestException('id is required');

    // const arrayEndDate = endDate.split('-');
    // const arrayStartDate = startDate.split('-');
    // const firstDay: number = new Date(
    //   +arrayStartDate[0],
    //   +arrayStartDate[1] - 1,
    //   +arrayStartDate[2],
    // ).getDay();
    // const daysOfMonth: string = arrayEndDate[2];

    //(days of the month) - wekends
    const businessDays = this.calcBusinessDays(startDate, endDate);

    const registers = this.statisticUserPerDay(id, startDate, endDate);
    let hours = 0;
    for (const register of await registers) {
      hours += parseFloat(register.hoursTotal);
      console.log(register.hoursTotal, hours);
    }
    console.log(
      'hours: ' +
        this.convertToTime(hours) +
        '\nbusinessDays: ' +
        businessDays +
        '\nMean: ' +
        hours / businessDays,
    );
    return this.convertToTime(hours / businessDays);
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

  remove() {}
}
