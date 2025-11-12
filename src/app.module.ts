import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config'; // ¡Importamos el Config!

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReclamosModule } from './reclamos/reclamos.module'; // ¡El módulo que ya teníamos!

import { Reclamo } from './reclamos/entities/reclamo.entity';
import { StorageService } from './storage/storage.service';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    // 1. Cargamos el módulo de .env PRIMERO y lo hacemos Global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Le decimos qué archivo leer
    }),

    // 2. Configuramos TypeORM (la BD)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Importamos el ConfigModule
      inject: [ConfigService], // Inyectamos el Servicio de Config
      
      // 3. Usamos una "fábrica" para leer las variables del .env
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        
        entities: [Reclamo],
        synchronize: true, // ¡Magia! Esto crea las tablas automáticamente (solo para desarrollo)
      }),
    }),

    // 3. Nuestro módulo de Reclamos
    ReclamosModule,
    StorageModule
  ],
  controllers: [AppController],
  providers: [AppService, StorageService],
})
export class AppModule {}