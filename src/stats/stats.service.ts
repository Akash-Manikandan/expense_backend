import { Injectable } from '@nestjs/common';
import { contains } from 'class-validator';
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
    var date = new Date();
    date.setDate(date.getDate() - 7);
    date.toISOString();
    const weekData = this.prismaService.expense.groupBy({
      by: ['date'],
      _sum: { amount: true },
      where: {
        userId: id,
        date: {
          gte: date,
        },
      },
    });
    console.table(weekData);
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
