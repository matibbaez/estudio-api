import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard'; // 1. Importamos al "Patovica"
import { CreateUserDto } from 'src/users/dto/create-user.dto'; // (Lo usamos para el DTO del body)

@Controller('auth') // URL base: /auth
export class AuthController {
  
  constructor(private authService: AuthService) {}

  /**
   * Esta es la "puerta de entrada" del login
   */
  @UseGuards(LocalAuthGuard) // 2. ¡Ponemos al "Patovica" en la puerta!
  @Post('login') // Escucha en: POST /auth/login
  async login(@Request() req) {
    // 3. Si el "Patovica" (LocalAuthGuard) nos deja pasar,
    //    significa que el usuario es válido y lo pone en "req.user".
    // 4. Llamamos al "cerebro" (AuthService) para que cree el "sello" (Token).
    return this.authService.login(req.user);
  }
}