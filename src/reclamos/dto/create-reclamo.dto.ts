import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsNumberString,
} from 'class-validator';

export class CreateReclamoDto {
  
  @IsString()
  @IsNotEmpty()
  @MinLength(3) 
  // 2. ¡Regex! Solo letras (incluyendo acentos y 'ñ') y espacios
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, {
    message: 'El nombre solo puede contener letras y espacios',
  })
  nombre: string;

  @IsNotEmpty()
  @IsNumberString({}, { message: 'El DNI solo puede contener números' }) 
  @MinLength(7)
  @MaxLength(8) 
  dni: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}