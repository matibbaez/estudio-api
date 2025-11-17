import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service'; // 1. Importamos el UsersService
import { JwtService } from '@nestjs/jwt'; // 2. Importamos el "llavero" JWT
import * as bcrypt from 'bcrypt'; // 3. Importamos bcrypt para comparar

@Injectable()
export class AuthService {
  
  // 4. Inyectamos nuestras herramientas
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // ----------------------------------------------------
  // Misión 1: Validar al Usuario (El "Patovica")
  // ----------------------------------------------------
  async validateUser(email: string, pass: string): Promise<any> {
    // a. Buscamos al usuario por su email
    const user = await this.usersService.findOneByEmail(email);

    // b. Si existe, comparamos la contraseña
    if (user) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        // ¡Éxito! Devolvemos el usuario (sin la contraseña)
        const { password, ...result } = user;
        return result;
      }
    }

    // c. Si el usuario no existe O la contraseña no coincide, tiramos error
    throw new UnauthorizedException('Credenciales incorrectas');
  }

  // ----------------------------------------------------
  // Misión 2: Crear el "Sello" (El Token)
  // ----------------------------------------------------
  async login(user: any) {
    // El "sello" solo va a tener el ID y el email del usuario.
    const payload = { 
      sub: user.id, // 'sub' (subject) es el ID del usuario
      email: user.email,
      nombre: user.nombre,
    };
    
    // Usamos el "llavero" para firmar el token y devolverlo
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}