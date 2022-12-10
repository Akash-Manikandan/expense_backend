import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ExpenseModule } from './expense/expense.module';

@Module({
  imports: [PrismaModule, ConfigModule.forRoot({ isGlobal: true }), UserModule, ExpenseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
