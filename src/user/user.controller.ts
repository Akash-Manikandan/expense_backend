import { Controller, Get } from '@nestjs/common';
import { Body, Param, Post } from '@nestjs/common';
import { AmountDto, LoginDto } from './dto/login.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Get()
  // async getData() {
  //   const userData: LoginDto = await this.userService.getData();
  //   return userData;
  // }

  @Post('signupUser')
  async signupUser(@Body() user: LoginDto) {
    const signupData = await this.userService.signupUser(user);
    return signupData;
  }

  @Post('signinUser')
  async signinUser(@Body() user: LoginDto) {
    const isSignedup = await this.userService.signinUser(user);
    return isSignedup;
  }

  @Post('addIncome')
  async addIncome(@Body() amount: AmountDto) {
    const amt = await this.userService.addIncome(amount);
    return amt;
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }
}
