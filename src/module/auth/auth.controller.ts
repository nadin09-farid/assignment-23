import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { Model } from 'mongoose';
import { User } from 'src/Models/user.model';
import { InjectModel } from '@nestjs/mongoose';

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('auth')
export class AuthController {
  constructor(
    private _AuthService: AuthService,
    @InjectModel(User.name)
    private _userRepo: Model<User>,
  ) {}

  @Get()
  async getAuthPage() {
    return await this._AuthService.getAuthPage();
  }

  @HttpCode(HttpStatus.OK)
  @Post('signup')
  signup(
    @Body()
    body: SignupDto,
  ) {
    return { message: 'done', body };
  }

  // @Body() bodyData : any,
  // @Body('userName') username : string,
  // @Body('email') email : string,
  // @Param() params : any,
  // @Query() query : any,
  // console.log({bodyData  , username, email, params , id , query});
}
