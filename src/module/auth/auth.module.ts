import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from 'src/common/services/email/email.service';
import { SecurityService } from 'src/common/services/security/security.service';
import userModel from 'src/Models/user.model';
import { LoggerMiddleware } from 'src/common/middleware/logger.middleware';

@Module({
  imports: [userModel],
  controllers: [AuthController],
  providers: [AuthService, EmailService, SecurityService],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('auth');
  }
}
