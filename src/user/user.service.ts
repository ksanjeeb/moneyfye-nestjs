import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
    const newUser = this.userRepository.create({...createUserDto});
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

  // async listUser(){
  //   return await this.userRepository.find();
  // }

  async userData(userId: any): Promise<{ data: User; statusCode: number , message:string}> {
    const user:User = await this.userRepository.findOne({
      where: {  id: userId  },
    });

    if (!user) {
      throw new UnauthorizedException(`No details found for User ID ${userId}`);
    }

    return { data: user, statusCode: 200 , message:"User details fetched." };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
