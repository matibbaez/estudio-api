import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // 1. Importar Swagger
import helmet from 'helmet'; // 2. Importar Helmet

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- SEGURIDAD (Helmet) ---
  app.use(helmet()); 

  // --- CORS ---
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Elimina datos que no estén en los DTOs
    forbidNonWhitelisted: true, // Tira error si mandan datos de más
  }));

  // --- DOCUMENTACIÓN (Swagger) ---
  const config = new DocumentBuilder()
    .setTitle('API Estudio Jurídico')
    .setDescription('Documentación de la API para gestión de reclamos y usuarios')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); 

  // --- SCRIPT DE SIEMBRA (Tu código original) ---
  const usersService = app.get(UsersService);
  const adminEmail = 'admin@estudio.com';
  const adminUser = await usersService.findOneByEmail(adminEmail);

  if (!adminUser) {
    console.log('¡Admin no encontrado! Creando usuario admin...');
    await usersService.create({
      email: adminEmail,
      nombre: 'Admin Estudio',
      password: 'PasswordSeguro123!', 
    });
    console.log('¡Usuario admin creado con éxito!');
  } else {
    console.log('Usuario admin ya existe. Saltando siembra.');
  }

  await app.listen(3000);
  console.log(`Aplicación corriendo en: http://localhost:3000`);
  console.log(`Documentación disponible en: http://localhost:3000/api/docs`);
}
bootstrap();