import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = parseInt(config.get<string>('PORT') ?? '3001', 10);
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`🚀 Backend: http://localhost:${port}/api/v1`);
  // eslint-disable-next-line no-console
  console.log(`   Health: http://localhost:${port}/api/v1/health`);
}

void bootstrap();