import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AccountController } from './controllers/account.controller';
import { AccountRepository } from './repositories/account.repository';
import { AccountService } from './services/account.service';
import { AccountPolicy } from './policies/account.policy';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AccountController],
  providers: [AccountRepository, AccountPolicy, AccountService],
  exports: [AccountService, AccountRepository],
})
export class AccountsModule {}
