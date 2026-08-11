import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationController } from './controllers/notification.controller';
import { NotificationEventHandler } from './events/notification-event.handler';
import { NotificationMapper } from './mappers/notification.mapper';
import { NotificationPolicy } from './policies/notification.policy';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationDeliveryService } from './services/notification-delivery.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { NotificationTemplateService } from './services/notification-template.service';
import { NotificationService } from './services/notification.service';
import { NotificationValidator } from './validators/notification.validator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [PrismaModule, AccountsModule],
  controllers: [NotificationController],
  providers: [
    RolesGuard,
    NotificationEventHandler,
    NotificationMapper,
    NotificationPolicy,
    NotificationRepository,
    NotificationDeliveryService,
    NotificationPreferencesService,
    NotificationService,
    NotificationTemplateService,
    NotificationValidator,
  ],
  exports: [
    NotificationDeliveryService,
    NotificationPreferencesService,
    NotificationService,
    NotificationTemplateService,
  ],
})
export class NotificationsModule {}
