import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDTO } from './createProduct.dto';
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDTO extends PartialType(CreateProductDTO) {
  @IsNumber()
  @Type(() => Number)
  @Type(() => Boolean)
  isActive?: boolean;

  deletedImages?: string[];
}
