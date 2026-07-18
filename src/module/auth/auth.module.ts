import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import userModel from '../../Models/user.model';
import { UserRepo } from '../../Repo/user.repo';

@Module({
  imports: [userModel],
  controllers: [AuthController],
  providers: [AuthService, UserRepo],
  exports: [AuthService],
})
export class AuthModule {}
