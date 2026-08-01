import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@prisma/client';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const TEMPLATE_TOKEN_PATTERN = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

@Injectable()
export class NotificationValidator {
  validateQuietHours(start?: string, end?: string): void {
    if ((start && !end) || (!start && end)) {
      throw new BadRequestException('Quiet hours require both start and end times');
    }

    if (start && !TIME_PATTERN.test(start)) {
      throw new BadRequestException('quietHoursStart must use HH:mm format');
    }

    if (end && !TIME_PATTERN.test(end)) {
      throw new BadRequestException('quietHoursEnd must use HH:mm format');
    }
  }

  validateTemplate(input: {
    code: string;
    subjectTemplate: string;
    bodyTemplate: string;
    type: NotificationType;
    channel: NotificationChannel;
  }): void {
    if (!/^[a-z][a-z0-9._-]+$/.test(input.code)) {
      throw new BadRequestException('Template code must be lowercase and may include dots, dashes, and underscores');
    }

    if (input.subjectTemplate.trim().length === 0 || input.bodyTemplate.trim().length === 0) {
      throw new BadRequestException('Template subject and body are required');
    }

    if (input.type === NotificationType.MARKETING && input.channel !== NotificationChannel.EMAIL) {
      throw new BadRequestException('Marketing notifications are restricted to email templates');
    }
  }

  extractTemplateVariables(template: string): string[] {
    const variables = new Set<string>();
    for (const match of template.matchAll(TEMPLATE_TOKEN_PATTERN)) {
      const variable = match[1];
      if (variable) {
        variables.add(variable);
      }
    }
    return Array.from(variables);
  }
}
