import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt'; 

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    const newUser = this.userRepository.create({
      ...createUserDto, 
      password: hashedPassword, 
    });

    return this.userRepository.save(newUser);
  }

  // --- NUEVO MÉTODO PARA CAMBIAR LA CONTRASEÑA ---
  async updatePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isMatch = await bcrypt.compare(currentPass, user.password);
    if (!isMatch) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPass, saltRounds);

    user.password = hashedPassword;
    await this.userRepository.save(user);

    return { message: 'Contraseña actualizada correctamente' };
  }

  findAll() {
    return this.userRepository.find();
  }

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