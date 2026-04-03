import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TracingInterceptor } from './common/interceptors/tracing.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProd = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProd ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ── Security ────────────────────────────────────────────
  app.use(helmet({ contentSecurityPolicy: isProd ? undefined : false }));

  const defaultOrigins = isProd
    ? ['https://admin.katha.ai']
    : ['http://localhost:3001', 'http://localhost:8081', 'http://localhost:19006'];

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? defaultOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id'],
    maxAge: 86400,
  });

  // ── Global Prefix ───────────────────────────────────────
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/ready', 'health/startup'],
  });

  // ── Validation ──────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Observability ───────────────────────────────────────
  app.useGlobalInterceptors(new TracingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Swagger (disabled in production) ────────────────────
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Katha AI API')
      .setDescription('API for the Katha AI storytelling platform')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger docs available at /api/docs');
  }

  // ── Graceful Shutdown ───────────────────────────────────
  app.enableShutdownHooks();

  const port = process.env.APP_PORT ?? 3000;
  await app.listen(port);
  logger.log(`Katha API running on :${port} (${isProd ? 'production' : 'development'})`);
}

bootstrap();
