import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService , private readonly usersService: UserService) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user: User = await this.usersService.findByUserName(username);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isMatch: boolean = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Password does not match');
    }
    return user;
  }

  async login(user: Partial<User>): Promise<any> {
    const payload = { username: user.username, id: user.id };
    const token = this.jwtService.sign(payload)
    return { access_token:  token , message: 'Login successful' };
  }

  async register(user: CreateUserDto ): Promise<any> {
    const existingUser = await this.usersService.findByUserName(user.username);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = new User();
    newUser.username = user.username;
    newUser.password = hashedPassword;
    // newUser.accounts = []; 
    newUser.transactions = []; 
    await this.usersService.create(newUser); 
    return this.login(newUser); 
  }
}
