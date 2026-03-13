import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm'; // <-- 1. Importamos DataSource
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. SEGURIDAD: Helmet protege tu app de vulnerabilidades web conocidas
  app.use(helmet()); 

  // 2. SEGURIDAD: CORS configurado para SOLO aceptar a tu web oficial
  app.enableCors({
    origin: [
      'https://reclamarte.ar',       
      'https://www.reclamarte.ar',   
      'http://localhost:4200',       
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 3. VALIDACIÓN: Limpieza automática de datos entrantes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Elimina campos que no estén en los DTO
    forbidNonWhitelisted: true, // Tira error si envían datos extra
  }));

  // 4. DOCUMENTACIÓN: Swagger disponible en /api/docs
  const config = new DocumentBuilder()
    .setTitle('API Reclamarte')
    .setDescription('Documentación de la API para gestión de reclamos')
    .setVersion('1.0')
    .addBearerAuth() // Botón para probar con Token JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); 

  // 5. SCRIPT DE SIEMBRA: Crea el usuario Admin si no existe
  const usersService = app.get(UsersService);
  const adminEmail = 'admin@estudio.com'; 
  const adminUser = await usersService.findOneByEmail(adminEmail);

  if (!adminUser) {
    console.log('⚠️ Admin no encontrado. Creando usuario admin inicial...');
    await usersService.create({
      email: adminEmail,
      nombre: 'Admin Estudio',
      password: 'PasswordSeguro123!',
    });
    console.log('✅ ¡Usuario admin creado con éxito!');
  } else {
    console.log('✅ El usuario admin ya existe.');
  }

  await app.listen(3000);
  console.log(`🚀 API corriendo en el puerto 3000`);
  console.log(`📄 Documentación Swagger: http://localhost:3000/api/docs`);

  // --- 💡 LÓGICA KEEP-ALIVE PARA SUPABASE ---
  // 2. Obtenemos la conexión a la base de datos
  const dataSource = app.get(DataSource);
  
  // 3. Hacemos el ping cada 1 hora (1000 ms * 60 s * 60 m)
  setInterval(async () => {
    try {
      await dataSource.query('SELECT 1');
      console.log('✨ Keep-alive: Ping exitoso a Supabase para evitar pausa.');
    } catch (e) {
      console.error('❌ Error en el Keep-alive de Supabase:', e.message);
    }
  }, 1000 * 60 * 60); 
}
bootstrap();