import { Body, Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './module/auth/auth.service';

@Controller('app')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private authService: AuthService,
  ) {}

  @Get('home{/:id}')
  getHello(@Body() requestAtt: any, @Req() req: any): string {
    console.log({ requestAtt, id: req.params });
    return this.appService.getHello();
  }
}
