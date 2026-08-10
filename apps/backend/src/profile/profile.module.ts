import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileContextService } from './profile-context.service';
import { ProfileController } from './profile.controller';
import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ProfileController],
  providers: [
    { provide: ProfileService, useClass: ProfileService },
    { provide: ProfileRepository, useClass: ProfileRepository },
    { provide: ProfileContextService, useClass: ProfileContextService },
  ],
  exports: [ProfileService],
})
export class ProfileModule {}
