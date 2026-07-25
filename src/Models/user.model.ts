import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { GenderEnum, ProviderEnum, RoleEnum } from '../common/enums/user.enums';
import { SecurityModule } from '../common/services/security/security.module';
import { SecurityService } from '../common/services/security/security.service';

export interface IUser {
  userName: string;
  email: string;
  password: string;
  provider: ProviderEnum;
  confirmEmail: boolean;
  profilePic?: string;
  coverPics?: string[];
  friends?: Types.ObjectId[];
  age: number;
  phone: string;
  gender?: GenderEnum;
  role: RoleEnum;
  changeCreditTime?: Date;

  deletedAt?: Date;
}

export type IHUser = HydratedDocument<IUser>;

@Schema({
  timestamps: true,
  strictQuery: true,
})
export class User {
  @Prop({ type: String, required: true })
  userName!: string;

  @Prop({ type: String, required: true })
  email!: string;

  @Prop({
    type: String,
    required: function (this: User): boolean {
      return this.provider === ProviderEnum.System;
    },
  })
  password!: string;

  @Prop({ type: Number, enum: ProviderEnum, default: ProviderEnum.System })
  provider!: ProviderEnum;

  @Prop({ type: Boolean, default: false })
  confirmEmail!: boolean;

  @Prop(String)
  profilePic!: string;

  @Prop([String])
  coverPics!: [string];
}

const userSchema = SchemaFactory.createForClass(User);
const userModel = MongooseModule.forFeatureAsync([
  {
    name: User.name,
    useFactory(securityService: SecurityService) {
      userSchema.post(
        'save',
        async function (this: IHUser & { wasNew: boolean }) {
          try {
            if (this.wasNew) {
            }
          } catch (error) {
            console.log(error);
          }
        },
      );
      userSchema.pre(['findOne', 'find'], function () {
        const query = this.getQuery();
        if (!query.getSoftDelete) {
          this.setQuery({ ...query, deletedAt: { $exists: false } });
        }
      });
      return userSchema;
    },
    imports: [SecurityModule],
    inject: [SecurityService],
  },
]);
export default userModel;
