import { IsBoolean, IsNotEmpty, IsNumber, IsString, MaxLength, MinLength } from 'class-validator';

export class addExpenseDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(24)
  @MinLength(24)
  userId: string;

  @IsNotEmpty()
  @IsBoolean()
  debit: boolean;
}

export class sendToDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(24)
  @MinLength(24)
  userId: string;

  @IsString()
  @IsNotEmpty()
  recipientUn: string;
}
