import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsNumberString,
  IsOptional,       // <--- IMPORTANTE
  IsBooleanString,  // <--- IMPORTANTE (Para el switch que viene como string)
} from 'class-validator';

export class CreateReclamoDto {
  
  // --- TUS CAMPOS ORIGINALES (ESTÁN PERFECTOS) ---
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
  

  // --- LOS NUEVOS CAMPOS OBLIGATORIOS PARA LA LÓGICA ---
  
  @IsString()
  @IsNotEmpty({ message: 'El tipo de trámite es obligatorio' })
  tipo_tramite: string;

  @IsOptional()
  @IsString()
  subtipo_tramite?: string;

  // --- CAMPOS ESPECÍFICOS DE RECHAZO (TEXTOS) ---
  // Tienen que ser @IsOptional porque si el trámite es "Alta", no vienen.
  
  @IsOptional()
  @IsString()
  jornada_laboral?: string;

  @IsOptional()
  @IsString()
  direccion_laboral?: string;

  @IsOptional()
  @IsString()
  trayecto_habitual?: string;

  // --- SWITCH DE ABOGADO ANTERIOR ---
  // Usamos @IsBooleanString porque FormData convierte true en "true"
  @IsOptional()
  @IsBooleanString()
  tiene_abogado_anterior?: string;
}