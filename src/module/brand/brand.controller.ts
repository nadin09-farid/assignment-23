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
import { Auth } from 'src/common/decorator/auth.decorator';
import { RoleEnum } from 'src/common/enums/user.enums';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Auth({ roles: [RoleEnum.Admin] })
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

  @Auth({ roles: [RoleEnum.Admin] })
  @Patch('/:id')
  @UseInterceptors(FileInterceptor('logo'))
  async updateBrand(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Partial<IBrand>,
  ) {
    return await this.brandService.updateBrand(id, file, body);
  }

  @Auth({ roles: [RoleEnum.Admin] })
  @Delete('/:id')
  async deleteBrand(@Param('id') id: string) {
    return await this.brandService.deleteBrand(id);
  }
}
