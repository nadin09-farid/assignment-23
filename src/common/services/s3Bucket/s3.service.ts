import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class S3BucketService {
  private REGION!: string;
  private ACCESS_KEY_ID!: string;
  private SECRET_ACCESS_KEY!: string;
  private BUCKET_NAME!: string;
  private APPLICATION!: string;
  private _client!: S3Client;

  constructor(private _configService: ConfigService) {
    this.REGION = _configService.get('REGION') as string;
    this.ACCESS_KEY_ID = _configService.get('ACCESS_KEY_ID') as string;
    this.SECRET_ACCESS_KEY = _configService.get('SECRET_ACCESS_KEY') as string;
    this.BUCKET_NAME = _configService.get('BUCKET_NAME') as string;
    this.APPLICATION = _configService.get('APPLICATION') as string;
    this._client = new S3Client({
      region: this.REGION,
      credentials: {
        accessKeyId: this.ACCESS_KEY_ID,
        secretAccessKey: this.SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile({
    file,
    path,
  }: {
    file: Express.Multer.File;
    path: string;
  }) {
    const command = new PutObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: `${this.APPLICATION}/${path}/${randomUUID()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: ObjectCannedACL.private,
    });
    await this._client.send(command);
    return command.input.Key!;
  }

  async uploadFiles({
    files,
    path,
  }: {
    files: Express.Multer.File[];
    path: string;
  }): Promise<string[]> {
    const keys = await Promise.all(
      files.map(async (file) => {
        const key = await this.uploadFile({
          file,
          path,
        });

        return key;
      }),
    );

    return keys;
  }

  async createPreSignedGetFile({
    Key,
    filename,
    download,
  }: {
    Key: string;
    filename?: string;
    download?: string;
  }) {
    const command = new GetObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key,
      ResponseContentDisposition:
        download == 'true' ? `attachment; filename=${filename}` : undefined,
    });
    return await getSignedUrl(this._client, command, { expiresIn: 3600 });
  }

  async getFile(Key: string) {
    const command = new GetObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key,
    });
    return await this._client.send(command);
  }

  async deleteFile(Key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key,
    });
    return await this._client.send(command);
  }

  async deleteFiles(Keys: { Key: string }[]) {
    const command = new DeleteObjectsCommand({
      Bucket: this.BUCKET_NAME,
      Delete: { Objects: Keys },
    });
    return await this._client.send(command);
  }

  async listFolderKeys(Prefix: string) {
    const command = new ListObjectsV2Command({
      Bucket: this.BUCKET_NAME,
      Prefix: `${this.APPLICATION}/${Prefix}`,
    });
    return await this._client.send(command);
  }

  async createPreSignedUrlUploadFile({
    contentType,
    originalname,
    path,
  }: {
    contentType: string;
    originalname: string;
    path: string;
  }) {
    const key = `${this.APPLICATION}/${path}/${randomUUID()}_${originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ACL: ObjectCannedACL.private,
    });

    const url = await getSignedUrl(this._client, command, {
      expiresIn: 60 * 5, // 5 minutes
    });

    return {
      key,
      url,
    };
  }
}
