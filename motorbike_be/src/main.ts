import { existsSync, mkdirSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ZodValidationPipe());

  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  app.use('/uploads', express.static(uploadsDir));

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server running on port ${process.env.PORT ?? 3000}`);
}

bootstrap();
