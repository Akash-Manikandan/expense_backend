import { IsNotEmpty, IsString } from 'class-validator';

export class deleteExpenseDto {
  @IsNotEmpty()
  @IsString()
  expId: string;

  @IsString()
  @IsNotEmpty()
  date: string;
}
