import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configValidation from './config/env/config-validation';
import baseConfig from './config/env/base-config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { RegistersModule } from './http/registers/registers.module';
import * as path from 'path';
import { Register } from './http/registers/entities/register.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { DailysHoursWorked } from './http/registers/entities/dailyHours.entity';
import { MonthHoursWorked } from './http/registers/entities/monthHours.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [baseConfig],
      validationSchema: configValidation,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('TYPEORM_HOST'),
        port: configService.get<number>('TYPEORM_PORT'),
        password: configService.get<string>('TYPEORM_PASSWORD'),
        username: configService.get<string>('TYPEORM_USERNAME'),
        entities: [Register, DailysHoursWorked, MonthHoursWorked],
        database: configService.get<string>('TYPEORM_DATABASE'),
        synchronize: configService.get<boolean>('TYPEORM_SYNCHRONIZE'),
        logging: true,
      }),
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return {
          fallbackLanguage: configService.getOrThrow('APP_LANG'),
          loaderOptions: {
            path: path.join(__dirname, '/i18n/'),
            watch: true,
          },
          typesOutputPath: path.join(
            __dirname,
            '../src/generated/i18n.generated.ts',
          ),
        };
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
      inject: [ConfigService],
    }),
    RegistersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
