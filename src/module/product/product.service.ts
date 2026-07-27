import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountEnum } from 'src/common/enums/product.enum';
import { ProductRepo } from 'src/Repo/product.repo';
import { CreateProductDTO } from './DTO/createProduct.dto';
import { S3BucketService } from 'src/common/services/s3Bucket/s3.service';
import { Types } from 'mongoose';
import { UpdateProductDTO } from './DTO/updateProduct.dto';
import slugify from 'slugify';

@Injectable()
export class ProductService {
  constructor(
    private _productRepo: ProductRepo,
    private _s3Service: S3BucketService,
  ) {}

  validateDiscount(discount, price) {
    let priceAfterDiscount: number = price;
    if (discount) {
      if (
        (discount.DiscountType == DiscountEnum.Percentage &&
          discount.amount > 100) ||
        (discount.DiscountType == DiscountEnum.Static &&
          discount.amount > price)
      ) {
        throw new BadRequestException('invalid discount amount');
      }
      priceAfterDiscount = this._productRepo.calcPriceAfterDiscount(
        discount.DiscountType,
        price,
        discount.amount,
      );
    }
    return priceAfterDiscount;
  }

  async create(data: CreateProductDTO, gallery: string[]) {
    let priceAfterDiscount: number = this.validateDiscount(
      data.discount,
      data.price,
    );
    const isNameExist = await this._productRepo.findOne({
      filter: { name: data.name },
    });
    if (isNameExist) {
      throw new BadRequestException('name already exists');
    }

    const [category, subCategory, brand] = await Promise.all([
      this._productRepo.checkCategory(data.category),
      this._productRepo.checkSubCategory(data.subCategory),
      this._productRepo.checkBrand(data.brand),
    ]);

    if (!category) throw new NotFoundException('category not found');
    if (!subCategory) throw new NotFoundException('subCategory not found');
    if (!brand) throw new NotFoundException('brand not found');

    const product = await this._productRepo.create({
      data: {
        ...data,
        gallery,
        priceAfterDiscount,
      },
    });
    return {
      data: {
        product,
        message: 'DONE',
        status: HttpStatus.CREATED,
      },
    };
  }

  async update(id: Types.ObjectId, data: UpdateProductDTO, gallery: string[]) {
    const product = await this._productRepo.findById({ id });
    if (!product) throw new NotFoundException('product already exists');

    const priceAfterDiscount = this.validateDiscount(
      data.discount || product.discount,
      data.price || product.price,
    );
    product.price = data.price || product.price;
    product.discount = data.discount || product.discount;
    product.priceAfterDiscount = priceAfterDiscount;

    if (data.deletedImages?.length) {
      await this._s3Service.deleteFiles(
        data.deletedImages.map((ele) => {
          return { Key: ele };
        }),
      );
      product.gallery = product.gallery.filter((ele) => {
        return !data.deletedImages?.includes(ele);
      });
    }
    if (data.name) {
      const isNameExist = await this._productRepo.findOne({
        filter: {
          name: data.name,
          _id: {
            $ne: id,
          },
        },
      });
      if (isNameExist) {
        throw new BadRequestException('name already exists');
      }
      product.name = data.name;
      product.slug = slugify(data.name);
    }
    if (gallery?.length) {
      product.gallery.push(...gallery);
    }
    product.isActive = data.isActive ?? product.isActive;
    await product.save();
    return {
      data: {
        status: HttpStatus.OK,
        message: 'Done',
        product,
      },
    };
  }
}
