import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailTypeEnum } from 'src/common/enums/email.enums';
import { EmailService } from 'src/common/services/email/email.service';
import { RedisService } from 'src/common/services/Redis/redis.service';
import { SecurityService } from 'src/common/services/security/security.service';
import { TokenService } from 'src/common/services/Token/token.service';
import { IHUser, User } from 'src/Models/user.model';
import { UserRepo } from 'src/Repo/user.repo';
import { ConfirmEmailDto, LoginDto, SignupDto } from './dto/authentication.dto';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { ProviderEnum } from 'src/common/enums/user.enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private _userModel: Model<User>,
    private _redisService: RedisService,
    private _mailService: EmailService,
    private _tokenService: TokenService,
    private _userRepo: UserRepo,
    private _securityService: SecurityService,
    private _configService: ConfigService,
  ) {}

  async signup(bodyData: SignupDto) {
    const { email } = bodyData;
    const isEmail = await this._userRepo.findOne({ filter: { email } });

    if (isEmail) {
      throw new ConflictException('Email Already Exists');
    }

    bodyData.password = await this._securityService.hashOperation({
      plainText: bodyData.password,
    });
    if (bodyData.phone) {
      const phoneEncrypted = this._securityService.encryptValue({
        value: bodyData.phone,
      });
      bodyData.phone = phoneEncrypted;
    }
    const [user] = await this._userRepo.create({ data: [bodyData] });

    await this._mailService.sendEmaiOtp({
      email,
      emailType: EmailTypeEnum.confirmEmail,
      subject: 'Confirm Your Email',
    });

    return user;
  }

  public async login(body: LoginDto) {
    const { email, password } = body;
    const user = await this._userRepo.findOne({
      filter: { email },
    });

    if (!user) {
      throw new NotFoundException('Invalid Info');
    }
    if (!user.confirmEmail) {
      throw new BadRequestException('You need to confirm Your Email First');
    }

    const isPasswordValid = await this._securityService.compareOperation({
      plainValue: password,
      hashedValue: user.password,
    });
    if (!isPasswordValid) {
      throw new NotFoundException('Invalid Info');
    }
    return this._tokenService.generateAccessAndRefreshTokens(user);
  }

  async confirmEmail(bodyData: ConfirmEmailDto) {
    const { email, otp } = bodyData;
    const user = await this._userRepo.findOne({
      filter: { email, confirmEmail: false },
    });
    if (!user) {
      throw new BadRequestException('Invalid Email or Email already Confirmed');
    }

    const storedOtp = await this._redisService.get(
      this._redisService.getOTPKey({
        email,
        emailType: EmailTypeEnum.confirmEmail,
      }),
    );

    if (!storedOtp) {
      throw new BadRequestException('OTP Expired');
    }

    const isOTPValid = await this._securityService.compareOperation({
      plainValue: otp,
      hashedValue: storedOtp,
    });

    if (!isOTPValid) {
      throw new BadRequestException('OTP Not Valid');
    }

    user.confirmEmail = true;
    await user.save();
  }

  async resendConfirmEmailOTP(email: string) {
    await this._mailService.sendEmaiOtp({
      email,
      emailType: EmailTypeEnum.confirmEmail,
      subject: 'Another OTP To Confirm Your Email',
    });
  }

  async verifyGoogleToken(idToken: string) {
    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
      idToken,
      audience:
        '377351786664-5lf8ed32878t798e15rmjcq6h4u5l20d.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();
    return payload;
  }

  async loginWithGmail(idToken: string): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const payloadGoogleToken = await this.verifyGoogleToken(idToken);

    if (!payloadGoogleToken) {
      throw new BadRequestException('Invalid Token Payload');
    }

    if (!payloadGoogleToken.email_verified) {
      throw new BadRequestException('Email must be verified');
    }

    const user = await this._userRepo.findOne({
      filter: {
        email: payloadGoogleToken.email as string,
        provider: ProviderEnum.Google,
      },
    });
    return this._tokenService.generateAccessAndRefreshTokens(user as IHUser);
  }

  async signupWithGmail(idToken: string): Promise<{
    status: number;
    result: {
      access_token: string;
      refresh_token: string;
    };
  }> {
    const payloadGoogleToken = await this.verifyGoogleToken(idToken);

    if (!payloadGoogleToken) {
      throw new BadRequestException('Invalid Token Payload');
    }

    // lazem el email ykoon verified eno tmam
    if (!payloadGoogleToken.email_verified) {
      throw new BadRequestException('Email must be verified');
    }

    // check if email exists or not + provider is google wla system
    //lw el provider => system handeh error w han2olo y login bel password eli 3malo
    // lw el provider => google --> hanroo7 baa 3la el login function //
    // han5aleeh y3ml login up 34an hwa already 3amel signup bel email da marra hya msh sho8lana
    const user = await this._userRepo.findOne({
      filter: { email: payloadGoogleToken.email as string },
    });

    // Email Exists + Provider is System  -->> han2oolo y login b his acc wel pass
    if (user) {
      if (user.provider == ProviderEnum.System) {
        throw new BadRequestException(
          'Account Already exists , Login with password',
        );
      }
      return { status: 200, result: await this.loginWithGmail(idToken) };
    }

    // el email msh bi exists baa fa han store el data fel database 3ade

    const [newUser] = await this._userRepo.create({
      data: [
        {
          email: payloadGoogleToken.email,
          userName: payloadGoogleToken.name,
          provider: ProviderEnum.Google,
          // mada 3adda aslun mn el check elli foo2 da yb2a true
          confirmEmail: true,
        },
      ],
    });
    return {
      status: 201,
      result: this._tokenService.generateAccessAndRefreshTokens(newUser),
    };
  }
}
