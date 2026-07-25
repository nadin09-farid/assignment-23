import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Category } from './Category.Model';

export interface ISubCategory {
  name: string;
  slug: string;
  image: string;
  isActive: boolean;
  categoryId: string;
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
export class SubCategory implements ISubCategory {
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
    type: String,
  })
  image!: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive!: boolean;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: Category.name,
    required: true,
  })
  categoryId!: string;
}

const subCategorySchema = SchemaFactory.createForClass(SubCategory);

export const SubCategoryModel = MongooseModule.forFeature([
  { name: SubCategory.name, schema: subCategorySchema },
]);
