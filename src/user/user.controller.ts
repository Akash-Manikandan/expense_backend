import { Controller, Get } from '@nestjs/common';
import { Body, Post } from '@nestjs/common/decorators';
import { LoginDto } from './dto/login.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Get()
  // async getData() {
  //   const userData: LoginDto = await this.userService.getData();
  //   return userData;
  // }

  @Post()
  async loginUser(@Body() user: LoginDto) {
    const loginData: LoginDto = await this.userService.loginUser(user);
    return loginData;
  }
}
