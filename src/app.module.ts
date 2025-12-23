import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi'; // 1. Importamos Joi

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReclamosModule } from './reclamos/reclamos.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { Reclamo } from './reclamos/entities/reclamo.entity';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      // 2. AQUÍ AGREGAMOS LA VALIDACIÓN
      validationSchema: Joi.object({
        // Base de Datos
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().required(),
        DB_PASS: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        
        // Supabase (Storage)
        SUPABASE_URL: Joi.string().required(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
        SUPABASE_BUCKET_NAME: Joi.string().required(),
        
        // JWT (Seguridad) - ¡Asegúrate de tener esto en tu .env!
        JWT_SECRET: Joi.string().required(), 
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [Reclamo, User],
        synchronize: false, 
      }),
    }),

    ReclamosModule,
    StorageModule,
    UsersModule,
    AuthModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}