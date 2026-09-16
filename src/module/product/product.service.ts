import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountEnum } from 'src/common/enums/product.enum';
import { ProductRepo } from 'src/Repo/product.repo';
import { CreateProductDTO } from './DTO/createProduct.dto';
import { ListProductsQueryDto } from './DTO/listProduct.dto';
import { S3BucketService } from 'src/common/services/s3Bucket/s3.service';
import { Types } from 'mongoose';
import { UpdateProductDTO } from './DTO/updateProduct.dto';
import slugify from 'slugify';
import { CacheService } from 'src/common/services/cache/cache.service';
import { CacheKeys } from 'src/common/utils/cache-keys';

@Injectable()
export class ProductService {
  constructor(
    private _productRepo: ProductRepo,
    private _s3Service: S3BucketService,
    private _cacheService: CacheService,
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

  async findAll(query: ListProductsQueryDto) {
    const filter: Record<string, unknown> = { isActive: true };
    if (query.category) filter.category = query.category;
    if (query.subCategory) filter.subCategory = query.subCategory;
    if (query.brand) filter.brand = query.brand;
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }
    if (query.minPrice != null || query.maxPrice != null) {
      filter.priceAfterDiscount = {
        ...(query.minPrice != null && { $gte: query.minPrice }),
        ...(query.maxPrice != null && { $lte: query.maxPrice }),
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Every distinct combination of filters/page/limit is its own cache
    // entry — "all jackets under $50, page 2" is different data than
    // "all jackets, page 1", so it needs its own key.
    const cacheKey = CacheKeys.productList(
      JSON.stringify({ filter, page, limit }),
    );

    return this._cacheService.getOrSet(cacheKey, async () => {
      const [items, total] = await Promise.all([
        this._productRepo.find({
          filter,
          options: { skip, limit, sort: { createdAt: -1 } },
          populate: ['brand', 'category', 'subCategory'],
        }),
        this._productRepo.countDocuments(filter),
      ]);

      const itemsWithImages = await Promise.all(
        items.map(async (item) => ({
          ...item.toObject(),
          images: await this.resolveGalleryUrls(item.gallery),
        })),
      );

      return { items: itemsWithImages, total, page, limit };
    });
  }

  async findOne(id: string) {
    return this._cacheService.getOrSet(CacheKeys.productById(id), async () => {
      const product = await this._productRepo.findById({
        id,
        populate: ['brand', 'category', 'subCategory'],
      });
      if (!product) throw new NotFoundException('Product not found');

      return {
        ...product.toObject(),
        images: await this.resolveGalleryUrls(product.gallery),
      };
    });
  }

  /**
   * Product images are uploaded to S3 with a private ACL, so the raw keys
   * stored on the product (e.g. "products/uuid_shoe.jpg") aren't directly
   * viewable in a browser — they need to be exchanged for a temporary
   * signed URL first. This happens at read time (and gets cached
   * alongside the rest of the product for 5 minutes — well under the
   * signed URL's own 1 hour expiry, so a cached product never serves an
   * expired link).
   *
   * If S3 isn't configured (e.g. local dev without real AWS credentials),
   * this fails soft — the storefront shows a placeholder instead of
   * crashing the whole product listing over a missing image.
   */
  private async resolveGalleryUrls(gallery: string[]): Promise<string[]> {
    return Promise.all(
      gallery.map(async (key) => {
        try {
          return await this._s3Service.createPreSignedGetFile({ Key: key });
        } catch {
          return '';
        }
      }),
    ).then((urls) => urls.filter(Boolean));
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

    // A new product changes every list view (it might now match someone's
    // filters), so every cached list result is stale — clear them all.
    await this._cacheService.invalidate(CacheKeys.productListPattern());

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

    // Both the specific product page and every list it appears in could
    // now show stale data (price, stock, name...) - clear both.
    await Promise.all([
      this._cacheService.invalidate(CacheKeys.productById(id.toString())),
      this._cacheService.invalidate(CacheKeys.productListPattern()),
    ]);

    return {
      data: {
        status: HttpStatus.OK,
        message: 'Done',
        product,
      },
    };
  }
}
