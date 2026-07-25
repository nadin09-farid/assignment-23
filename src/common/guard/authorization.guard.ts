import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IRequest } from '../interface/request.interface';
import { IHUser } from 'src/Models/user.model';
import { RoleEnum } from '../enums/user.enums';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private _reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let req!: IRequest;
    let user!: IHUser;
    const contextType = context.getType();
    switch (contextType) {
      case 'http':
        req = context.switchToHttp().getRequest();
        user = req.user;
        break;

      default:
        break;
    }

    const roles: RoleEnum[] = this._reflector.getAllAndOverride('Role', [
      context.getHandler(),
      context.getClass(),
    ]);

    return roles.includes(user.role);
  }
}
