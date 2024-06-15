import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateRegisterDto } from './dto/create-register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {Connection, CreateDateColumn, EntityManager, Repository, Between} from 'typeorm';
import { Register } from './entities/register.entity';
import { MsUsersService } from 'src/conection/ms-users.service';
import { throwHttpException } from 'src/utils/exception';
import { I18nService } from 'nestjs-i18n';
import {GetRegistersByRangeDateDto} from "./dto/get-registers-by-range-date.dto";

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
    const today = new Date().toLocaleDateString().split('/').reverse().join('-');

    await this.connection.transaction(

        async (transactionalEntityManager: EntityManager): Promise<void> => {
          try {
            const register: Register = this.registerRepository.create(createRegister);
            const registerToUpdate = await transactionalEntityManager.findOne(Register, {
              where: {
                userId: id,
                date: today,
              },
            });
            if(registerToUpdate){
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

            registerToUpdate.timeExit = new Date().toLocaleTimeString('es-ES', { hour12: false });
            registerToUpdate.latitudeEnd = latitude;
            registerToUpdate.longitudeEnd = longitude;

            await transactionalEntityManager.update(Register, registerToUpdate.id, registerToUpdate);
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

  if(id == null || isNaN(id)) throw new Error('User id not found');
  if(createRegisterDto.isEntry == null) throw new Error('isEntry is required');
  if(createRegisterDto.latitude == null) throw new Error('latitude is required');
  if(createRegisterDto.longitude == null) throw new Error('longitude is required');

  if (createRegisterDto.isEntry==true){
    return this.registerEntry(id, createRegisterDto.latitude, createRegisterDto.longitude);
  } else {
    return this.registerExit(id, createRegisterDto.latitude, createRegisterDto.longitude);
  }
}

  async findRegistersByRangeTime(token?: string, startDate?: string, endDate?: string ) {
    if (!token) throw new BadRequestException('Token is required');
    if (!startDate || !endDate) throw new BadRequestException('startDate y endDate is required');

    const {id} = await this.msUsersService
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

  async adminFindRegistersByRangeTime(idToFind?: number, startDate?: string, endDate?: string) {
    if (!startDate || !endDate) throw new BadRequestException('startDate y endDate is required');

    const registers: Register[] = await this.registerRepository.find({
      where: {
        userId: idToFind,
        date: Between(startDate, endDate)
      }
    });

    if (registers.length === 0) {
      return [];
    }

    return registers;
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

  async updateStartRegister(startDate?: string, id?: number) {
    if(!startDate) throw new BadRequestException('startDate is required');
    if(!id) throw new BadRequestException('id is required');

    try {
      await this.registerRepository.update(id, {
        timeEntry: startDate,
        isAdminEdited: true,
      });
    } catch (e) {
        throw new Error('Error updating start register');
    }
    return startDate;
  }

  async updateEndRegister(endDate?: string, id?: number) {
    if(!endDate) throw new BadRequestException('endDate is required');
    if(!id) throw new BadRequestException('id is required');

    try {
      await this.registerRepository.update(id, {
        timeExit: endDate,
        isAdminEdited: true,
      });
    } catch (e) {
      throw new Error('Error updating start register');
    }
  }
}
