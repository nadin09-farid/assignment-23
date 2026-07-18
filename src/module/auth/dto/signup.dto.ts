import { Transform } from 'class-transformer';
import {
  IsBoolean,
  isBoolean,
  IsEmail,
  IsEnum,
  isEnum,
  IsOptional,
  IsPhoneNumber,
  isPhoneNumber,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsMatch } from 'src/common/validation/matchPassword.validation';

export class SignupDto {
  @MaxLength(20)
  @MinLength(3)
  @IsString()
  userName!: string;

  @IsEmail({})
  email!: string;

  // @Transform((obj) =>{
  //     console.log({obj});

  //     const{value} = obj;
  //     if(value == 'true' || value == 1) return true;
  //     if(value == 'false' || value == 0) return false;
  // })
  // @IsBoolean()
  // flag!: boolean;

  @IsStrongPassword()
  password!: string;

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
