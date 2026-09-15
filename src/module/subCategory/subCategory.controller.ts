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
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleEnum } from 'src/common/enums/user.enums';

@Controller('subcategory')
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  @Auth({ roles: [RoleEnum.Admin] })
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

  @Auth({ roles: [RoleEnum.Admin] })
  @Patch('/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updateSubCategory(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Partial<ISubCategory>,
  ) {
    return await this.subCategoryService.updateSubCategory(id, file, body);
  }

  @Auth({ roles: [RoleEnum.Admin] })
  @Delete('/:id')
  async deleteSubCategory(@Param('id') id: string) {
    return await this.subCategoryService.deleteSubCategory(id);
  }
}
