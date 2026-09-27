import { Type } from 'class-transformer';
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

  // Sent as repeated form fields (compatibleVehicles=BMW&compatibleVehicles=Porsche)
  // for a multi-fit part, or omitted entirely for a universal-fit product.
  @IsOptional()
  @IsArray()
  @IsEnum(VehicleMakeEnum, { each: true })
  compatibleVehicles?: VehicleMakeEnum[];
}
