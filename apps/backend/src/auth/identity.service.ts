import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AuthRepository } from './auth.repository';
import { PasswordService } from './password.service';
import type { LoginDto, RegisterDto, ResetPasswordDto } from './dto';

@Injectable()
export class IdentityService {
  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
  ) {}

  async register(input: RegisterDto) {
    const existing = await this.authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.passwordService.hashPassword(input.password);
    const termsAcceptedAt = this.toValidDate(input.termsAcceptedAt);
    const privacyAcceptedAt = this.toValidDate(input.privacyAcceptedAt);

    return this.authRepository.createUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      termsAcceptedAt,
      privacyAcceptedAt,
    });
  }

  private toValidDate(value: string | undefined): Date {
    if (!value) {
      return new Date();
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  async validateCredentials(input: LoginDto) {
    const user = await this.authRepository.findUserByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED' || user.status === 'CLOSED') {
      throw new HttpException('Account is locked', HttpStatus.LOCKED);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new HttpException('Account is temporarily locked', HttpStatus.LOCKED);
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      user.passwordHash,
      input.password,
    );
    if (!isPasswordValid) {
      await this.authRepository.incrementFailedLogin(user.id);
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      return null;
    }

    const entropy = randomBytes(32).toString('base64url');
    const token = `${user.id}.${entropy}`;
    const tokenHash = await this.passwordService.hashValue(token);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.authRepository.storePasswordResetToken(user.id, tokenHash, expiresAt);

    return token;
  }

  async resetPassword(input: ResetPasswordDto): Promise<void> {
    const [userId] = input.token.split('.', 1);
    if (!userId) {
      throw new BadRequestException('Invalid reset token');
    }

    const metadata = await this.authRepository.readPasswordResetMetadata(userId);
    if (!metadata.tokenHash || !metadata.expiresAt || metadata.usedAt) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (new Date(metadata.expiresAt) <= new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const isValid = await this.passwordService.verifyHash(metadata.tokenHash, input.token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const passwordHash = await this.passwordService.hashPassword(input.newPassword);
    await this.authRepository.updatePassword(userId, passwordHash);
    await this.authRepository.markPasswordResetTokenUsed(userId);
  }

  async markLoginSuccess(userId: string, ipAddress: string): Promise<void> {
    await this.authRepository.updateSuccessfulLogin(userId, ipAddress);
  }
}
