import { Injectable } from '@nestjs/common';
import DBRepo from './db.repo.js';
import { Types, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IHUser, User } from '../Models/user.model.js';

@Injectable()
export class UserRepo extends DBRepo<IHUser> {
  constructor(@InjectModel(User.name) userModel: Model<IHUser>) {
    super(userModel);
  }

  async checkUserExists(id: Types.ObjectId): Promise<boolean> {
    return (await this.findOne({ filter: { _id: id } })) != null;
  }
}
