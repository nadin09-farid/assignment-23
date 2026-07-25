import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IRequest } from '../interface/request.interface';

export const User = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    let req!: IRequest;
    const contextType = context.getType();
    switch (contextType) {
      case 'http':
        req = context.switchToHttp().getRequest();
        break;

      default:
        break;
    }
    return req.user;
  },
);
