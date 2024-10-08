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
          stats: {
            create: {},
          },
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

  async getUser(id: string) {
    try {
      const data = await this.prisma.user.findUniqueOrThrow({
        where: {
          id: id,
        },
        select: {
          income: true,
          username: true,
          createdAt: true,
          expense: {
            select: {
              debit: true,
              id: true,
              description: true,
              date: true,
              amount: true,
            },
          },
        },
      });
      return data;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new HttpException(
            { status: HttpStatus.FORBIDDEN, message: ['User not found'] },
            HttpStatus.FORBIDDEN,
          );
        } else {
          throw new HttpException(
            { status: HttpStatus.FORBIDDEN, message: ['Unknown Error'] },
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
    try {
      return await this.prisma.$transaction(async (tx) => {
        const prevMonthBalance = tx.user.findUniqueOrThrow({
          where: {
            id: amount.userId,
          },
          select: {
            income: true,
          },
        });
        const accountBalance = (await prevMonthBalance).income + amount.income;
        const monthlyIncome = tx.user.update({
          where: {
            id: amount.userId,
          },
          data: {
            income: accountBalance,
          },
        });
        return monthlyIncome;
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new HttpException(
            { status: HttpStatus.FORBIDDEN, message: ['User not found'] },
            HttpStatus.FORBIDDEN,
          );
        } else if (error.code === 'P2011') {
          throw new HttpException(
            {
              status: HttpStatus.FORBIDDEN,
              message: ['Income cannot be null'],
            },
            HttpStatus.FORBIDDEN,
          );
        } else {
          throw new HttpException(
            {
              status: HttpStatus.FORBIDDEN,
              message: ['Unknown Error'],
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

  async deleteUser(id: string) {
    return await this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.deleteMany({
        where: {
          userId: id,
        },
      });
      const stats = await tx.stats.delete({
        where: {
          userId: id,
        },
      });
      const user = await tx.user.delete({
        where: {
          id: id,
        },
      });
      return { user, stats, expense };
    });
  }
}
