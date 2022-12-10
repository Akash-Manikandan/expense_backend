import { Body, Controller, Post } from '@nestjs/common';
import { addExpenseDto } from './dto/add-expense.dto';
import { ExpenseService } from './expense.service';

@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}
  @Post('addExpense')
  async addExpense(@Body() expenseData: addExpenseDto) {
    return this.expenseService.addExpense(expenseData);
  }
}
