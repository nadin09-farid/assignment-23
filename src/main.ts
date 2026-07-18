import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SERVER_PORT } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = SERVER_PORT;
  await app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
bootstrap();
