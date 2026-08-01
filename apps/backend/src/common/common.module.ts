import { Module } from '@nestjs/common';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { RequestContextService } from './request-context.service';

@Module({
  providers: [RequestContextService, LoggingInterceptor],
  exports: [RequestContextService, LoggingInterceptor],
})
export class CommonModule {}