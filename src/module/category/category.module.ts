import { Module } from '@nestjs/common';
import { categoryModel } from 'src/Models/Category.Model';
import { CategoryService } from './category.service';
import { S3BucketService } from 'src/common/services/s3Bucket/s3.service';
import { CategoryController } from './category.controller';
import { SubCategoryModel } from 'src/Models/SubCategory.Model';

@Module({
  imports: [categoryModel, SubCategoryModel],
  providers: [CategoryService, S3BucketService],
  controllers: [CategoryController],
})
export class CategoryModule {}
