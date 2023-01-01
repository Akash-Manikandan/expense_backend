import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { PrismaService } from 'src/prisma/prisma.service';
import { start } from 'repl';

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
  // 63b1c48dcd76b5de99ac879b
  async getMonthly(id: string) {
    let displayData = [];
    let date = dayjs().tz('Asia/Kolkata');
    let startDate = new Date();
    startDate.setDate(1);
    startDate.toISOString();

    for (let i = 1; i <= 4; i++) {
      let endDate = new Date();
      endDate.setDate(i * 7);
      endDate.toISOString();
      if (i == 4) {
        endDate.setDate(date.daysInMonth());
      }
      const weekData = await this.prismaService.expense.aggregate({
        _sum: { amount: true },
        where: {
          userId: id,
          debit: true,
          date: {
            gte: startDate, // '2023-01-01T18:26:29.558Z',
            lt: endDate, //'2023-01-07T18:26:29.558Z',
          },
        },
      });
      weekData['week'] = i;
      // console.log(displayData);
      if (weekData._sum.amount == null) {
        weekData._sum.amount = 0;
      }
      displayData.push(weekData);
      console.log(startDate, endDate);
      startDate.setDate(i * 7);
    }
    // console.log(displayData);
    return displayData;
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
          debit: true,
          date: {
            lte: today,
            gt: date,
          },
        },
      });
      // console.log(weekData);
      weekData['day'] = dayjs(today).tz('Asia/Kolkata').day();
      if (weekData._sum.amount == null) {
        weekData._sum.amount = 0;
      }
      aggregateData.push(weekData);
      today = date;
    }
    aggregateData.sort((a, b) => a.day - b.day);
    return aggregateData;
  }
}
