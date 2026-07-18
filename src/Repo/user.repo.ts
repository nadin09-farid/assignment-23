import { Injectable } from '@nestjs/common';
import DBRepo from './db.repo.js';
import { User } from '../user/user.js';
import type { ObjectId, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UserRepo extends DBRepo<User> {
  constructor(@InjectModel(User.name) userModel: Model<User>) {
    super(userModel);
  }

  async checkUserExists(id: ObjectId): Promise<boolean> {
    return (await this.findOne({ filter: { _id: id } })) != null;
  }
}
