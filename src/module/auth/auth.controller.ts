import {
  Body,
  Controller,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ConfirmEmailDto,
  LoginDto,
  ResendConfirmEmailDto,
  SignupDto,
  SignupWithGmailDto,
} from './dto/authentication.dto';
import type { Response } from 'express';

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('auth')
export class AuthController {
  constructor(private _AuthService: AuthService) {}

  @Post('signup')
  async signup(
    @Body()
    body: SignupDto,
  ) {
    const result = await this._AuthService.signup(body);
    return result;
  }

  @Post('login')
  async login(
    @Body()
    body: LoginDto,
  ) {
    const result = await this._AuthService.login(body);
    return result;
  }

  @Post('confirm-email')
  async confirmaEmail(
    @Body()
    body: ConfirmEmailDto,
  ) {
    const result = await this._AuthService.confirmEmail(body);
    return result;
  }

  @Post('resend-confirm-email-otp')
  async resendConfirmEmail(
    @Body()
    body: ResendConfirmEmailDto,
  ) {
    const result = await this._AuthService.resendConfirmEmailOTP(body.email);
    return result;
  }

  @Post('signup/gmail')
  async signupWithGmail(
    @Body() body: SignupWithGmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this._AuthService.signupWithGmail(body.idToken);
    res.status(result.status);
    return result;
  }
}
