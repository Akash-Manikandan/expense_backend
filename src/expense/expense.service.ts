import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { addExpenseDto, sendToDto } from './dto/add-expense.dto';
import dayjs from 'dayjs';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

@Injectable()
export class ExpenseService implements OnModuleInit {
  constructor(private readonly prismaService: PrismaService) {}
  onModuleInit() {
    dayjs.extend(utc);
    dayjs.extend(timezone);
  }
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
              const dayOfWeek = dayjs(expense.date).tz('Asia/Kolkata').day();
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
              await tx.user.update({
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
            return {
              verified: false,
              message: ['Amount exceeded account balance'],
            };
          }
        });
      } else {
        return {
          verified: false,
          message: ['Credit/debit amount exceeded. Add the amount as Income'],
        };
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
            message: ['Unknown Error'],
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
        console.log(data);
        if (data.id != sendInfo.userId) {
          const senderIncome = await tx.user.findUniqueOrThrow({
            where: {
              id: sendInfo.userId,
            },
            select: {
              income: true,
            },
          });
          if (senderIncome.income >= sendInfo.amount) {
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
            const dayOfWeek = dayjs(expenseData.date).tz('Asia/Kolkata').day();
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
            return {
              verified: false,
              message: ['Amount exceeded account balance'],
            };
          }
        } else {
          return {
            verified: false,
            message: ['Cannot send to oneself'],
          };
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

  
}
