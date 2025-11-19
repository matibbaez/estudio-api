import { Module } from '@nestjs/common';
import { ReclamosService } from './reclamos.service';
import { ReclamosController } from './reclamos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reclamo } from './entities/reclamo.entity';
import { StorageModule } from 'src/storage/storage.module';
import { MailModule } from 'src/mail/mail.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Reclamo]),
    StorageModule,
    MailModule, 
  ],
  controllers: [ReclamosController],
  providers: [ReclamosService],
})
export class ReclamosModule {}