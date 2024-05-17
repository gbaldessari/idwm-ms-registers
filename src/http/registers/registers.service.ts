import { HttpStatus, Injectable } from '@nestjs/common';
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
    
    if(!createRegisterDto.token) throw new Error('Token is required');
    const { id } = await this.msUsersService.getAccessToken(
      createRegisterDto.token).toPromise(); 

    console.log(id);

    const createRegister: Register = {
      userId: id
    }

    await this.connection.transaction(
      async (transactionalEntityManager: EntityManager): Promise<void> => {
        try {
          const register: Register = this.registerRepository.create(createRegister);
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

  findAll() {
    return this.registerRepository.find();
  }

  findOne(id: number) {
    
  }

  remove(id: number) {
    
  }

}
