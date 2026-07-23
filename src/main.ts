import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
      'https://www.reclamarte-demo.vercel.app',   
      'https://reclamarte-demo.vercel.app',   
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

  // --- 💡 LÓGICA KEEP-ALIVE PARA SUPABASE (VÍA API REST) ---
  setInterval(async () => {
    try {
      // Tomamos las variables que ya tenés en tu .env validadas en el AppModule
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        // Le pegamos a la API REST de Supabase, esto SÍ resetea el contador
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        
        if (response.ok) {
          console.log('✨ Keep-alive: Ping HTTP exitoso a la API de Supabase.');
        } else {
          console.error('❌ Keep-alive: Supabase respondió con error:', response.statusText);
        }
      } else {
        console.warn('⚠️ Keep-alive: Faltan variables de Supabase en el .env');
      }
    } catch (e) {
      console.error('❌ Error en el Keep-alive de Supabase:', e.message);
    }
  }, 1000 * 60 * 60); // Se ejecuta cada 1 hora
}
bootstrap();