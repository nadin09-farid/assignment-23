import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateProductDTO } from './DTO/createProduct.dto';
import { S3BucketService } from 'src/common/services/s3Bucket/s3.service';
import { ProductService } from './product.service';
import { Types } from 'mongoose';
import { UpdateProductDTO } from './DTO/updateProduct.dto';

@Controller('product')
export class ProductController {
  constructor(
    private _s3Service: S3BucketService,
    private _productService: ProductService,
  ) {}

  @Post('')
  @UseInterceptors(FilesInterceptor('gallery', 5))
  async create(
    @Body() data: CreateProductDTO,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const gallery = await this._s3Service.uploadFiles({
      files,
      path: 'products',
    });
    return await this._productService.create(data, gallery);
  }

  @Patch('/:id')
  @UseInterceptors(FilesInterceptor('gallery', 5))
  async update(
    @Param('id') id: Types.ObjectId,
    @Body() data: UpdateProductDTO,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    let gallery: string[] = [];
    if (files?.length) {
      gallery = await this._s3Service.uploadFiles({
        files,
        path: 'products',
      });
    }
    return await this._productService.update(id, data, gallery);
  }
}
