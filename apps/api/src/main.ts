import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // process.env.CLIENT_URL,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(), new DatabaseExceptionFilter());

  const port = process.env.PORT ?? 3000;
  
  // Intercept the underlying Node HTTP Server explicitly providing Native WS hooks securely!
  const server = app.getHttpServer();
  const { attachWebsockets } = require('./ws-server');
  attachWebsockets(server);

  await app.listen(port);
  console.log(`API running on port ${port}`);
}
bootstrap();
