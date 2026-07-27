import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { productModel } from 'src/Models/Product.Model';
import { categoryModel } from 'src/Models/Category.Model';
import { SubCategoryModel } from 'src/Models/SubCategory.Model';
import { brandModel } from 'src/Models/Brand.Model';
import { ProductRepo } from 'src/Repo/product.repo';
import { S3BucketService } from 'src/common/services/s3Bucket/s3.service';

@Module({
  imports: [productModel, categoryModel, SubCategoryModel, brandModel],
  controllers: [ProductController],
  providers: [ProductService, ProductRepo, S3BucketService],
})
export class ProductModule {}
