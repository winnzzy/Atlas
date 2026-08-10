import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  ActiveSession,
  ConnectedDevice,
  CustomerPreferences,
  CustomerProfile,
  CustomerProfileActivity,
  CustomerSecurity,
  ProfileActivityItem,
  SecurityTimelineEvent,
  UpdateCustomerPreferencesInput,
  UpdateCustomerProfileInput,
  UpdateCustomerSecurityInput,
} from '@atlas/types';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  mockAccessibilityPreferences,
  mockActiveSessions,
  mockConnectedDevices,
  mockCustomerActivity,
  mockCustomerPreferences,
  mockCustomerProfile,
  mockCustomerSecurity,
  mockNotificationPreferences,
  mockProfileDocuments,
  mockSecurityEvents,
} from './profile.fixtures';

type ProfileMetadataShape = {
  profile?: {
    dateOfBirth?: string;
    ssnLast4?: string;
    address?: CustomerProfile['address'];
    employment?: CustomerProfile['employment'];
    taxInformation?: CustomerProfile['taxInformation'];
    documents?: CustomerProfile['documents'];
  };
  preferences?: {
    accessibility?: CustomerPreferences['accessibility'];
  };
  security?: {
    biometricUnlockEnabled?: boolean;
    sessionTimeoutMinutes?: number;
    connectedDevices?: ConnectedDevice[];
    activeSessions?: ActiveSession[];
    recentEvents?: SecurityTimelineEvent[];
  };
  activity?: {
    items?: ProfileActivityItem[];
  };
};

type MutableMockState = {
  profile: CustomerProfile;
  preferences: CustomerPreferences;
  security: CustomerSecurity;
  activity: CustomerProfileActivity;
};

const mockState: MutableMockState = {
  profile: structuredClone(mockCustomerProfile),
  preferences: structuredClone(mockCustomerPreferences),
  security: structuredClone(mockCustomerSecurity),
  activity: structuredClone(mockCustomerActivity),
};

