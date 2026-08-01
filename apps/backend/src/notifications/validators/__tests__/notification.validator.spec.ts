import { BadRequestException } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { NotificationValidator } from '../notification.validator';

describe('NotificationValidator', () => {
  let validator: NotificationValidator;

  beforeEach(() => {
    validator = new NotificationValidator();
  });

  it('validates quiet hours', () => {
    expect(() => validator.validateQuietHours('22:00', '07:00')).not.toThrow();
  });

  it('throws when quiet hour pair is incomplete', () => {
    expect(() => validator.validateQuietHours('22:00', undefined)).toThrow(BadRequestException);
  });

  it('throws on invalid quiet hour format', () => {
    expect(() => validator.validateQuietHours('25:00', '07:00')).toThrow(BadRequestException);
    expect(() => validator.validateQuietHours('22:00', '7:00')).toThrow(BadRequestException);
  });

  it('validates template constraints', () => {
    expect(() =>
      validator.validateTemplate({
        code: 'auth.login',
        subjectTemplate: 'Login from {{ipAddress}}',
        bodyTemplate: 'Body',
        type: NotificationType.SECURITY,
        channel: NotificationChannel.IN_APP,
      }),
    ).not.toThrow();
  });

  it('rejects invalid template code and body', () => {
    expect(() =>
      validator.validateTemplate({
        code: 'Auth Login',
        subjectTemplate: 'x',
        bodyTemplate: 'y',
        type: NotificationType.SECURITY,
        channel: NotificationChannel.IN_APP,
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      validator.validateTemplate({
        code: 'auth.login',
        subjectTemplate: '  ',
        bodyTemplate: 'y',
        type: NotificationType.SECURITY,
        channel: NotificationChannel.IN_APP,
      }),
    ).toThrow(BadRequestException);
  });

  it('restricts marketing templates to email channel', () => {
    expect(() =>
      validator.validateTemplate({
        code: 'marketing.offer',
        subjectTemplate: 'Offer',
        bodyTemplate: 'Body',
        type: NotificationType.MARKETING,
        channel: NotificationChannel.IN_APP,
      }),
    ).toThrow(BadRequestException);
  });

  it('extracts unique template variables', () => {
    const variables = validator.extractTemplateVariables('Hello {{name}} {{ amount }} {{name}}');

    expect(variables.sort()).toEqual(['amount', 'name']);
  });
});
