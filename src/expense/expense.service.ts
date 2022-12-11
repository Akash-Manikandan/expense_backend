import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { addExpenseDto } from './dto/add-expense.dto';
import * as dayjs from 'dayjs';
import { userInfo } from 'os';

@Injectable()
export class ExpenseService {
  constructor(private readonly prismaService: PrismaService) {}
  async addExpense(expenseData: addExpenseDto) {
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
    // console.log(day);
    const updateIncome = await this.prismaService.user.update({
      where: {
        id: expenseData.userId,
      },
      data: {
        income: {
          decrement: expenseData.amount,
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
    const userStats = await this.prismaService.user.findUnique({
      where: {
        id: expenseData.userId,
      },
      select: {
        stats: true,
      },
    });
    console.log(userStats);

    const updateStats = await this.prismaService.stats.update({
      where: {
        id: expenseData.userId,
      },
      data: {
        quota: {
          // set: [...userStats.stats, dayOfWeek],
        },
      },
    });

    // const updateStats = await this.prismaService.stats.upsert({
    //   where: {
    //     id: expenseData.userId,
    //   },
    //   create: {
    //     day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    //     quota[dayOfWeek] : expenseData.amount,
    //   },
    //   update: {},
    // });
    return { expense, updateIncome };
  }
}
