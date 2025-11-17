import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  
  // ¡Agregamos los campos que nos faltaban!

  @IsEmail() // Validamos que sea un email
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8) // ¡Le pedimos un mínimo de 8 caracteres!
  password: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;
}