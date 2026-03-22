import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'auth.v1',
        protoPath: 'node_modules/@voice-chat/contracts/proto/auth.proto',
        url: 'localhost:5052',
      },
    },
  );

  await app.listen();
}
bootstrap();
