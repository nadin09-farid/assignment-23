import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log({ value, metadata });

    if (value.length > 6) {
      throw new BadRequestException('Value Exceeded 6 Chars');
    }
    return value + 'tttssssssssssttttttt';
  }
}
