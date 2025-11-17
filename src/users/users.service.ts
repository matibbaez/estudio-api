import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt'; // 1. ¡IMPORTAMOS BCRYPT!

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ¡ESTE ES EL MÉTODO QUE VA A "HACER LA MAGIA"!
  async create(createUserDto: CreateUserDto): Promise<User> {
    
    // 2. Definimos cuánta "potencia" de hasheo (10 es el estándar)
    const saltRounds = 10;
    
    // 3. ¡"Trituramos" la contraseña que nos llegó!
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // 4. Creamos el nuevo usuario con el DTO Y la pass hasheada
    const newUser = this.userRepository.create({
      ...createUserDto, // email, nombre, etc.
      password: hashedPassword, // ¡Guardamos el hash, no el texto plano!
    });

    // 5. Guardamos en la BD de MySQL
    return this.userRepository.save(newUser);
  }

  // (El resto de métodos los dejamos para después, para el admin)
  findAll() {
    return this.userRepository.find();
  }

  // ¡Vamos a necesitar este para el login!
  findOneByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}