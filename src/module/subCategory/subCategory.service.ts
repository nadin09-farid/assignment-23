import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { S3BucketService } from 'src/common/services/s3Bucket/s3.service';
import { Category } from 'src/Models/Category.Model';
import { ISubCategory, SubCategory } from 'src/Models/SubCategory.Model';
import slugify from 'slugify';
@Injectable()
export class SubCategoryService {
  constructor(
    @InjectModel(SubCategory.name)
    private readonly subCategoryModel: Model<SubCategory>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    private readonly s3Service: S3BucketService,
  ) {}

  async createSubCategory(
    file: Express.Multer.File,
    data: Partial<ISubCategory>,
  ) {
    const category = await this.categoryModel.findById(data.categoryId);
    if (!category) throw new NotFoundException('Category Not Found');

    const isNameExist = await this.subCategoryModel.findOne({
      name: data.name,
    });
    if (isNameExist) {
      throw new BadRequestException('name already exists');
    }
    const slug = slugify(data.name as string);
    const key = await this.s3Service.uploadFile({
      file,
      path: `SubCategories/${slug}`,
    });
    return await this.subCategoryModel.create({
      image: key,
      name: data.name,
      slug,
      categoryId: data.categoryId,
    });
  }

  async updateSubCategory(
    id: string,
    file: Express.Multer.File,
    data: Partial<ISubCategory>,
  ) {
    const subCategory = await this.subCategoryModel.findById(id);
    if (!subCategory) {
      throw new NotFoundException('SubCategory Not Found');
    }

    if (data.categoryId) {
      const category = await this.categoryModel.findById(data.categoryId);
      if (!category) throw new NotFoundException('Category not found');
      subCategory.categoryId = data.categoryId;
    }

    if (file) {
      if (subCategory.image) {
        await this.s3Service.deleteFile(subCategory.image);
      }
      const slug = data.name ? slugify(data.name) : subCategory.slug;
      const key = await this.s3Service.uploadFile({
        file,
        path: `SubCategories/${slug}`,
      });
      subCategory.image = key;
    }
    if (data.name) {
      const isNameExist = await this.subCategoryModel.findOne({
        name: data.name,
        _id: {
          $ne: id,
        },
      });
      if (isNameExist) {
        throw new BadRequestException('name already exists');
      }
      subCategory.name = data.name;
      subCategory.slug = slugify(data.name);
    }
    await subCategory.save();
    return subCategory;
  }

  async getSubCategoryById(id: string) {
    const subCategory = await this.subCategoryModel
      .findById(id)
      .populate('categoryId');
    if (!subCategory) throw new NotFoundException('SubCategory NOT Found');
    return subCategory;
  }
  async getAllSubCategories(categoryId?: string) {
    const filter = categoryId ? { categoryId } : {};
    return await this.subCategoryModel.find(filter).populate('categoryId');
  }
  async deleteSubCategory(id: string) {
    const subCategory = await this.subCategoryModel.findById(id);

    if (!subCategory) {
      throw new NotFoundException('SubCategory Not Found');
    }

    if (subCategory.image) {
      await this.s3Service.deleteFile(subCategory.image);
    }

    await subCategory.deleteOne();

    return {
      message: 'SubCategory deleted successfully',
    };
  }
}
