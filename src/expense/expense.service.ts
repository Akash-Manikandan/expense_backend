import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { addExpenseDto } from './dto/add-expense.dto';

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
    return expense;
  }
}
