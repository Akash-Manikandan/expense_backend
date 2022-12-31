import { Controller, Get, Param } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}
  @Get(':id')
  async getStats(@Param('id') id: string) {
    return this.statsService.getStats(id);
  }

  
}
