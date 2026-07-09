import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AuditService } from './audit.service';
import type { DeviceService } from './device.service';
import type { IdentityService } from './identity.service';
import type { SessionService } from './session.service';
import type { TokenService } from './token.service';
import type {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';
import type { SessionListQueryDto } from './dto/session-list-query.dto';
import type {
  AuthSessionDto,
  OAuthProviderDto,
  SessionDto,
  TokenRefreshResponseDto,
} from './dto/auth-response.dto';

export interface ApiEnvelope<TData> {
  success: true;
  data: TData;
  meta: {
    traceId: string;
    timestamp: string;
    pagination?: {
      mode: 'offset';
      offset: {
        total: number;
        offset: number;
        limit: number;
      };
    };
  };
  error: null;
}

export interface RefreshOutcome {
  envelope: ApiEnvelope<TokenRefreshResponseDto>;
  refreshToken: string;
  sessionId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly identityService: IdentityService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly deviceService: DeviceService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  async register(input: RegisterDto, request: Request): Promise<ApiEnvelope<AuthSessionDto>> {
    const user = await this.identityService.register(input);

    const authSession = await this.createAuthSession(user.id, user.email, request, {
      explicitDeviceId: undefined,
      explicitDeviceName: undefined,
    });

    await this.identityService.markLoginSuccess(user.id, authSession.device.ipAddress);
    await this.auditService.logLoginSuccess(
      user.id,
      authSession.device.ipAddress,
      authSession.device.userAgent,
    );

    return this.envelope(authSession.data);
  }

  async login(input: LoginDto, request: Request): Promise<ApiEnvelope<AuthSessionDto>> {
    const user = await this.identityService.validateCredentials(input);

    const authSession = await this.createAuthSession(user.id, user.email, request, {
      explicitDeviceId: input.deviceId,
      explicitDeviceName: input.deviceName,
    });

    await this.identityService.markLoginSuccess(user.id, authSession.device.ipAddress);
    await this.auditService.logLoginSuccess(
      user.id,
      authSession.device.ipAddress,
      authSession.device.userAgent,
    );

    return this.envelope(authSession.data);
  }

  async refresh(input: RefreshTokenDto | undefined, request: Request): Promise<RefreshOutcome> {
    const refreshToken = this.extractRefreshToken(request, input?.refreshToken);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const currentSessionId = this.extractSessionId(request);
    const session = await this.sessionService.findSessionByRefreshToken(
      refreshToken,
      currentSessionId,
    );

    const tokens = await this.tokenService.generateTokenPair({
      id: session.userId,
      email: session.user.email,
    });

    await this.sessionService.rotateSessionTokens(
      session.id,
      tokens.accessToken,
      tokens.refreshToken,
    );
    await this.auditService.logTokenRefresh(
      session.userId,
      this.extractIpAddress(request),
      this.extractUserAgent(request),
    );

    return {
      envelope: this.envelope({
        accessToken: tokens.accessToken,
        tokenType: 'Bearer',
        expiresIn: this.tokenService.getAccessTokenTtlSeconds(),
      }),
      refreshToken: tokens.refreshToken,
      sessionId: session.id,
    };
  }

  async logout(userId: string, request: Request): Promise<ApiEnvelope<{ message: string }>> {
    const sessionId = this.extractSessionId(request);
    if (sessionId) {
      await this.sessionService.revokeSessionById(sessionId, userId);
    } else {
      const accessToken = this.extractBearerToken(request);
      if (accessToken) {
        await this.sessionService.revokeSessionByAccessToken(accessToken, userId);
      }
    }

    await this.auditService.logLogout(
      userId,
      this.extractIpAddress(request),
      this.extractUserAgent(request),
    );

    return this.envelope({ message: 'Session revoked.' });
  }

  async forgotPassword(
    input: ForgotPasswordDto,
    request: Request,
  ): Promise<ApiEnvelope<{ message: string }>> {
    await this.identityService.createPasswordResetToken(input.email);
    await this.auditService.logPasswordResetRequest(
      this.extractIpAddress(request),
      this.extractUserAgent(request),
      input.email,
    );

    return this.envelope({ message: 'If an account exists, reset instructions were sent.' });
  }

  async resetPassword(
    input: ResetPasswordDto,
    request: Request,
  ): Promise<ApiEnvelope<{ message: string }>> {
    await this.identityService.resetPassword(input);

    const [userId] = input.token.split('.', 1);
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    await this.sessionService.revokeAllSessionsForUser(userId);
    await this.auditService.logPasswordResetComplete(
      userId,
      this.extractIpAddress(request),
      this.extractUserAgent(request),
    );

    return this.envelope({ message: 'Password reset completed.' });
  }

  async listSessions(
    userId: string,
    query: SessionListQueryDto,
    request: Request,
  ): Promise<ApiEnvelope<SessionDto[]>> {
    const currentSessionId = this.extractSessionId(request);
    const result = await this.sessionService.listSessions(userId, query, currentSessionId);

    return this.envelope(result.items, {
      pagination: {
        mode: 'offset',
        offset: {
          total: result.total,
          offset: query.offset,
          limit: query.limit,
        },
      },
    });
  }

  async revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<ApiEnvelope<{ message: string }>> {
    await this.sessionService.revokeSessionById(sessionId, userId);
    return this.envelope({ message: 'Session revoked.' });
  }

  listOauthProviders(): ApiEnvelope<OAuthProviderDto[]> {
    const providers: OAuthProviderDto[] = [
      {
        id: 'google',
        name: 'Google',
        authorizationUrl: 'https://auth.atlasbank.com/oauth2/authorize?provider=google',
        enabled: false,
      },
      {
        id: 'apple',
        name: 'Apple',
        authorizationUrl: 'https://auth.atlasbank.com/oauth2/authorize?provider=apple',
        enabled: false,
      },
    ];

    return this.envelope(providers);
  }

  buildCookieOptions(maxAgeMs: number) {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/api/v1/auth',
      maxAge: maxAgeMs,
    };
  }

  private async createAuthSession(
    userId: string,
    email: string,
    request: Request,
    options: {
      explicitDeviceId?: string;
      explicitDeviceName?: string;
    },
  ): Promise<{
    data: AuthSessionDto;
    device: {
      deviceId: string;
      deviceName: string;
      userAgent: string;
      ipAddress: string;
    };
  }> {
    const tokens = await this.tokenService.generateTokenPair({ id: userId, email });
    const device = this.deviceService.deriveDeviceInfo({
      userAgent: this.extractUserAgent(request),
      ipAddress: this.extractIpAddress(request),
      explicitDeviceId: options.explicitDeviceId,
      explicitDeviceName: options.explicitDeviceName,
    });

    const sessionId = await this.sessionService.createSession(
      userId,
      tokens.accessToken,
      tokens.refreshToken,
      device,
    );

    return {
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: this.tokenService.getAccessTokenTtlSeconds(),
        sessionId,
      },
      device,
    };
  }

  private envelope<TData>(
    data: TData,
    extraMeta?: {
      pagination?: {
        mode: 'offset';
        offset: {
          total: number;
          offset: number;
          limit: number;
        };
      };
    },
  ): ApiEnvelope<TData> {
    return {
      success: true,
      data,
      meta: {
        traceId: this.tokenService.generateTraceId(),
        timestamp: new Date().toISOString(),
        ...(extraMeta?.pagination ? { pagination: extraMeta.pagination } : {}),
      },
      error: null,
    };
  }

  private extractRefreshToken(request: Request, tokenFromBody?: string): string | null {
    const cookies = this.parseCookies(request.headers.cookie);
    return tokenFromBody ?? cookies['refresh_token'] ?? null;
  }

  private extractSessionId(request: Request): string | undefined {
    const cookies = this.parseCookies(request.headers.cookie);
    return cookies['atlas_session'];
  }

  private extractUserAgent(request: Request): string {
    return request.headers['user-agent'] ?? 'Unknown Agent';
  }

  private extractIpAddress(request: Request): string {
    if (typeof request.ip === 'string' && request.ip.length > 0) {
      return request.ip;
    }

    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return forwardedFor.split(',')[0]?.trim() ?? '0.0.0.0';
    }

    return '0.0.0.0';
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.slice('Bearer '.length).trim();
  }

  private parseCookies(header: string | undefined): Record<string, string> {
    if (!header) {
      return {};
    }

    return header.split(';').reduce<Record<string, string>>((acc, part) => {
      const [key, ...rest] = part.trim().split('=');
      if (!key) {
        return acc;
      }
      acc[key] = decodeURIComponent(rest.join('='));
      return acc;
    }, {});
  }
}
