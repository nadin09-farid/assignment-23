import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { BrandService } from './brand.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { IBrand } from 'src/Models/Brand.Model';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}
  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  async createBrand(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Partial<IBrand>,
  ) {
    return await this.brandService.createBrand(file, body);
  }

  @Get()
  async getAllBrands() {
    return await this.brandService.getAllBrands();
  }

  @Get('/:id')
  async getBrandById(@Param('id') id: string) {
    return await this.brandService.getBrandById(id);
  }

  @Patch('/:id')
  @UseInterceptors(FileInterceptor('logo'))
  async updateBrand(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Partial<IBrand>,
  ) {
    return await this.brandService.updateBrand(id, file, body);
  }

  @Delete('/:id')
  async deleteBrand(@Param('id') id: string) {
    return await this.brandService.deleteBrand(id);
  }
}
