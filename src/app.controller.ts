import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('uploads/*path')
  async getFile(
    @Param('path') path: any,
    @Query() query: any,
    @Res() res: Response,
  ) {
    const { filename, download } = query;
    const result = await this.appService.getFile(path);
    if (download == 'true') {
      res.setHeader(
        'content-disposition',
        `attachment; filename=${filename || path[path.length - 1]}`,
      );
    }
    const pipelinePromise = promisify(pipeline);
    await pipelinePromise(result.Body as NodeJS.ReadableStream, res);
  }
}
