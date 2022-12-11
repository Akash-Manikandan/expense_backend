import { Body, Controller, Param, Post } from '@nestjs/common';
import { addExpenseDto } from './dto/add-expense.dto';
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
}
