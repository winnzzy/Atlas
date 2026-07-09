import { Injectable } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlDays: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenTtlSeconds = this.resolveAccessTokenTtlSeconds();
    this.refreshTokenTtlDays = Number(this.configService.get('JWT_REFRESH_EXPIRATION_DAYS', 7));
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
    const value = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
    return this.parseDurationToSeconds(value);
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
