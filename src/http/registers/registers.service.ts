import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateRegisterDto } from './dto/create-register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, EntityManager, Repository } from 'typeorm';
import { Register } from './entities/register.entity';
import { MsUsersService } from 'src/conection/ms-users.service';
import { throwHttpException } from 'src/utils/exception';
import { I18nService } from 'nestjs-i18n';

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
    const { id } = await this.msUsersService
      .getAccessToken(createRegisterDto.token)
      .toPromise();

    console.log(id);

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
            { error },
          );
        }
      },
    );

    return id;
  }

  async createExit(userId: number) {
    const today = new Date().toLocaleDateString();

    await this.registerRepository.manager.transaction(
      async (transactionalEntityManager: EntityManager) => {
        try {
          const registerToUpdate = await transactionalEntityManager.findOne(
            Register,
            {
              where: {
                userId,
                date: today,
              },
            },
          );

          if (!registerToUpdate) {
            throw new BadRequestException('No existe registro hoy');
          }

          registerToUpdate.timeExit = new Date().toLocaleTimeString();
        } catch (e) {
          throw new InternalServerErrorException('Error al marcar salida');
        }
      },
    );
  }

  // async findRegisterByUserId(userId: number) {
  //   return await this.registerRepository.findOneBy({
  //     userId,
  //   });
  // }

  async findRegistersByUserId(userId: number) {
    return await this.registerRepository.findBy({ userId });
  }

  async findRegistersByRangeTimeAndUserId(
    userId: number,
    dateInit: string,
    dateEnd: string,
  ) {
    const registers: Promise<Register[]> = this.findRegistersByUserId(userId);
    return registers.then((registers) =>
      registers.filter(
        (register) =>
          register.date &&
          register.date >= dateInit &&
          register.date <= dateEnd,
      ),
    );
  }

  async findAll() {
    return await this.registerRepository.find();
  }

  async findOne(id: number) {
    return await this.registerRepository.findOneBy({ id });
  }

  remove(id: number) {}
}
