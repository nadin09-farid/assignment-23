import type { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { IHUser } from 'src/Models/user.model';

export interface IRequest extends Request {
  user: IHUser;
  tokenPayload: JwtPayload;
}
