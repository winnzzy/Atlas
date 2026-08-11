import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
import { NotificationMapper } from '../mappers/notification.mapper'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import { NotificationPreferencesService } from '../services/notification-preferences.service'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import { NotificationService } from '../services/notification.service'; // eslint-disable-line @typescript-eslint/consistent-type-imports
import { NotificationTemplateService } from '../services/notification-template.service'; // eslint-disable-line @typescript-eslint/consistent-type-imports

@ApiTags('Notifications')
@ApiBearerAuth()
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
  async search(@Query() query: SearchNotificationsDto): Promise<NotificationSearchResponseDto> {
    return this.notificationService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationResponseDto })
  async getById(@Param('id') id: string): Promise<NotificationResponseDto> {
    return this.notificationService.getById(id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationResponseDto })
  async markRead(@Param('id') id: string): Promise<NotificationResponseDto> {
    return this.notificationService.markRead(id);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel notification delivery' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationResponseDto })
  async cancel(@Param('id') id: string): Promise<NotificationResponseDto> {
    return this.notificationService.cancel(id);
  }

  @Get('preferences/:userId')
  @ApiOperation({ summary: 'List notification preferences for a customer' })
  @ApiResponse({ status: HttpStatus.OK, type: [NotificationPreferenceResponseDto] })
  async getPreferences(@Param('userId') userId: string): Promise<NotificationPreferenceResponseDto[]> {
    const preferences = await this.preferencesService.getPreferences(userId);
    return preferences.map((preference) => this.mapper.toPreferenceDto(preference));
  }

  @Patch('preferences/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a notification preference' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationPreferenceResponseDto })
  async updatePreference(
    @Param('userId') userId: string,
    @Body() body: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceResponseDto> {
    const preference = await this.preferencesService.updatePreference(userId, body);
    return this.mapper.toPreferenceDto(preference);
  }

  @Get('templates/catalog')
  @ApiOperation({ summary: 'List notification templates' })
  @ApiResponse({ status: HttpStatus.OK, type: [NotificationTemplateResponseDto] })
  async listTemplates(): Promise<NotificationTemplateResponseDto[]> {
    const templates = await this.templateService.listTemplates();
    return templates.map((template) => this.mapper.toTemplateDto(template));
  }

  @Post('templates')
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview a notification template' })
  @ApiResponse({ status: HttpStatus.OK, type: NotificationPreviewResponseDto })
  async previewTemplate(
    @Body() body: PreviewNotificationTemplateDto,
  ): Promise<NotificationPreviewResponseDto> {
    return this.templateService.preview(body);
  }
}
