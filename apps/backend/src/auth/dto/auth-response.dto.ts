import { ApiProperty } from '@nestjs/swagger';
import { ApiErrorDto, ApiMetaDto } from './api-envelope.dto';

export class AuthSessionDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ enum: ['Bearer'] })
  tokenType!: 'Bearer';

  @ApiProperty()
  expiresIn!: number;

  @ApiProperty()
  sessionId!: string;
}

export class TokenRefreshResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ enum: ['Bearer'] })
  tokenType!: 'Bearer';

  @ApiProperty()
  expiresIn!: number;
}

export class SessionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  device!: string;

  @ApiProperty()
  ipAddress!: string;

  @ApiProperty()
  userAgent!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  @ApiProperty()
  isCurrent!: boolean;
}

export class OAuthProviderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'uri' })
  authorizationUrl!: string;

  @ApiProperty()
  enabled!: boolean;
}

export class MessageDto {
  @ApiProperty()
  message!: string;
}

export class AuthSessionEnvelopeDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty({ type: AuthSessionDto, nullable: true })
  data!: AuthSessionDto | null;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;

  @ApiProperty({ type: ApiErrorDto, nullable: true })
  error!: ApiErrorDto | null;
}

export class TokenRefreshEnvelopeDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty({ type: TokenRefreshResponseDto, nullable: true })
  data!: TokenRefreshResponseDto | null;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;

  @ApiProperty({ type: ApiErrorDto, nullable: true })
  error!: ApiErrorDto | null;
}

export class SessionListEnvelopeDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty({ type: [SessionDto], nullable: true })
  data!: SessionDto[] | null;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;

  @ApiProperty({ type: ApiErrorDto, nullable: true })
  error!: ApiErrorDto | null;
}

export class OAuthProviderListEnvelopeDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty({ type: [OAuthProviderDto], nullable: true })
  data!: OAuthProviderDto[] | null;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;

  @ApiProperty({ type: ApiErrorDto, nullable: true })
  error!: ApiErrorDto | null;
}

export class MessageEnvelopeDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty({ type: MessageDto, nullable: true })
  data!: MessageDto | null;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;

  @ApiProperty({ type: ApiErrorDto, nullable: true })
  error!: ApiErrorDto | null;
}
