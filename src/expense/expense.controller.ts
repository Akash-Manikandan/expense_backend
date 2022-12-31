import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { addExpenseDto, sendToDto } from './dto/add-expense.dto';
import { ExpenseService } from './expense.service';

@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}
  @Post('addExpense')
  async addExpense(@Body() expenseData: addExpenseDto) {
    return this.expenseService.addExpense(expenseData);
  }

  @Post('getExpense/:id')
  async getExpense(@Param('id') id: string) {
    return this.expenseService.getExpense(id);
  }

  @Delete('deleteExpense/:id')
  async deleteExpense(@Param('id') expId: string) {
    return this.expenseService.deleteExpense(expId);
  }

  @Post('sendTo')
  async sendTo(@Body() sendInfo: sendToDto) {
    return this.expenseService.sendTo(sendInfo);
  }

  @Get('weekly/:id')
  async getWeekly(@Param('id') id: string) {
    return this.expenseService.getWeekly(id);
  }

  @Get('monthly/:id')
  async getMonthly(@Param('id') id: string) {
    return this.expenseService.getMonthly(id);
  }
}
