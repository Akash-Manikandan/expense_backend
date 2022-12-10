import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async loginUser(user: LoginDto) {
    const loginData = await this.prisma.user.create({
      data: {
        username: user.username,
        password: user.password,
      },
    });
    return loginData;
  }
}
