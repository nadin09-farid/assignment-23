import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './module/auth/auth.module';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SecurityModule } from './common/services/security/security.module';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from './common/module/shared.module';
import { S3BucketService } from './common/services/s3Bucket/s3.service';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    UserModule,
    OrderModule,
    ConfigModule.forRoot({
      envFilePath: ['.env.dev', '.env.prod'],
      isGlobal: true,
    }),
    SecurityModule,
    JwtModule.register({ global: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URL_LOCAL'),
        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () => console.log('DB connected'));
          connection.on('open', () => console.log('DB open'));
          connection.on('disconnected', () => console.log('DB disconnected'));
          connection.on('reconnected', () => console.log('DB reconnected'));
          connection.on('disconnecting', () => console.log('DB disconnecting'));
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [],
  controllers: [AppController],
  providers: [AppService, S3BucketService],
})
export class AppModule {}
