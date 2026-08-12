import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  NotificationPreferenceResponseDto,
  NotificationPreviewResponseDto,
  NotificationResponseDto,
  NotificationSearchResponseDto,
  NotificationTemplateResponseDto,
} from '../dto';
import { CreateNotificationTemplateDto, PreviewNotificationTemplateDto, SearchNotificationsDto, UpdateNotificationPreferenceDto } from '../dto';
import { NotificationMapper } from '../mappers/notification.mapper';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { NotificationService } from '../services/notification.service';
import { NotificationTemplateService } from '../services/notification-template.service';
import { CurrentUser, type AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly templateService: NotificationTemplateService,
    private readonly mapper: NotificationMapper,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Search notifications' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationSearchResponseDto })
  async search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchNotificationsDto,
  ): Promise<NotificationSearchResponseDto> {
    return this.notificationService.searchForUser(user.id, query);
  }

  @Get('templates/catalog')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List notification templates' })
  @ApiResponse({ status: HttpStatus.OK, type: [NotificationTemplateResponseDto] })
  async listTemplatesCatalog(): Promise<NotificationTemplateResponseDto[]> {
    return this.listTemplates();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationResponseDto })
  async getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.getByIdForUser(user.id, id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationResponseDto })
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.markReadForUser(user.id, id);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel notification delivery' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationResponseDto })
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.cancelForUser(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear (remove) a notification for the current user' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: HttpStatus.OK })
  async clear(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ id: string; cleared: boolean }> {
    return this.notificationService.clearForUser(user.id, id);
  }

  @Get('preferences/:userId')
  @ApiOperation({ summary: 'List notification preferences for a customer' })
  @ApiResponse({ status: HttpStatus.OK, type: [NotificationPreferenceResponseDto] })
  async getPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ): Promise<NotificationPreferenceResponseDto[]> {
    this.assertSelf(user, userId);
    const preferences = await this.preferencesService.getPreferences(userId);
    return preferences.map((preference) => this.mapper.toPreferenceDto(preference));
  }

  @Patch('preferences/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a notification preference' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationPreferenceResponseDto })
  async updatePreference(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() body: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceResponseDto> {
    this.assertSelf(user, userId);
    const preference = await this.preferencesService.updatePreference(userId, body);
    return this.mapper.toPreferenceDto(preference);
  }

  private assertSelf(user: AuthenticatedUser, userId: string): void {
    if (user.id !== userId) {
      throw new ForbiddenException('You may only manage your own notification preferences');
    }
  }

  private async listTemplates(): Promise<NotificationTemplateResponseDto[]> {
    const templates = await this.templateService.listTemplates();
    return templates.map((template) => this.mapper.toTemplateDto(template));
  }

  @Post('templates')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update a notification template' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationTemplateResponseDto })
  async upsertTemplate(
    @Body() body: CreateNotificationTemplateDto,
  ): Promise<NotificationTemplateResponseDto> {
    const template = await this.templateService.createOrUpdateTemplate(body);
    return this.mapper.toTemplateDto(template);
  }

  @Post('templates/preview')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview a notification template' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationPreviewResponseDto })
  async previewTemplate(
    @Body() body: PreviewNotificationTemplateDto,
  ): Promise<NotificationPreviewResponseDto> {
    return this.templateService.preview(body);
  }
}
