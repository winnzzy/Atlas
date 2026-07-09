import { Module } from '@nestjs/common';
import { ProfileContextService } from './profile-context.service';
import { ProfileController } from './profile.controller';
import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, ProfileRepository, ProfileContextService],
  exports: [ProfileService],
})
export class ProfileModule {}
