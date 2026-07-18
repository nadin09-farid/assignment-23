import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/Models/user.model';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private _userModel: Model<User>) {}

  async getAuthPage() {
    const users = await this._userModel.find();
    return users;
  }
}
