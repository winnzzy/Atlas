import { Inject, Injectable, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlDays: number;

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Optional() @Inject(ConfigService) private readonly configService?: ConfigService,
  ) {
    this.accessTokenTtlSeconds = this.resolveAccessTokenTtlSeconds();
    this.refreshTokenTtlDays = Number(this.getConfigValue('JWT_REFRESH_EXPIRATION_DAYS', '7'));
  }

  async generateTokenPair(user: {
    id: string;
    email: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    return { accessToken, refreshToken };
  }

  async generateAccessToken(user: { id: string; email: string }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: this.accessTokenTtlSeconds,
    });
  }

  generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  getRefreshTokenTtlDays(): number {
    return this.refreshTokenTtlDays;
  }

  getAccessTokenTtlSeconds(): number {
    return this.accessTokenTtlSeconds;
  }

  getRefreshTokenTtlMilliseconds(): number {
    return this.refreshTokenTtlDays * 24 * 60 * 60 * 1000;
  }

  generateTraceId(): string {
    return `trc_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private resolveAccessTokenTtlSeconds(): number {
    const value = this.getConfigValue('JWT_ACCESS_EXPIRATION', '15m');
    return this.parseDurationToSeconds(value ?? '15m');
  }

  private getConfigValue(key: string, fallback: string): string {
    if (this.configService) {
      return this.configService.get<string>(key, fallback) ?? fallback;
    }

    return process.env[key] ?? fallback;
  }

  private parseDurationToSeconds(value: string): number {
    if (/^\d+$/.test(value)) {
      return Number(value);
    }

    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) {
      return 900;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 60 * 60;
      case 'd':
        return amount * 60 * 60 * 24;
      default:
        return 900;
    }
  }
}
