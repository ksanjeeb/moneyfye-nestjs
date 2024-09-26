import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { Public } from './decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';

@Public()
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Body() loginDto: CreateUserDto, @Request() req
  ): Promise<CreateUserDto | BadRequestException> {
    return this.authService.login({...loginDto, ...req?.user});
  }

  @Post('register')
  async register(
    @Body() registerBody: CreateUserDto,
  ): Promise<CreateUserDto | BadRequestException> {
    return await this.authService.register(registerBody);
  }
}
