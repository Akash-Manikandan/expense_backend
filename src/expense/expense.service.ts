import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { addExpenseDto } from './dto/add-expense.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class ExpenseService {
  constructor(private readonly prismaService: PrismaService) {}
  async addExpense(expenseData: addExpenseDto) {
    try {
      const expense = await this.prismaService.expense.create({
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
      const updateIncome = await this.prismaService.user.update({
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
          createdAt: true,
          income: true,
          id: true,
        },
      });
      const dayOfWeek = dayjs(expense.date).day();
      const stats = updateIncome.stats;
      stats.quota[dayOfWeek] += expenseData.amount;
      await this.prismaService.stats.update({
        where: {
          userId: expenseData.userId,
        },
        data: {
          quota: stats.quota,
        },
      });
      return { expense, updateIncome };
    } catch {}
  }
}
