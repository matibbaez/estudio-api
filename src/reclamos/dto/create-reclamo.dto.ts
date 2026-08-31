import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsNumberString,
  IsOptional,       
  IsBooleanString,  
} from 'class-validator';

export class CreateReclamoDto {
  
  @IsString()
  @IsNotEmpty()
  @MinLength(3) 
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

  @IsString()
  @IsNotEmpty({ message: 'El tipo de trámite es obligatorio' })
  tipo_tramite: string;

  @IsOptional()
  @IsString()
  subtipo_tramite?: string;

  @IsOptional()
  @IsString()
  jornada_laboral?: string;

  @IsOptional()
  @IsString()
  direccion_laboral?: string;

  @IsOptional()
  @IsString()
  trayecto_habitual?: string;

  @IsOptional()
  @IsBooleanString()
  tiene_abogado_anterior?: string;
}