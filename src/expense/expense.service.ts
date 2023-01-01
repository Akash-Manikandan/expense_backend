import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { addExpenseDto, sendToDto } from './dto/add-expense.dto';
import dayjs from 'dayjs';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { send } from 'process';

@Injectable()
export class ExpenseService {
  constructor(private readonly prismaService: PrismaService) {}
  async addExpense(expenseData: addExpenseDto) {
    try {
      if (expenseData.amount <= 10000) {
        return await this.prismaService.$transaction(async (tx) => {
          const userData = await tx.user.findUniqueOrThrow({
            where: {
              id: expenseData.userId,
            },
          });
          if (userData.income >= expenseData.amount) {
            const expense = await tx.expense.create({
              data: {
                amount: expenseData.amount,
                description: expenseData.description,
                debit: expenseData.debit,
                user: {
                  connect: {
                    id: expenseData.userId,
                  },
                },
              },
            });
            if (expenseData.debit == true) {
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
              await this.prismaService.user.update({
                where: {
                  id: expenseData.userId,
                },
                data: {
                  income: {
                    increment: expenseData.amount,
                  },
                },
              });
              const users = await tx.stats.findUniqueOrThrow({
                where: {
                  userId: expenseData.userId,
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
            }
          } else {
            return new HttpException(
              {
                status: HttpStatus.FORBIDDEN,
                message: ['Amount exceeded account balance'],
              },
              HttpStatus.FORBIDDEN,
            );
          }
        });
      } else {
        return new HttpException(
          {
            status: HttpStatus.FORBIDDEN,
            message: ['Credit/debit amount exceeded. Add the amount as Income'],
          },
          HttpStatus.FORBIDDEN,
        );
      }
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
          {
            status: HttpStatus.FORBIDDEN,
            message: ['Amount must be less than or equal to 10,000'],
          },
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
        if (deleteData.debit == true) {
          statData.quota[dayOfWeek] -= deleteData.amount;
          await tx.user.update({
            where: {
              id: deleteData.userId,
            },
            data: {
              income: {
                increment: deleteData.amount,
              },
            },
          });
        } else {
          statData.quota[dayOfWeek] += deleteData.amount;
          await tx.user.update({
            where: {
              id: deleteData.userId,
            },
            data: {
              income: {
                decrement: deleteData.amount,
              },
            },
          });
        }
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
      console.log(error);
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

  async sendTo(sendInfo: sendToDto) {
    return this.prismaService.$transaction(async (tx) => {
      try {
        const data = await tx.user.findUniqueOrThrow({
          where: {
            username: sendInfo.recipientUn,
          },
          select: {
            id: true,
            income: true,
          },
        });
        if (data.id != sendInfo.userId) {
          if (data.income >= sendInfo.amount) {
            const recipientData = await tx.user.update({
              where: {
                username: sendInfo.recipientUn,
              },
              data: {
                income: {
                  increment: sendInfo.amount,
                },
              },
            });
            const senderData = await tx.user.update({
              where: {
                id: sendInfo.userId,
              },
              data: {
                income: {
                  decrement: sendInfo.amount,
                },
              },
              select: {
                stats: true,
              },
            });
            const expenseData = await tx.expense.create({
              data: {
                debit: true,
                description: sendInfo.description,
                amount: sendInfo.amount,
                userId: sendInfo.userId,
              },
            });
            await tx.expense.create({
              data: {
                debit: false,
                description: sendInfo.description,
                amount: sendInfo.amount,
                userId: data.id,
              },
            });
            const dayOfWeek = dayjs(expenseData.date).day();
            const stats = senderData.stats;
            stats.quota[dayOfWeek] += expenseData.amount;

            await tx.stats.update({
              where: {
                userId: expenseData.userId,
              },
              data: {
                quota: stats.quota,
              },
            });
            const msg = 'Sent to ' + recipientData.username;
            return {
              verified: true,
              statusCode: 201,
              message: msg,
            };
          } else {
            throw new HttpException(
              {
                status: HttpStatus.NOT_FOUND,
                message: [false, 'Amount exceeded account balance'],
              },
              HttpStatus.NOT_FOUND,
            );
          }
        } else {
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              message: [false, 'Cannot send to oneself'],
            },
            HttpStatus.NOT_FOUND,
          );
        }
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new HttpException(
              {
                status: HttpStatus.NOT_FOUND,
                message: [false, 'User not found'],
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
              {
                status: HttpStatus.FORBIDDEN,
                message: [false, 'Unknown Error'],
              },
              HttpStatus.FORBIDDEN,
            );
          }
        } else {
          throw new HttpException(
            {
              status: HttpStatus.FORBIDDEN,
              message: [false, 'Unknown Error'],
            },
            HttpStatus.FORBIDDEN,
          );
        }
      }
    });
  }

  async getMonthly(id: string) {
    const date = new Date();
    const month = new Date(date.getFullYear(), date.getMonth());
    console.log(month);
    const stat = this.prismaService.expense.findMany({
      where: {
        userId: id,
        date: { gte: month },
      },
    });
    return stat;
  }

  async getWeekly(id: string) {
    var date = new Date();
    date.setDate(date.getDate() - 7);
    date.toISOString();
    const weekData = this.prismaService.expense.groupBy({
      by: ['date'],
      _sum: { amount: true },
      where: {
        AND: [
          { userId: id },
          {
            date: {
              gte: date,
            },
          },
        ],
      },
    });
    // const weekData = this.prismaService.expense.findMany({
    //   where: {
    //     AND: [
    //       { userId: id },
    //       {
    //         date: {
    //           gte: date,
    //         },
    //       },
    //     ],
    //   },
    // });
    return weekData;
  }
}