@Injectable()
export class ProfileRepository {
  private readonly logger = new Logger(ProfileRepository.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<CustomerProfile> {
    return this.withDatabaseFallback(
      async () => {
        await this.ensureMockRecords(userId);
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const userSetting = await this.prisma.userSetting.findUnique({ where: { userId } });
        const documents = await this.prisma.kycDocument.findMany({
          where: { userId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        const metadata = this.getProfileMetadata(user.metadata);
        const address = metadata.profile?.address ?? mockCustomerProfile.address;
        const employment = metadata.profile?.employment ?? mockCustomerProfile.employment;
        const taxInformation =
          metadata.profile?.taxInformation ?? mockCustomerProfile.taxInformation;

        return {
          id: user.id,
          avatarInitials: `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase(),
          personalInformation: {
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`,
            dateOfBirth:
              metadata.profile?.dateOfBirth ?? mockCustomerProfile.personalInformation.dateOfBirth,
            ssnLast4:
              metadata.profile?.ssnLast4 ?? mockCustomerProfile.personalInformation.ssnLast4,
          },
          contactInformation: {
            email: user.email,
            phoneNumber: user.phoneNumber ?? mockCustomerProfile.contactInformation.phoneNumber,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
          },
          address,
          employment,
          taxInformation,
          preferredCurrency: userSetting?.currency ?? mockCustomerProfile.preferredCurrency,
          preferredLanguage:
            this.mapLanguage(userSetting?.language) ?? mockCustomerProfile.preferredLanguage,
          timezone: userSetting?.timezone ?? mockCustomerProfile.timezone,
          verification: {
            kycStatus: user.kycStatus,
            kycLevel: user.kycLevel,
            overallStatus:
              user.kycStatus === 'APPROVED'
                ? 'verified'
                : user.kycStatus === 'UNDER_REVIEW'
                  ? 'under_review'
                  : 'pending',
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
          },
          documents:
            documents.length > 0
              ? documents.map(
                  (document: {
                    id: string;
                    documentType: string;
                    status: string;
                    createdAt: Date;
                    expirationDate: Date;
                  }) => ({
                    id: document.id,
                    type: document.documentType.toLowerCase() as
                      'drivers_license' | 'passport' | 'state_id',
                    status:
                      document.status === 'APPROVED'
                        ? 'verified'
                        : document.status === 'UNDER_REVIEW'
                          ? 'under_review'
                          : 'pending',
                    uploadedAt: document.createdAt.toISOString(),
                    expiresAt: document.expirationDate.toISOString().slice(0, 10),
                  }),
                )
              : (metadata.profile?.documents ?? mockProfileDocuments),
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
      },
      () => structuredClone(mockState.profile),
    );
  }

  async updateProfile(userId: string, input: UpdateCustomerProfileInput): Promise<CustomerProfile> {
    return this.withDatabaseFallback(
      async () => {
        await this.ensureMockRecords(userId);
        const current = await this.getProfile(userId);
        const mergedProfile = {
          ...current,
          personalInformation: {
            ...current.personalInformation,
            ...input.personalInformation,
          },
          contactInformation: {
            ...current.contactInformation,
            ...input.contactInformation,
          },
          address: {
            ...current.address,
            ...input.address,
          },
          employment: {
            ...current.employment,
            ...input.employment,
          },
          taxInformation: {
            ...current.taxInformation,
            ...input.taxInformation,
          },
        } satisfies CustomerProfile;

        const user = await this.prisma.user.update({
          where: { id: userId },
          data: {
            firstName: mergedProfile.personalInformation.firstName,
            lastName: mergedProfile.personalInformation.lastName,
            email: mergedProfile.contactInformation.email,
            phoneNumber: mergedProfile.contactInformation.phoneNumber,

            metadata: this.buildMetadataFromProfile(
              mergedProfile,
              await this.readCurrentMetadata(userId),
            ) as unknown as Prisma.InputJsonValue,
          },
        });

        return {
          ...mergedProfile,
          updatedAt: user.updatedAt.toISOString(),
        };
      },
      () => {
        mockState.profile = {
          ...mockState.profile,
          personalInformation: {
            ...mockState.profile.personalInformation,
            ...input.personalInformation,
            fullName: `${input.personalInformation?.firstName ?? mockState.profile.personalInformation.firstName} ${input.personalInformation?.lastName ?? mockState.profile.personalInformation.lastName}`,
          },
          contactInformation: {
            ...mockState.profile.contactInformation,
            ...input.contactInformation,
          },
          address: {
            ...mockState.profile.address,
            ...input.address,
          },
          employment: {
            ...mockState.profile.employment,
            ...input.employment,
          },
          taxInformation: {
            ...mockState.profile.taxInformation,
            ...input.taxInformation,
          },
          updatedAt: new Date().toISOString(),
        };
        return structuredClone(mockState.profile);
      },
    );
  }

  async getPreferences(userId: string): Promise<CustomerPreferences> {
    return this.withDatabaseFallback(
      async () => {
        await this.ensureMockRecords(userId);
        const userSetting = await this.prisma.userSetting.findUnique({ where: { userId } });
        const notificationPreference = await this.prisma.notificationPreference.findUnique({
          where: { userId },
        });
        const metadata = await this.readCurrentMetadata(userId);

        return {
          preferredCurrency: userSetting?.currency ?? mockCustomerPreferences.preferredCurrency,
          preferredLanguage:
            this.mapLanguage(userSetting?.language) ?? mockCustomerPreferences.preferredLanguage,
          timezone: userSetting?.timezone ?? mockCustomerPreferences.timezone,
          theme: this.mapTheme(userSetting?.theme) ?? mockCustomerPreferences.theme,
          notificationPreferences: {
            emailEnabled:
              notificationPreference?.emailEnabled ?? mockNotificationPreferences.emailEnabled,
            smsEnabled:
              notificationPreference?.smsEnabled ?? mockNotificationPreferences.smsEnabled,
            pushEnabled:
              notificationPreference?.pushEnabled ?? mockNotificationPreferences.pushEnabled,
            transactionAlerts:
              notificationPreference?.transactionAlerts ??
              mockNotificationPreferences.transactionAlerts,
            securityAlerts:
              notificationPreference?.securityAlerts ?? mockNotificationPreferences.securityAlerts,
            marketingEmails:
              notificationPreference?.marketingEmails ??
              mockNotificationPreferences.marketingEmails,
            loginAlerts:
              notificationPreference?.loginAlerts ?? mockNotificationPreferences.loginAlerts,
            balanceAlerts:
              notificationPreference?.balanceAlerts ?? mockNotificationPreferences.balanceAlerts,
            transferAlerts:
              notificationPreference?.transferAlerts ?? mockNotificationPreferences.transferAlerts,
          },
          accessibility: metadata.preferences?.accessibility ?? mockAccessibilityPreferences,
        };
      },
      () => structuredClone(mockState.preferences),
    );
  }

  async updatePreferences(
    userId: string,
    input: UpdateCustomerPreferencesInput,
  ): Promise<CustomerPreferences> {
    return this.withDatabaseFallback(
      async () => {
        await this.ensureMockRecords(userId);
        const current = await this.getPreferences(userId);
        const merged = {
          ...current,
          ...this.pickDefinedTopLevelPreferences(input),
          notificationPreferences: {
            ...current.notificationPreferences,
            ...input.notificationPreferences,
          },
          accessibility: {
            ...current.accessibility,
            ...input.accessibility,
          },
        } satisfies CustomerPreferences;

        await this.prisma.userSetting.upsert({
          where: { userId },
          create: {
            userId,
            currency: merged.preferredCurrency,
            language: merged.preferredLanguage.toUpperCase() as 'EN' | 'ES',
            timezone: merged.timezone,
            theme: merged.theme.toUpperCase() as 'LIGHT' | 'DARK' | 'SYSTEM',
          },
          update: {
            currency: merged.preferredCurrency,
            language: merged.preferredLanguage.toUpperCase() as 'EN' | 'ES',
            timezone: merged.timezone,
            theme: merged.theme.toUpperCase() as 'LIGHT' | 'DARK' | 'SYSTEM',
          },
        });

        await this.prisma.notificationPreference.upsert({
          where: { userId },
          create: {
            userId,
            ...merged.notificationPreferences,
          },
          update: {
            ...merged.notificationPreferences,
          },
        });

        const metadata = await this.readCurrentMetadata(userId);
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            metadata: {
              ...metadata,
              preferences: {
                ...metadata.preferences,
                accessibility: merged.accessibility,
              },
            } as unknown as Prisma.InputJsonValue,
          },
        });

        return merged;
      },
      () => {
        mockState.preferences = {
          ...mockState.preferences,
          ...this.pickDefinedTopLevelPreferences(input),
          notificationPreferences: {
            ...mockState.preferences.notificationPreferences,
            ...input.notificationPreferences,
          },
          accessibility: {
            ...mockState.preferences.accessibility,
            ...input.accessibility,
          },
        };
        return structuredClone(mockState.preferences);
      },
    );
  }

  async getSecurity(userId: string): Promise<CustomerSecurity> {
    return this.withDatabaseFallback<CustomerSecurity>(
      async () => {
        await this.ensureMockRecords(userId);
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const notificationPreference = await this.prisma.notificationPreference.findUnique({
          where: { userId },
        });
        const sessions = await this.prisma.userSession.findMany({
          where: { userId, deletedAt: null, isActive: true },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        });
        const securityEvents = await this.prisma.securityEvent.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
        const metadata = await this.readCurrentMetadata(userId);

        return {
          mfaEnabled: user.mfaEnabled,
          mfaMethod: user.mfaMethod ?? mockCustomerSecurity.mfaMethod,
          biometricUnlockEnabled:
            metadata.security?.biometricUnlockEnabled ??
            mockCustomerSecurity.biometricUnlockEnabled,
          loginAlertsEnabled:
            notificationPreference?.loginAlerts ?? mockCustomerSecurity.loginAlertsEnabled,
          sessionTimeoutMinutes:
            metadata.security?.sessionTimeoutMinutes ?? mockCustomerSecurity.sessionTimeoutMinutes,
          lastPasswordChangedAt:
            user.passwordChangedAt?.toISOString() ?? mockCustomerSecurity.lastPasswordChangedAt,
          lastLoginAt: user.lastLoginAt?.toISOString() ?? mockCustomerSecurity.lastLoginAt,
          connectedDevices:
            sessions.length > 0
              ? this.mapSessionsToDevices(sessions)
              : (metadata.security?.connectedDevices ?? mockConnectedDevices),
          activeSessions:
            sessions.length > 0
              ? this.mapSessionsToActiveSessions(sessions)
              : (metadata.security?.activeSessions ?? mockActiveSessions),
          recentEvents:
            securityEvents.length > 0
              ? this.mapSecurityEvents(securityEvents)
              : (metadata.security?.recentEvents ?? mockSecurityEvents),
        };
      },
      () => structuredClone(mockState.security) as CustomerSecurity,
    );
  }

  async updateSecurity(
    userId: string,
    input: UpdateCustomerSecurityInput,
  ): Promise<CustomerSecurity> {
    return this.withDatabaseFallback(
      async () => {
        await this.ensureMockRecords(userId);
        const current = await this.getSecurity(userId);
        const merged: CustomerSecurity = {
          ...current,
          ...this.pickDefinedTopLevelSecurity(input),
          mfaMethod: input.mfaMethod ?? current.mfaMethod,
        };

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            mfaEnabled: merged.mfaEnabled,
            mfaMethod: merged.mfaMethod,
          },
        });

        await this.prisma.notificationPreference.upsert({
          where: { userId },
          create: {
            userId,
            ...mockNotificationPreferences,
            loginAlerts: merged.loginAlertsEnabled,
          },
          update: {
            loginAlerts: merged.loginAlertsEnabled,
          },
        });

        const metadata = await this.readCurrentMetadata(userId);
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            metadata: {
              ...metadata,
              security: {
                ...metadata.security,
                biometricUnlockEnabled: merged.biometricUnlockEnabled,
                sessionTimeoutMinutes: merged.sessionTimeoutMinutes,
                connectedDevices: merged.connectedDevices,
                activeSessions: merged.activeSessions,
                recentEvents: merged.recentEvents,
              },
            } as unknown as Prisma.InputJsonValue,
          },
        });

        return merged;
      },
      () => {
        mockState.security = {
          ...mockState.security,
          ...this.pickDefinedTopLevelSecurity(input),
          mfaMethod: input.mfaMethod ?? mockState.security.mfaMethod,
        };
        return structuredClone(mockState.security);
      },
    );
  }

  async getActivity(userId: string): Promise<CustomerProfileActivity> {
    return this.withDatabaseFallback(
      async () => {
        await this.ensureMockRecords(userId);
        const loginHistory = await this.prisma.loginHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });
        const securityEvents = await this.prisma.securityEvent.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });
        const metadata = await this.readCurrentMetadata(userId);

        const activityItems: ProfileActivityItem[] = [
          ...loginHistory.map(
            (item: {
              id: string;
              isSuccessful: boolean;
              loginMethod: string;
              failureReason: string | null;
              createdAt: Date;
              location: unknown;
              deviceInfo: unknown;
            }) => ({
              id: item.id,
              type: 'login' as const,
              title: item.isSuccessful ? 'Successful sign in' : 'Unsuccessful sign in',
              description: item.isSuccessful
                ? `Signed in using ${item.loginMethod}.`
                : (item.failureReason ?? 'Login attempt failed.'),
              timestamp: item.createdAt.toISOString(),
              location: this.readLocation(item.location),
              deviceName: this.readDeviceName(item.deviceInfo),
            }),
          ),
          ...securityEvents.map(
            (item: {
              id: string;
              eventType: string;
              description: string;
              createdAt: Date;
              location: unknown;
              deviceInfo: unknown;
            }) => ({
              id: item.id,
              type: 'security' as const,
              title: item.eventType.replace(/_/g, ' '),
              description: item.description,
              timestamp: item.createdAt.toISOString(),
              location: this.readLocation(item.location),
              deviceName: this.readDeviceName(item.deviceInfo),
            }),
          ),
        ].sort(
          (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
        );

        return {
          items:
            activityItems.length > 0
              ? activityItems
              : (metadata.activity?.items ?? mockCustomerActivity.items),
        };
      },
      () => structuredClone(mockState.activity),
    );
  }

  private async ensureMockRecords(userId: string): Promise<void> {
    const currentMetadata = await this.readCurrentMetadata(userId).catch(() => undefined);
    await this.prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: mockCustomerProfile.contactInformation.email,
        passwordHash: 'mock-password-hash',
        firstName: mockCustomerProfile.personalInformation.firstName,
        lastName: mockCustomerProfile.personalInformation.lastName,
        phoneNumber: mockCustomerProfile.contactInformation.phoneNumber,
        emailVerified: mockCustomerProfile.contactInformation.emailVerified,
        phoneVerified: mockCustomerProfile.contactInformation.phoneVerified,
        status: 'ACTIVE',
        kycStatus: 'APPROVED',
        kycLevel: 'LEVEL_2',
        mfaEnabled: mockCustomerSecurity.mfaEnabled,
        mfaMethod: mockCustomerSecurity.mfaMethod,
        lastLoginAt: new Date(mockCustomerSecurity.lastLoginAt ?? mockCustomerProfile.updatedAt),
        passwordChangedAt: new Date(
          mockCustomerSecurity.lastPasswordChangedAt ?? mockCustomerProfile.updatedAt,
        ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: this.buildInitialMetadata() as any,
      },
      update: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: (currentMetadata ?? this.buildInitialMetadata()) as any,
      },
    });

    await this.prisma.userSetting.upsert({
      where: { userId },
      create: {
        userId,
        language: 'EN',
        theme: 'SYSTEM',
        timezone: mockCustomerPreferences.timezone,
        currency: mockCustomerPreferences.preferredCurrency,
      },
      update: {},
    });

    await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...mockNotificationPreferences,
      },
      update: {},
    });
  }

  private buildInitialMetadata(): ProfileMetadataShape {
    return {
      profile: {
        dateOfBirth: mockCustomerProfile.personalInformation.dateOfBirth,
        ssnLast4: mockCustomerProfile.personalInformation.ssnLast4,
        address: mockCustomerProfile.address,
        employment: mockCustomerProfile.employment,
        taxInformation: mockCustomerProfile.taxInformation,
        documents: mockCustomerProfile.documents,
      },
      preferences: {
        accessibility: mockAccessibilityPreferences,
      },
      security: {
        biometricUnlockEnabled: mockCustomerSecurity.biometricUnlockEnabled,
        sessionTimeoutMinutes: mockCustomerSecurity.sessionTimeoutMinutes,
        connectedDevices: mockConnectedDevices as ConnectedDevice[],
        activeSessions: mockActiveSessions as ActiveSession[],
        recentEvents: mockSecurityEvents as SecurityTimelineEvent[],
      },
      activity: {
        items: mockCustomerActivity.items as ProfileActivityItem[],
      },
    };
  }

  private buildMetadataFromProfile(
    profile: CustomerProfile,
    currentMetadata: ProfileMetadataShape,
  ): ProfileMetadataShape {
    return {
      ...currentMetadata,
      profile: {
        ...currentMetadata.profile,
        dateOfBirth: profile.personalInformation.dateOfBirth,
        ssnLast4: profile.personalInformation.ssnLast4,
        address: profile.address,
        employment: profile.employment,
        taxInformation: profile.taxInformation,
        documents: profile.documents,
      },
    };
  }

  private async readCurrentMetadata(userId: string): Promise<ProfileMetadataShape> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    return this.getProfileMetadata(user?.metadata);
  }

  private getProfileMetadata(metadata: unknown): ProfileMetadataShape {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return this.buildInitialMetadata();
    }
    return {
      ...this.buildInitialMetadata(),
      ...(metadata as ProfileMetadataShape),
    };
  }

  private mapLanguage(language: string | undefined): 'en' | 'es' | undefined {
    if (language === 'EN') return 'en';
    if (language === 'ES') return 'es';
    return undefined;
  }

  private mapTheme(theme: string | undefined): 'light' | 'dark' | 'system' | undefined {
    if (theme === 'LIGHT') return 'light';
    if (theme === 'DARK') return 'dark';
    if (theme === 'SYSTEM') return 'system';
    return undefined;
  }

  private mapSessionsToDevices(
    sessions: Array<{
      id: string;
      deviceId: string | null;
      userAgent: string;
      ipAddress: string;
      updatedAt: Date;
    }>,
  ): ConnectedDevice[] {
    return sessions.map((session, index) => ({
      id: session.deviceId ?? session.id,
      name: session.deviceId ?? `Browser Session ${index + 1}`,
      platform: this.parsePlatform(session.userAgent),
      browser: this.parseBrowser(session.userAgent),
      location: 'United States',
      ipAddress: session.ipAddress,
      lastActiveAt: session.updatedAt.toISOString(),
      isCurrent: index === 0,
      isTrusted: true,
    }));
  }

  private mapSessionsToActiveSessions(
    sessions: Array<{
      id: string;
      deviceId: string | null;
      userAgent: string;
      ipAddress: string;
      createdAt: Date;
      expiresAt: Date;
    }>,
  ): ActiveSession[] {
    return sessions.map((session, index) => ({
      id: session.id,
      deviceName: session.deviceId ?? this.parseBrowser(session.userAgent),
      ipAddress: session.ipAddress,
      startedAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      isCurrent: index === 0,
      status:
        session.expiresAt.getTime() - Date.now() < 1000 * 60 * 60 ? 'expiring_soon' : 'active',
    }));
  }

  private mapSecurityEvents(
    events: Array<{
      id: string;
      eventType: string;
      description: string;
      riskScore: number | null;
      createdAt: Date;
    }>,
  ): SecurityTimelineEvent[] {
    return events.map((event) => ({
      id: event.id,
      title: event.eventType.replace(/_/g, ' '),
      description: event.description,
      severity:
        event.riskScore !== null && event.riskScore >= 80
          ? 'critical'
          : event.riskScore !== null && event.riskScore >= 50
            ? 'warning'
            : 'info',
      occurredAt: event.createdAt.toISOString(),
    }));
  }

  private readLocation(location: unknown): string | undefined {
    if (!location || typeof location !== 'object' || Array.isArray(location)) {
      return undefined;
    }
    const city =
      typeof (location as Record<string, unknown>).city === 'string'
        ? (location as Record<string, string>).city
        : undefined;
    const region =
      typeof (location as Record<string, unknown>).region === 'string'
        ? (location as Record<string, string>).region
        : undefined;
    return [city, region].filter(Boolean).join(', ') || undefined;
  }

  private readDeviceName(deviceInfo: unknown): string | undefined {
    if (!deviceInfo || typeof deviceInfo !== 'object' || Array.isArray(deviceInfo)) {
      return undefined;
    }
    const name = (deviceInfo as Record<string, unknown>).name;
    return typeof name === 'string' ? name : undefined;
  }

  private parsePlatform(userAgent: string): string {
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('iPhone')) return 'iOS';
    if (userAgent.includes('Windows')) return 'Windows';
    return 'Unknown';
  }

  private parseBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    return 'Browser';
  }

  private pickDefinedTopLevelPreferences(
    input: UpdateCustomerPreferencesInput,
  ): Partial<CustomerPreferences> {
    return {
      ...(input.preferredCurrency !== undefined
        ? { preferredCurrency: input.preferredCurrency }
        : {}),
      ...(input.preferredLanguage !== undefined
        ? { preferredLanguage: input.preferredLanguage }
        : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.theme !== undefined ? { theme: input.theme } : {}),
    };
  }

  private pickDefinedTopLevelSecurity(
    input: UpdateCustomerSecurityInput,
  ): Partial<CustomerSecurity> {
    return {
      ...(input.mfaEnabled !== undefined ? { mfaEnabled: input.mfaEnabled } : {}),
      ...(input.biometricUnlockEnabled !== undefined
        ? { biometricUnlockEnabled: input.biometricUnlockEnabled }
        : {}),
      ...(input.loginAlertsEnabled !== undefined
        ? { loginAlertsEnabled: input.loginAlertsEnabled }
        : {}),
      ...(input.sessionTimeoutMinutes !== undefined
        ? { sessionTimeoutMinutes: input.sessionTimeoutMinutes }
        : {}),
    };
  }

  private async withDatabaseFallback<T>(action: () => Promise<T>, fallback: () => T): Promise<T> {
    try {
      return await action();
    } catch (error) {
      this.logger.warn(
        `Falling back to mock profile repository state: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return fallback();
    }
  }
}
