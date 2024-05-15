import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateRegisterDto } from './dto/create-register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, EntityManager, Repository } from 'typeorm';
import { Register } from './entities/register.entity';
import { MsUsersService } from 'src/conection/ms-users.service';
import { throwHttpException } from 'src/utils/exception';

@Injectable()
export class RegistersService {
  i18n: any;
  constructor(
    @InjectRepository(Register)
    private readonly registerRepository: Repository<Register>,
    private readonly msUsersService: MsUsersService,
    private readonly connection: Connection
  ) {}

  async createRegister(createRegisterDto: CreateRegisterDto) {
    if(!createRegisterDto.token) throw new Error('Token is required');

    const { userId } = await this.msUsersService.getAccessToken(
      createRegisterDto.token).toPromise(); 

    console.log("el usuario encontrado es "+userId)

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
          const register: Register = this.registerRepository.create({ userId });
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

    return {message: this.i18n.translate('http.SUCCESS_CREATED')}

  }

  findAll() {
    return this.registerRepository.find();
  }

  findOne(id: number) {
    
  }

  remove(id: number) {
    
  }

}
