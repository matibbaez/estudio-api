import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

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
      validationSchema: Joi.object({
        // 1. BASE DE DATOS (Aceptamos URL completa o partes)
        DATABASE_URL: Joi.string().optional(),
        
        // 2. SUPABASE (Solo Auth, ya no Storage)
        SUPABASE_URL: Joi.string().required(),
        SUPABASE_KEY: Joi.string().optional(), // A veces se llama KEY o ANON_KEY
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional(), 
        
        // 3. CLOUDFLARE R2 (Las nuevas obligatorias)
        R2_ACCOUNT_ID: Joi.string().required(),
        R2_ACCESS_KEY_ID: Joi.string().required(),
        R2_SECRET_ACCESS_KEY: Joi.string().required(),
        R2_BUCKET_NAME: Joi.string().required(),

        // 4. SEGURIDAD
        JWT_SECRET: Joi.string().required(),
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // Prioridad: Si existe DATABASE_URL (Transaction Pooler), usala.
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [Reclamo, User],
            synchronize: false, // En producción siempre false
            autoLoadEntities: true,
            ssl: { rejectUnauthorized: false }, // Necesario para Render + Supabase
          };
        }

        // Si no, intentamos armar la conexión manual (Legacy)
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASS'),
          database: configService.get<string>('DB_NAME'),
          entities: [Reclamo, User],
          synchronize: false,
        };
      },
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