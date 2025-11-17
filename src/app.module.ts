import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config'; // ¡Importante!

import { AppController } from './app.controller';
import { AppService } from './app.service';

// --- Nuestros Módulos ---
import { ReclamosModule } from './reclamos/reclamos.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';

// --- Nuestras Entidades (Moldes) ---
import { Reclamo } from './reclamos/entities/reclamo.entity';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // 1. MÓDULO DE CONFIGURACIÓN (.env) - ¡EL QUE FALTABA!
    // (Tiene que ir PRIMERO y ser Global)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. MÓDULO DE BASE DE DATOS (TypeORM)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Le decimos que "depende" del ConfigModule
      inject: [ConfigService],  // Inyectamos el servicio para leer el .env
      
      // Usamos la fábrica para leer las variables
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        
        // ¡Cargamos TODOS nuestros moldes!
        entities: [Reclamo, User],
        
        // Sincroniza la BD (crea las tablas) - SOLO PARA DESARROLLO
        synchronize: true, 
      }),
    }),

    // 3. NUESTROS MÓDULOS DE LÓGICA
    ReclamosModule,
    StorageModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}