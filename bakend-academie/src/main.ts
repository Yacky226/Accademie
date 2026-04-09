import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import {
  ensureStorageDirectories,
  UPLOADS_DIRECTORY_PATH,
} from './integrations/storage';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
];

function resolveAllowedOrigins() {
  const configuredOrigins =
    process.env.FRONTEND_APP_ORIGIN ?? process.env.CORS_ALLOWED_ORIGINS ?? '';

  const origins = configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : DEFAULT_ALLOWED_ORIGINS;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const allowedOrigins = resolveAllowedOrigins();

  ensureStorageDirectories();
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api');
  app.use(cookieParser());
  app.useStaticAssets(UPLOADS_DIRECTORY_PATH, {
    prefix: '/uploads',
  });
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
