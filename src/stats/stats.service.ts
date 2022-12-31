import { Injectable } from '@nestjs/common';
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

  // async getWeekly(id: string) {
  //   const weekData = this.prismaService.stats.findMany({
  //     where: {
  //       AND: [{ userId: id }, {}],
  //     },
  //   });
  // }
}
