import { Injectable } from '@nestjs/common';
import DBRepo from './db.repo';
import { IProduct, Product } from 'src/Models/Product.Model';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryOptions, Types } from 'mongoose';
import { Category } from 'src/Models/Category.Model';
import { ISubCategory, SubCategory } from 'src/Models/SubCategory.Model';
import { Brand } from 'src/Models/Brand.Model';
import { DiscountEnum } from 'src/common/enums/product.enum';

@Injectable()
export class ProductRepo extends DBRepo<IProduct> {
  constructor(
    @InjectModel(Product.name) private _productModel: Model<Product>,
    @InjectModel(Category.name) private _categoryModel: Model<Category>,
    @InjectModel(SubCategory.name)
    private _subCategoryModel: Model<SubCategory>,
    @InjectModel(Brand.name) private _brandModel: Model<Brand>,
  ) {
    super(_productModel);
  }

  async checkProductExists(id: Types.ObjectId): Promise<boolean> {
    return (await this.findOne({ filter: { _id: id } })) != null;
  }

  async checkCategory(id: Types.ObjectId) {
    return await this._categoryModel.findById(id);
  }

  async checkSubCategory(id: Types.ObjectId, categoryId?: Types.ObjectId) {
    const filter: QueryOptions<ISubCategory> = {
      _id: id,
    };
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    return await this._subCategoryModel.findOne(filter);
  }

  async checkBrand(id: Types.ObjectId) {
    return await this._brandModel.findById(id);
  }

  calcPriceAfterDiscount(
    DiscountType: DiscountEnum,
    price: number,
    amount: number,
  ) {
    let priceAfterDiscount: number = price;
    switch (DiscountType) {
      case DiscountEnum.Static:
        priceAfterDiscount = price - amount;
        break;
      case DiscountEnum.Percentage:
        priceAfterDiscount = price - (price * amount) / 100;
        break;
    }
    return priceAfterDiscount;
  }
}
