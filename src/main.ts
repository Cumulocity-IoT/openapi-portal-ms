import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose', 'fatal']);
  await app.listen(process.env.PORT || 80);
}
bootstrap();
