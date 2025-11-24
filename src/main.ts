import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NoColorLogger } from './logger/no-color.logger';

async function bootstrap() {
  // Use a logger that strips ANSI colors so logs are plain text (no color codes).
  const logger = new NoColorLogger();
  const app = await NestFactory.create(AppModule, { logger });
  // Ensure common levels are enabled
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
  await app.listen(process.env.PORT || 80);
}

bootstrap();
