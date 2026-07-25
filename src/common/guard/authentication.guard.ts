import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../services/Token/token.service';
import { IRequest } from '../interface/request.interface';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private _tokenService: TokenService,
    private _reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let authorization: string | undefined;
    let req!: IRequest;
    const contextType = context.getType();
    switch (contextType) {
      case 'http':
        req = context.switchToHttp().getRequest();
        authorization = req.headers.authorization;
        break;

      default:
        break;
    }

    if (!authorization) {
      throw new UnauthorizedException('You Need to Login First');
    }
    const [bearerKey, token] = authorization.split(' ');

    if (bearerKey != 'Bearer') {
      throw new BadRequestException('Invalid bearer key');
    }
    if (!token) {
      throw new UnauthorizedException('You Need to Login First');
    }

    const tokenType = this._reflector.getAllAndOverride('tokenType', [
      context.getHandler(),
      context.getClass(),
    ]);
    const { user, verifiedToken } = await this._tokenService.checkToken(
      token,
      tokenType,
    );
    req.user = user;
    req.tokenPayload = verifiedToken;
    return true;
  }
}
