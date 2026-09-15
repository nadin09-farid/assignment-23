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
import { CategoryService } from './category.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ICategory } from 'src/Models/Category.Model';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleEnum } from 'src/common/enums/user.enums';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Auth({ roles: [RoleEnum.Admin] })
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createCategory(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Partial<ICategory>,
  ) {
    return await this.categoryService.createCategory(file, body);
  }

  @Get()
  async getAllCategories() {
    return await this.categoryService.getAllCategories();
  }

  @Get('/:id')
  async getCategoryById(@Param('id') id: string) {
    return await this.categoryService.getCategoryById(id);
  }

  @Auth({ roles: [RoleEnum.Admin] })
  @Patch('/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updateCategory(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Partial<ICategory>,
  ) {
    return await this.categoryService.updateCategory(id, file, body);
  }

  @Auth({ roles: [RoleEnum.Admin] })
  @Delete('/:id')
  async deleteCategory(@Param('id') id: string) {
    return await this.categoryService.deleteCategory(id);
  }
}
