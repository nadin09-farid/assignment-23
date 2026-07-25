import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { Attachment } from 'nodemailer/lib/mailer';
import { EmailTypeEnum } from 'src/common/enums/email.enums';
import { RedisService } from '../Redis/redis.service';
import { SecurityService } from '../security/security.service';

@Injectable()
export class EmailService {
  private MAIL_USER: string;
  private MAIL_PASS: string;

  constructor(
    private _configService: ConfigService,
    private _redisMethods: RedisService,
    private _securityService: SecurityService,
  ) {
    this.MAIL_USER = _configService.get<string>('MAIL_USER') as string;
    this.MAIL_PASS = _configService.get<string>('MAIL_PASS') as string;
  }

  async sendMail({
    to,
    subject,
    text,
    html,
    attachments,
  }: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Attachment[];
  }) {
    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: this.MAIL_USER,
        pass: this.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `Route <${this.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });
    console.log('Email Sent: ', info.messageId);
  }

  generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  async sendEmaiOtp({
    email,
    emailType,
    subject,
  }: {
    email: string;
    emailType: EmailTypeEnum;
    subject: string;
  }) {
    const prevOtpTTL = await this._redisMethods.ttl(
      this._redisMethods.getOTPKey({ email, emailType }),
    );
    if (prevOtpTTL > 0) {
      throw new BadRequestException(
        `There is an already OTP valid for ${prevOtpTTL} seconds`,
      );
    }
    const isBlocked = await this._redisMethods.exists(
      this._redisMethods.getOTPBlockedKey({
        email,
        emailType,
      }),
    );
    if (isBlocked) {
      throw new BadRequestException('Try again later');
    }

    const reqNo = await this._redisMethods.get(
      this._redisMethods.getOTPReqKeyNo({
        email,
        emailType,
      }),
    );

    if (Number(reqNo) == 5) {
      await this._redisMethods.set({
        key: this._redisMethods.getOTPBlockedKey({
          email,
          emailType,
        }),
        value: 1,
        exValue: 10 * 60,
      });
      throw new BadRequestException(
        `You Can't Request more than 5 emails in 20mins ..`,
      );
    }
    const otp = this.generateOTP();

    await this.sendMail({
      to: email,
      subject,
      html: `<h1> Your OTP ${otp} </h1>`,
    });

    await this._redisMethods.set({
      key: this._redisMethods.getOTPKey({
        email,
        emailType,
      }),
      value: await this._securityService.hashOperation({
        plainText: otp.toString(),
      }),
      exValue: 120,
    });

    await this._redisMethods.incr(
      this._redisMethods.getOTPReqKeyNo({
        email,
        emailType,
      }),
    );
  }
}
