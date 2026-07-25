import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { S3BucketService } from 'src/common/services/s3Bucket/s3.service';
import { SharedModule } from 'src/common/module/shared.module';
import { categoryModel } from 'src/Models/Category.Model';

@Module({
  imports: [SharedModule, categoryModel],
  controllers: [UserController],
  providers: [UserService, S3BucketService],
})
export class UserModule {}
