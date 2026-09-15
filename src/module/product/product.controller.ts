import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateProductDTO } from './DTO/createProduct.dto';
import { ListProductsQueryDto } from './DTO/listProduct.dto';
import { S3BucketService } from 'src/common/services/s3Bucket/s3.service';
import { ProductService } from './product.service';
import { Types } from 'mongoose';
import { UpdateProductDTO } from './DTO/updateProduct.dto';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleEnum } from 'src/common/enums/user.enums';

@Controller('product')
export class ProductController {
  constructor(
    private _s3Service: S3BucketService,
    private _productService: ProductService,
  ) {}

  // Explicit transform: true regardless of the global pipe config — query
  // strings arrive as strings, and page/limit/minPrice/maxPrice need to be
  // coerced to numbers for the @Type()/@Min() decorators to work.
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAll(@Query() query: ListProductsQueryDto) {
    return await this._productService.findAll(query);
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    return await this._productService.findOne(id);
  }

  // Only admins manage the catalog. Without this, anyone unauthenticated
  // could create or edit products in the store.
  @Auth({ roles: [RoleEnum.Admin] })
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

  @Auth({ roles: [RoleEnum.Admin] })
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
