import { Global, Module } from '@nestjs/common';
import { SecurityModule } from '../services/security/security.module';
import userModel from 'src/Models/user.model';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { RedisService } from '../services/Redis/redis.service';
import { TokenService } from '../services/Token/token.service';
import { UserRepo } from 'src/Repo/user.repo';
import { JwtService } from '@nestjs/jwt';
import { SecurityService } from '../services/security/security.service';

@Global()
@Module({
  imports: [SecurityModule, userModel],
  providers: [
    {
      provide: 'Redis_Client',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          url: configService.get('REDIS_URL'),
        });
        client.on('error', (err) => {
          console.log('redis error');
          console.log(err);
        });
        await client.connect();
        console.log('redis connected');
        return client;
      },
    },
    RedisService,
    TokenService,
    UserRepo,
    ConfigService,
    JwtService,
    SecurityService,
  ],
  exports: [RedisService, TokenService, UserRepo, JwtService],
})
export class SharedModule {}
