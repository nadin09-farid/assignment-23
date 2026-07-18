import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './module/auth/auth.module';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User } from './user/user';
import { Connection } from 'mongoose';

@Module({
  imports: [
    AuthModule,
    UserModule,
    OrderModule,
    ConfigModule.forRoot({
      envFilePath: ['.env.dev', '.env.prod'],
    }),

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
  controllers: [AppController, UserController],
  providers: [AppService, User],
})
export class AppModule {}
