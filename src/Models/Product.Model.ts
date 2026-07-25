import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { DiscountEnum } from 'src/common/enums/product.enum';
import { Brand } from './Brand.Model';
import { Category } from './Category.Model';
import { SubCategory } from './SubCategory.Model';

export interface IProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  priceAfterDiscount: number;
  discount: {
    discount: number;
    type: DiscountEnum;
  };
  stock: number;
  gallery: string[];
  category: Types.ObjectId;
  subCategory: Types.ObjectId;
  brand: Types.ObjectId;
  rating: {
    avg: number;
    count: number;
  };
  isActive: boolean;
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
  strictQuery: true,
})
export class Product implements IProduct {
  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  name!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  slug!: string;

  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: Brand.name,
  })
  brand!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: Category.name,
  })
  category!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: SubCategory.name,
  })
  subCategory!: Types.ObjectId;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive!: boolean;

  @Prop({
    type: Number,
    default: 0,
  })
  stock!: number;

  @Prop({
    type: String,
    required: true,
  })
  description!: string;
  @Prop({
    type: {
      discount: Number,
      type: {
        type: Number,
        enum: DiscountEnum,
      },
    },
  })
  discount!: { discount: number; type: DiscountEnum };

  @Prop({
    type: [String],
  })
  gallery!: string[];

  @Prop({
    type: Number,
    required: true,
  })
  price!: number;

  @Prop({
    type: Number,
    required: true,
  })
  priceAfterDiscount!: number;

  @Prop({
    type: {
      avg: Number,
      count: Number,
    },
  })
  rating!: { avg: number; count: number };
}

const ProductSchema = SchemaFactory.createForClass(Product);

export const productModel = MongooseModule.forFeature([
  { name: Product.name, schema: ProductSchema },
]);
