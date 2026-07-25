import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsMatch } from 'src/common/validation/matchPassword.validation';

export class LoginDto {
  @IsEmail({})
  email!: string;
  @IsStrongPassword()
  password!: string;

  @IsOptional()
  @IsString()
  FCM!: string;
}
export class SignupDto extends LoginDto {
  @MaxLength(20)
  @MinLength(3)
  @IsString()
  userName!: string;

  @ValidateIf((obj) => {
    return obj.password;
  })
  @IsMatch(['password'])
  confirmPassword!: string;

  @IsOptional()
  @IsEnum(['Male', 'Female'], { message: 'Gender Must be Male OR Female' })
  gender!: string;

  @IsOptional()
  @IsPhoneNumber()
  phone!: string;
}

export class SignupQueryDto {
  @MaxLength(20)
  @MinLength(3)
  @IsString()
  test!: string;
}

export class ResendConfirmEmailDto {
  @IsEmail({})
  email!: string;
}

export class ConfirmEmailDto extends ResendConfirmEmailDto {
  @Matches(/\d{6}/)
  otp!: string;
}

export class SignupWithGmailDto {
  @IsString({})
  idToken!: string;
}
