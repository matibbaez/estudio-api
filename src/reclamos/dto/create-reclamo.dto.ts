import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateReclamoDto {
  @IsString()   
  @IsNotEmpty() 
  nombre: string;

  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsEmail()    
  @IsNotEmpty()
  email: string;
}