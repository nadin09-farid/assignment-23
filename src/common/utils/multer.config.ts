import multer from 'multer';
import type { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { allowedFileFormats } from '../pipe/fileValidation.pipe';
import { StorageApproachEnum } from '../enums/multer.enum';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

export function fileFilter(allowedFileFormate: string[]) {
  return (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!allowedFileFormate.includes(file.mimetype)) {
      return cb(new BadRequestException('invalid formate'), false);
    }
    return cb(null, true);
  };
}

export function multerOptions({
  storageApproch = StorageApproachEnum.Memory,
  allowedFileFormate = allowedFileFormats.img,
  fileSize = 5,
}: {
  storageApproch?: StorageApproachEnum;
  allowedFileFormate?: string[];
  fileSize?: number;
} = {}): MulterOptions {
  const storage =
    storageApproch == StorageApproachEnum.Memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination(req, file, callback) {
            callback(null, tmpdir());
          },
          filename(req, file, callback) {
            callback(null, `${randomUUID()}_${file.originalname}`);
          },
        });
  return {
    storage,
    fileFilter: fileFilter(allowedFileFormate),
    limits: { fileSize: fileSize * 1024 * 1024 },
  };
}
