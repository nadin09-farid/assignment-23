import { Injectable } from '@nestjs/common';
import { S3BucketService } from 'src/common/services/s3Bucket/s3.service';
import type { IHUser } from 'src/Models/user.model';

@Injectable()
export class UserService {
  constructor(private _s3BucketService: S3BucketService) {}
  async uploadProfilePic(bodyData: any, user: IHUser) {
    const { key, url } =
      await this._s3BucketService.createPreSignedUrlUploadFile({
        contentType: bodyData.contentType,
        originalname: bodyData.originalname,
        path: `user/${user._id}/profilePic`,
      });
    return { key, url };
  }
  async uploadCoverPics(files: Express.Multer.File[], user: IHUser) {
    const keys = await this._s3BucketService.uploadFiles({
      files,
      path: `user/${user._id}/coverPic`,
    });

    if (user.coverPics?.length) {
      await Promise.all(
        user.coverPics.map((coverPic) =>
          this._s3BucketService.deleteFile(coverPic),
        ),
      );
    }

    user.coverPics = keys;
    await user.save();

    return keys;
  }
}
