import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';
import { AmountDto, LoginDto } from './dto/login.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async signupUser(user: LoginDto) {
    try {
      const signupData = await this.prisma.user.create({
        data: {
          username: user.username,
          password: user.password,
        },
      });
      return { verified: true, signupData };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new HttpException('User already exists', HttpStatus.FORBIDDEN);
        }
      } else if (error instanceof PrismaClientUnknownRequestError) {
        throw error;
      } else {
        throw error;
      }
    }
  }

  //error.code === 'P2002' signup unique constraint

  async signinUser(user: LoginDto) {
    try {
      const signinData = await this.prisma.user.findUniqueOrThrow({
        where: {
          username: user.username,
        },
      });

      if (signinData.username == user.username) {
        if (signinData.password == user.password) {
          return { verified: true, userId: signinData.id };
        } else {
          throw new HttpException(
            { status: HttpStatus.FORBIDDEN, message: ['Password Incorrect'] },
            HttpStatus.FORBIDDEN,
          );
        }
      } else {
        throw new HttpException(
          { status: HttpStatus.FORBIDDEN, message: ['User does not exist'] },
          HttpStatus.FORBIDDEN,
        );
      }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new HttpException(
            { status: HttpStatus.FORBIDDEN, message: ['Invalid User'] },
            HttpStatus.FORBIDDEN,
          );
        } else {
          throw new HttpException(
            {
              status: HttpStatus.FORBIDDEN,
              message: ['Username field is empty'],
            },
            HttpStatus.FORBIDDEN,
          );
        }
      } else if (error instanceof PrismaClientUnknownRequestError) {
        throw error;
      } else {
        throw error;
      }
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
