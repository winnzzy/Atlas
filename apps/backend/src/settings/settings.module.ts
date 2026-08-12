import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicController } from './controllers/public.controller';
import { PublicContactService } from './public-contact.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicController],
  providers: [PublicContactService],
  exports: [PublicContactService],
})
export class SettingsModule {}
