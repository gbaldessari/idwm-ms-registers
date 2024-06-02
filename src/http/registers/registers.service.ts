import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateRegisterDto } from './dto/create-register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {Connection, CreateDateColumn, EntityManager, Repository} from 'typeorm';
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

  async createRegister(createRegisterDto: CreateRegisterDto) {
    if (!createRegisterDto.token) throw new Error('Token is required');
    const {id} = await this.msUsersService
        .getAccessToken(createRegisterDto.token)
        .toPromise();


    if (createRegisterDto.isEntry) {
      const createRegister: Register = {
        userId: id,
        timeExit: undefined,
      };

      await this.connection.transaction(
          async (transactionalEntityManager: EntityManager): Promise<void> => {
            try {
              const register: Register =
                  this.registerRepository.create(createRegister);
              await transactionalEntityManager.save(register);
            } catch (error: unknown) {
              return throwHttpException(
                  HttpStatus.INTERNAL_SERVER_ERROR,
                  await this.i18n.translate('http.ERROR_TRX'),
                  {error},
              );
            }
          },
      );
      return id;

    } else {
      const today = new Date().toLocaleDateString().split('/').reverse().join('-');

      await this.connection.transaction(
          async (transactionalEntityManager: EntityManager): Promise<void> => {
            try {
              const registerToUpdate = await transactionalEntityManager.findOne(Register, {
                where: {
                  userId: id,
                  date: today,

                }
              });

              if (!registerToUpdate) {
                throw new BadRequestException('Not exist register today');
              }

              if (registerToUpdate.timeExit !== null) {
                throw new BadRequestException('Already exist a register of exit today');
              }

              registerToUpdate.timeExit = new Date().toLocaleTimeString('es-ES', { hour12: false });

              await transactionalEntityManager.update(Register, registerToUpdate.id, registerToUpdate);


            } catch (e) {
              if (e instanceof BadRequestException) {
                throw e;
              } else {
                throw new InternalServerErrorException('Error to register the exit');
              }
            }
          }
      );
    }
  }

    async findRegistersByRangeTime(token?: string, startDate?: string, endDate?: string ) {
      if (!token) throw new BadRequestException('Token is required');
      if (!startDate || !endDate) throw new BadRequestException('startDate y endDate is required');

      const {id} = await this.msUsersService
          .getAccessToken(token)
          .toPromise();

      const registers: Promise<Register[]> = this.registerRepository.findBy({id});

      return registers.then((registers) =>
          registers.filter((register) =>
              register.date != null &&
              register.date >= startDate &&
              register.date <= endDate
          ),
      );
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

  remove(id: number) {}

}
