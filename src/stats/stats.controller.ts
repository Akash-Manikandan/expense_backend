import { Controller, Get, Param } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}
  @Get(':id')
  async getStats(@Param('id') id: string) {
    return this.statsService.getStats(id);
  }

  @Get('monthly/:id')
  async getMonthly(@Param('id') id: string) {
    return this.statsService.getMonthly(id);
  }
  @Get('weekly/:id')
  async getWeekly(@Param('id') id: string) {
    return this.statsService.getWeekly(id);
  }
}
