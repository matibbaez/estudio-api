import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { UsersService } from './users/users.service'; // 1. ¡Importamos el UsersService!

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  // ------------------------------------------------------------------
  // ¡¡¡NUESTRO SCRIPT DE "SIEMBRA" (SEEDING)!!!
  // ------------------------------------------------------------------
  // 1. Obtenemos el UsersService de la app que acabamos de crear
  const usersService = app.get(UsersService);

  // 2. Definimos el email del admin
  const adminEmail = 'admin@estudio.com'; // (O el email de Marco)

  // 3. Buscamos si ya existe
  const adminUser = await usersService.findOneByEmail(adminEmail);

  // 4. Si NO existe... ¡lo creamos!
  if (!adminUser) {
    console.log('¡Admin no encontrado! Creando usuario admin...');
    await usersService.create({
      email: adminEmail,
      nombre: 'Admin Estudio', // (O el nombre de Marco)
      password: 'PasswordSeguro123!', // <-- ¡CAMBIÁ ESTO POR UNA BUENA!
    });
    console.log('¡Usuario admin creado con éxito!');
  } else {
    console.log('Usuario admin ya existe. Saltando siembra.');
  }
  // ------------------------------------------------------------------

  await app.listen(3000);
}
bootstrap();