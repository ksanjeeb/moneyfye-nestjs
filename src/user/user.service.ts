import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{ message: string }> {
    const newUser = this.userRepository.create({ ...createUserDto });
    await this.userRepository.save(newUser);
    return {
      message: 'User created successfully!',
    };
  }

  async findByUserName(username: string) {
    const user = await this.userRepository.findOne({
      where: { username: username },
      select: ['id', 'username', 'password'],
    });
    return user;
  }

  async userData(
    userId: any,
  ): Promise<{ data: User; statusCode: number; message: string }> {
    if (!userId) {
      throw new UnauthorizedException(`No details found for User ID ${userId}`);
    }
    const user: User = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(`No details found for User ID ${userId}`);
    }

    return { data: user, statusCode: 200, message: 'User details fetched.' };
  }



  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['accounts', 'transactions'],
    });

    if (user) {
      await this.userRepository.remove(user);
    } else {
      throw new Error(`User with id ${id} not found`);
    }
  }
}
