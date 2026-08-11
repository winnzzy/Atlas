import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, type AuthenticatedUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto, LoginDto, RefreshTokenDto, RegisterDto, ResetPasswordDto } from './dto';
import {
  AuthSessionEnvelopeDto,
  MessageEnvelopeDto,
  OAuthProviderListEnvelopeDto,
  SessionListEnvelopeDto,
  TokenRefreshEnvelopeDto,
} from './dto/auth-response.dto';
import { SessionListQueryDto } from './dto/session-list-query.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a customer account' })
  @ApiCreatedResponse({ type: AuthSessionEnvelopeDto })
  async register(
    @Body() body: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(body, request);
    this.setAuthCookies(response, result.data.refreshToken, result.data.sessionId);
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate customer credentials' })
  @ApiOkResponse({ type: AuthSessionEnvelopeDto })
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body, request);
    this.setAuthCookies(response, result.data.refreshToken, result.data.sessionId);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({ type: TokenRefreshEnvelopeDto })
  async refresh(
    @Body() body: RefreshTokenDto = {} as RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const outcome = await this.authService.refresh(body, request);
    this.setAuthCookies(response, outcome.refreshToken, outcome.sessionId);
    return outcome.envelope;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End active session' })
  @ApiOkResponse({ type: MessageEnvelopeDto })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.logout(user.id, request);
    this.clearAuthCookies(response);
    return result;
  }

  @Public()
  @Post('password/forgot')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start password reset' })
  @ApiAcceptedResponse({ type: MessageEnvelopeDto })
  forgotPassword(@Body() body: ForgotPasswordDto, @Req() request: Request) {
    return this.authService.forgotPassword(body, request);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete password reset' })
  @ApiOkResponse({ type: MessageEnvelopeDto })
  resetPassword(@Body() body: ResetPasswordDto, @Req() request: Request) {
    return this.authService.resetPassword(body, request);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiOperation({ summary: 'List active sessions' })
  @ApiOkResponse({ type: SessionListEnvelopeDto })
  listSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SessionListQueryDto,
    @Req() request: Request,
  ) {
    return this.authService.listSessions(user.id, query, request);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiParam({ name: 'sessionId' })
  @ApiOkResponse({ type: MessageEnvelopeDto })
  revokeSession(@CurrentUser() user: AuthenticatedUser, @Param('sessionId') sessionId: string) {
    return this.authService.revokeSession(user.id, sessionId);
  }

  @Public()
  @Get('oauth/providers')
  @ApiOperation({ summary: 'List OAuth providers' })
  @ApiOkResponse({ type: OAuthProviderListEnvelopeDto })
  listOauthProviders() {
    return this.authService.listOauthProviders();
  }

  private setAuthCookies(response: Response, refreshToken: string, sessionId: string): void {
    const refreshMaxAge = 1000 * 60 * 60 * 24 * 7;
    const options = this.authService.buildCookieOptions(refreshMaxAge);

    response.cookie('refresh_token', refreshToken, {
      ...options,
    });

    response.cookie('atlas_session', sessionId, {
      ...options,
    });
  }

  private clearAuthCookies(response: Response): void {
    response.clearCookie('refresh_token', { path: '/api/v1/auth' });
    response.clearCookie('atlas_session', { path: '/api/v1/auth' });
  }
}
