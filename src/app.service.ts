import { Injectable } from '@nestjs/common';
import { S3BucketService } from './common/services/s3Bucket/s3.service';

@Injectable()
export class AppService {
  constructor(private _s3Bucket: S3BucketService) {}
  async getFile(path: any) {
    const Key = path.join('/');
    const result = await this._s3Bucket.getFile(Key);
    return result;
  }
}
