import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiMetaDto {
  @ApiProperty()
  traceId!: string;

  @ApiProperty({ format: 'date-time' })
  timestamp!: string;
}

export class ApiErrorDetailDto {
  @ApiPropertyOptional()
  field?: string;

  @ApiPropertyOptional()
  reason?: string;
}

export class ApiErrorDto {
  @ApiProperty({
    enum: [
      'validation_error',
      'authentication_error',
      'authorization_error',
      'business_rule_error',
      'rate_limit_error',
      'server_error',
    ],
  })
  type!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  message!: string;

  @ApiPropertyOptional({ type: [ApiErrorDetailDto] })
  details?: ApiErrorDetailDto[];
}

export class ApiEnvelopeDto<TData = unknown> {
  @ApiProperty()
  success!: boolean;

  @ApiPropertyOptional()
  data!: TData | null;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;

  @ApiPropertyOptional({ type: ApiErrorDto, nullable: true })
  error!: ApiErrorDto | null;
}
