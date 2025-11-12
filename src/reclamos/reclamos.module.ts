import { Module } from '@nestjs/common';
import { ReclamosService } from './reclamos.service';
import { ReclamosController } from './reclamos.controller';
import { TypeOrmModule } from '@nestjs/typeorm'; // 1. Importar TypeOrmModule
import { Reclamo } from './entities/reclamo.entity'; // 2. Importar el Molde
import { StorageModule } from 'src/storage/storage.module'; // 3. Importar el StorageModule

@Module({
  // 4. Agregar TypeOrmModule.forFeature y StorageModule
  imports: [
    TypeOrmModule.forFeature([Reclamo]), // Esto "inyecta" el Repositorio del Molde
    StorageModule, // Esto nos da acceso al StorageService
  ],
  controllers: [ReclamosController],
  providers: [ReclamosService],
})
export class ReclamosModule {}