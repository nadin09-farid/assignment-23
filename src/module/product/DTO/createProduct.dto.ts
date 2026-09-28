import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { DiscountEnum } from 'src/common/enums/product.enum';
import { VehicleMakeEnum } from 'src/common/enums/vehicle.enum';

export class DiscountDTO {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount!: number;

  @IsEnum(DiscountEnum)
  @Type(() => Number)
  DiscountType!: DiscountEnum;
}

export class CreateProductDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DiscountDTO)
  discount?: DiscountDTO;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @IsString()
  @IsNotEmpty()
  category!: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  subCategory!: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  brand!: Types.ObjectId;

  // Multipart forms only produce a real array when a field name repeats
  // 2+ times — a single compatibleVehicles=BMW field otherwise arrives as
  // the bare string "BMW", which @IsArray() would reject outright. This
  // normalizes both shapes to an array before validation runs.
  @IsOptional()
  @Transform(({ value }) =>
    value == null ? value : Array.isArray(value) ? value : [value],
  )
  @IsArray()
  @IsEnum(VehicleMakeEnum, { each: true })
  compatibleVehicles?: VehicleMakeEnum[];
}
