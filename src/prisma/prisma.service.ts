import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { LoginDto } from 'src/user/dto/login.dto';

@Injectable()
export class PrismaService extends PrismaClient {
  loginUser(user: LoginDto): import("../user/dto/login.dto").LoginDto | PromiseLike<import("../user/dto/login.dto").LoginDto> {
      throw new Error('Method not implemented.');
  }
  getData(): any {
      throw new Error('Method not implemented.');
  }
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
  }
}
