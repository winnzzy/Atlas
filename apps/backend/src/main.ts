import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

const defaultCorsOrigins = [
  'https://atlas-plyi.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

const configuredCorsOrigins = (process.env['CORS_ORIGIN'] ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0 && origin !== '*');

const corsOrigins = Array.from(new Set([...defaultCorsOrigins, ...configuredCorsOrigins]));

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(helmet());
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  const enableSwagger = process.env['SWAGGER_ENABLED'] === 'true' || process.env['NODE_ENV'] === 'production';
  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Atlas API')
      .setDescription('Atlas Digital Banking Platform API')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);
  logger.log(`Atlas API running on port ${port}`);
  if (enableSwagger) {
    logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  } else {
    logger.log('Swagger docs disabled for this environment');
  }
}

void bootstrap();
