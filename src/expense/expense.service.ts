import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { addExpenseDto } from './dto/add-expense.dto';
import dayjs from 'dayjs';
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from '@prisma/client/runtime';

@Injectable()
export class ExpenseService {
  constructor(private readonly prismaService: PrismaService) {}
  async addExpense(expenseData: addExpenseDto) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const expense = await tx.expense.create({
          data: {
            amount: expenseData.amount,
            description: expenseData.description,
            user: {
              connect: {
                id: expenseData.userId,
              },
            },
          },
        });
        const userData = await tx.user.findUnique({
          where: {
            id: expenseData.userId,
          },
        });
        if (userData.income >= expenseData.amount) {
          const updateIncome = await tx.user.update({
            where: {
              id: expenseData.userId,
            },
            data: {
              income: {
                decrement: expenseData.amount,
              },
              stats: {
                connectOrCreate: {
                  where: {
                    userId: expenseData.userId,
                  },
                  create: {
                    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    quota: [0, 0, 0, 0, 0, 0, 0],
                  },
                },
              },
            },
            select: {
              stats: true,
            },
          });
          const dayOfWeek = dayjs(expense.date).day();
          const stats = updateIncome.stats;
          stats.quota[dayOfWeek] += expenseData.amount;
          const users = await tx.stats.update({
            where: {
              userId: expenseData.userId,
            },
            data: {
              quota: stats.quota,
            },
            select: {
              user: {
                select: {
                  id: true,
                  income: true,
                  expense: {
                    select: {
                      id: true,
                      description: true,
                      amount: true,
                      date: true,
                    },
                  },
                },
              },
              id: true,
              day: true,
              quota: true,
            },
          });
          return users;
        } else {
          return {
            message: ['Amount exceeded account balance'],
          };
        }
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              message: ['User Not Found'],
            },
            HttpStatus.NOT_FOUND,
          );
        } else if (error.code === 'P2023') {
          throw new HttpException(
            {
              status: HttpStatus.FORBIDDEN,
              message: ['Malformed UserId'],
            },
            HttpStatus.FORBIDDEN,
          );
        } else {
          throw new HttpException(
            { status: HttpStatus.FORBIDDEN, message: ['Unknown Error'] },
            HttpStatus.FORBIDDEN,
          );
        }
      } else {
        throw new HttpException(
          { status: HttpStatus.FORBIDDEN, message: ['Unknown Error'] },
          HttpStatus.FORBIDDEN,
        );
      }
    }
  }

  async getExpense(id: string) {
    try {
      const data = await this.prismaService.expense.findMany({
        where: {
          userId: id,
        },
        select: {
          id: true,
          description: true,
          amount: true,
          date: true,
        },
      });
      return data;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              message: ['User Not Found'],
            },
            HttpStatus.NOT_FOUND,
          );
        } else if (error.code === 'P2023') {
          throw new HttpException(
            {
              status: HttpStatus.FORBIDDEN,
              message: ['Malformed UserId'],
            },
            HttpStatus.FORBIDDEN,
          );
        } else {
          throw new HttpException(
            { status: HttpStatus.FORBIDDEN, message: ['Unknown Error'] },
            HttpStatus.FORBIDDEN,
          );
        }
      } else {
        throw new HttpException(
          { status: HttpStatus.FORBIDDEN, message: ['Unknown Error'] },
          HttpStatus.FORBIDDEN,
        );
      }
    }
  }

  async deleteExpense(expId: string) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const deleteData = await tx.expense.delete({
          where: {
            id: expId,
          },
        });
        const dayOfWeek = dayjs(deleteData.date).day();
        const statData = await tx.stats.findUniqueOrThrow({
          where: {
            userId: deleteData.userId,
          },
        });
        statData.quota[dayOfWeek] -= deleteData.amount;
        await tx.stats.update({
          where: {
            id: statData.id,
          },
          data: {
            quota: statData.quota,
          },
        });
        return true;
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              message: [false, 'Transaction Not Found'],
            },
            HttpStatus.NOT_FOUND,
          );
        } else if (error.code === 'P2023') {
          throw new HttpException(
            {
              status: HttpStatus.FORBIDDEN,
              message: [false, 'Invalid Transaction'],
            },
            HttpStatus.FORBIDDEN,
          );
        } else {
          throw new HttpException(
            { status: HttpStatus.FORBIDDEN, message: [false, 'Unknown Error'] },
            HttpStatus.FORBIDDEN,
          );
        }
      } else {
        throw new HttpException(
          { status: HttpStatus.FORBIDDEN, message: [false, 'Unknown Error'] },
          HttpStatus.FORBIDDEN,
        );
      }
    }
  }
}
