import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

export const allowedFileFormats = {
  img: ['image/png', 'image/jpg'],
  video: ['video/mp4'],
  pdf: ['application/pdf'],
};

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  constructor(private allowedFormats: string[]) {}
  transform(value: any, metadata: ArgumentMetadata) {
    if (!this.allowedFormats.includes(value.mimetype)) {
      throw new BadRequestException('invalid file type');
    }
    return true;
  }
}
