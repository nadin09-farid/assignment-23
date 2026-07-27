import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { S3BucketService } from 'src/common/services/s3Bucket/s3.service';
import { brandModel } from 'src/Models/Brand.Model';

@Module({
  imports: [brandModel],
  providers: [BrandService, S3BucketService],
  controllers: [BrandController],
})
export class BrandModule {}
