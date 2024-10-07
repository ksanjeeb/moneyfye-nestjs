import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('defaultBearerAuth')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("/data")
  listAll(@Request() req: any) {
    return this.userService.userData(req.user.id);
  }


  @Delete()
  remove(@Request() req: any) {
    return this.userService.remove(req.user.id);
  }
}
