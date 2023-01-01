import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prismaService: PrismaService) {}
  async getStats(id: string) {
    const data = await this.prismaService.stats.findMany({
      where: {
        userId: id,
      },
      select: {
        id: true,
        day: true,
        quota: true,
      },
    });
    return data;
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
    let aggregateData = [];
    let today = new Date();
    today.setDate(today.getDate() - 0);
    today.toISOString();
    for (let i = 1; i <= 7; i++) {
      let date = new Date();
      date.setDate(date.getDate() - i);
      date.toISOString();
      const weekData = await this.prismaService.expense.aggregate({
        _sum: { amount: true },
        where: {
          userId: id,
          debit: false,
          date: {
            lte: today,
            gt: date,
          },
        },
      });
      weekData['day'] = dayjs(today).tz('Asia/Kolkata').day();
      if (weekData._sum.amount == null) {
        weekData._sum.amount = 0;
      }
      aggregateData.push(weekData);
      today = date;
    }

    return aggregateData;
  }
}
