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
import { SubCategoryService } from './subCategory.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ISubCategory } from 'src/Models/SubCategory.Model';

@Controller('subcategory')
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createSubCategory(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Partial<ISubCategory>,
  ) {
    return await this.subCategoryService.createSubCategory(file, body);
  }

  @Get()
  async getAllSubCategories() {
    return await this.subCategoryService.getAllSubCategories();
  }

  @Get('/:id')
  async getSubCategoryById(@Param('id') id: string) {
    return await this.subCategoryService.getSubCategoryById(id);
  }

  @Patch('/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updateSubCategory(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Partial<ISubCategory>,
  ) {
    return await this.subCategoryService.updateSubCategory(id, file, body);
  }

  @Delete('/:id')
  async deleteSubCategory(@Param('id') id: string) {
    return await this.subCategoryService.deleteSubCategory(id);
  }
}
