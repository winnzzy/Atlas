import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Injectable } from '@nestjs/common';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { AuditService } from './audit.service';
import { AuthRepository } from './auth.repository';
import { IdentityService } from './identity.service';
import { DeviceService } from './device.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'fallback-secret'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    TokenService,
    PasswordService,
    SessionService,
    AuditService,
    IdentityService,
    DeviceService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, TokenService, JwtAuthGuard],
})
export class AuthModule {}
