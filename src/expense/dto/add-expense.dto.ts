import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class addExpenseDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
