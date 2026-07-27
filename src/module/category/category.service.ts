import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { S3BucketService } from 'src/common/services/s3Bucket/s3.service';
import { Category, ICategory } from 'src/Models/Category.Model';
import slugify from 'slugify';
import { SubCategory } from 'src/Models/SubCategory.Model';
@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    private readonly s3Service: S3BucketService,
    @InjectModel(SubCategory.name)
    private readonly subCategoryModel: Model<SubCategory>,
  ) {}

  async createCategory(file: Express.Multer.File, data: Partial<ICategory>) {
    const isNameExist = await this.categoryModel.findOne({ name: data.name });
    if (isNameExist) {
      throw new BadRequestException('name already exists');
    }
    const key = await this.s3Service.uploadFile({
      file,
      path: `Categories/${data.slug}`,
    });
    return await this.categoryModel.create({
      image: key,
      name: data.name,
      slug: slugify(data.name as string),
    });
  }

  async updateCategory(
    id: string,
    file: Express.Multer.File,
    data: Partial<ICategory>,
  ) {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('Category Not Found');
    }
    if (file) {
      if (category.image) {
        await this.s3Service.deleteFile(category.image);
      }
      const key = await this.s3Service.uploadFile({
        file,
        path: `Categories/${data.slug}`,
      });
      category.image = key;
    }
    if (data.name) {
      const isNameExist = await this.categoryModel.findOne({
        name: data.name,
        _id: {
          $ne: id,
        },
      });
      if (isNameExist) {
        throw new BadRequestException('name already exists');
      }
      category.name = data.name;
      category.slug = slugify(data.name);
    }
    await category.save();
    return category;
  }

  async getCategoryById(id: string) {
    const category = await this.categoryModel
      .findById(id)
      .populate('categoryId');
    if (!category) throw new NotFoundException('Category NOT Found');
    return category;
  }
  async getAllCategories() {
    return await this.categoryModel.find();
  }
  async deleteCategory(id: string) {
    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category Not Found');
    }

    const subCategories = await this.subCategoryModel.exists({
      categoryId: id,
    });

    if (subCategories) {
      throw new BadRequestException(
        'Cannot delete category because it contains subcategories',
      );
    }

    if (category.image) {
      await this.s3Service.deleteFile(category.image);
    }

    await category.deleteOne();

    return {
      message: 'Category deleted successfully',
    };
  }
}
