import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth } from 'src/common/decorator/auth.decorator';
import { User } from 'src/common/decorator/user.decorator';
import { StorageApproachEnum } from 'src/common/enums/multer.enum';

import { multerOptions } from 'src/common/utils/multer.config';
import type { IHUser } from 'src/Models/user.model';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @Auth({})
  @Get()
  getProfile(@User() user: IHUser) {
    return { message: 'done', user };
  }

  @Auth({})
  // @UsePipes(new FileSizeValidationPipe(allowedFileFormats.img))
  // @UseInterceptors(
  //   FileInterceptor(
  //     'profilePic',
  //     multerOptions({ storageApproch: StorageApproachEnum.Disk }),
  //   ),
  // )
  @Post('upload-profile-pic')
  async uploadProfilePic(@Body() body: any, @User() user: IHUser) {
    const result = await this.userService.uploadProfilePic(body, user);
    return result;
  }

  @Auth({})
  @UseInterceptors(
    FileInterceptor(
      'coverPics',
      multerOptions({ storageApproch: StorageApproachEnum.Disk, fileSize: 25 }),
    ),
  )
  @Post('upload-cover-pics')
  async uploadCoverPics(
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: IHUser,
  ) {
    const result = await this.userService.uploadCoverPics(files, user);
    return result;
  }
}
