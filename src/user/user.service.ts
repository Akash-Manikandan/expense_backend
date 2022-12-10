import { Injectable } from '@nestjs/common';
import { userInfo } from 'os';
import { PrismaService } from 'src/prisma/prisma.service';
import { AmountDto, LoginDto } from './dto/login.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async checkUser(user: LoginDto) {
    const userData = await this.prisma.user.findUnique({
      where: {
        username: user.username,
      },
    });
    if (userData != null) {
      return true;
    } else {
      return false;
    }
  }

  async signupUser(user: LoginDto) {
    const isUser = this.checkUser(user);
    if ((await isUser) == false) {
      const signupData = await this.prisma.user.create({
        data: {
          username: user.username,
          password: user.password,
        },
      });
      return signupData;
    } else {
      console.log('User already exists');
      return false;
    }
  }

  async signinUser(user: LoginDto) {
    const isUser = this.checkUser(user);
    if ((await isUser) == true) {
      const signinData = await this.prisma.user.findUnique({
        where: {
          username: user.username,
        },
      });
      // console.log(signinData.username);
      // console.log(user.username);

      // console.log(signinData);

      if (signinData.username == user.username) {
        if (signinData.password == user.password) {
          console.log('Logged in');
          return true;
        } else {
          console.log('Password incorrect');
          return false;
        }
      } else {
        console.log('User does not exist');
        return false;
      }
    } else {
      console.log('User does not exist');
    }
  }

  async addIncome(amount: AmountDto) {
    const amt = await this.prisma.user.update({
      where: {
        id: amount.userId,
      },
      data: {
        income: amount.income,
      },
    });
    return amt;
  }
}
