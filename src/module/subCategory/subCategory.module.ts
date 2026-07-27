import { Module } from '@nestjs/common';
import { SubCategoryService } from './subCategory.service';
import { SubCategoryController } from './subCategory.controller';
import { SubCategoryModel } from 'src/Models/SubCategory.Model';
import { S3BucketService } from 'src/common/services/s3Bucket/s3.service';
import { categoryModel } from 'src/Models/Category.Model';

@Module({
  imports: [SubCategoryModel, categoryModel],
  providers: [SubCategoryService, S3BucketService],
  controllers: [SubCategoryController],
})
export class SubCategoryModule {}
