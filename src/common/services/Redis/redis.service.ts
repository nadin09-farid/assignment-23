import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import type { RedisClientType } from 'redis';
import { EmailTypeEnum } from 'src/common/enums/email.enums';

@Injectable()
export class RedisService {
  constructor(@Inject('Redis_Client') private _client: RedisClientType) {}

  getBlackListTokenKey({
    userId,
    tokenId,
  }: {
    userId: string;
    tokenId: string;
  }) {
    return `blackListToken::${userId}::${tokenId}`;
  }

  getOTPKey({ email, emailType }: { email: string; emailType: EmailTypeEnum }) {
    return `OTP::${email}::${emailType}`;
  }

  getOTPReqKeyNo({
    email,
    emailType,
  }: {
    email: string;
    emailType: EmailTypeEnum;
  }) {
    return `OTP::${email}::${emailType}::No`;
  }

  getOTPBlockedKey({
    email,
    emailType,
  }: {
    email: string;
    emailType: EmailTypeEnum;
  }) {
    return `OTP::${email}::${emailType}::Blocked`;
  }

  async set({
    key,
    value,
    exType = 'EX',
    exValue = 120,
  }: {
    key: string;
    value: string | number;
    exType?: 'EX' | 'PX' | 'EXAT' | 'PXAT';
    exValue?: number;
  }) {
    return await this._client.set(key, value, {
      expiration: { type: exType, value: Math.floor(exValue) },
    });
  }

  async get(key: string) {
    return await this._client.get(key);
  }

  async ttl(key: string) {
    return await this._client.ttl(key);
  }

  async exists(key: string) {
    return await this._client.exists(key);
  }

  async persist(key: string) {
    return await this._client.persist(key);
  }

  async remove(keys: string | string[]) {
    return await this._client.del(keys);
  }

  async incr(key: string) {
    return await this._client.incr(key);
  }

  async decr(key: string) {
    return await this._client.decr(key);
  }

  async setExpire(key: string, seconds: number) {
    return await this._client.expire(key, seconds);
  }

  /* aandi set bta5ood ai key w t create aadi bs ehna 34an n3ml update lazem el key da ykoon mwgood previously 
    34an n just n update el value                                                                              */
  async update({ key, value }: { key: string; value: string | number }) {
    const fieldExists = await this._client.exists(key);
    if (!fieldExists) {
      return 0;
    }
    await this._client.set(key, value);
    return 1;
  }

  getFCMKey(userId: Types.ObjectId | string) {
    return `FCM::${userId}`;
  }

  async addFCMTokenToSet(userId: Types.ObjectId | string, fcmToken: string) {
    return await this._client.sAdd(this.getFCMKey(userId), fcmToken);
  }

  async getMemberFCMToken(userId: Types.ObjectId | string) {
    return await this._client.sMembers(this.getFCMKey(userId));
  }

  //   async getMemberFCMToken(userId: Types.ObjectId | string) {
  //     return await this._client.sMembers(this.getFCMKey(userId));
  //   }
  //   async getSocketIoKey(userId: Types.ObjectId | string) {
  //     return await this._client.sMembers(this.getFCMKey(userId));
  //   }
  //   async getMemberFCMToken(userId: Types.ObjectId | string) {
  //     return await this._client.sMembers(this.getFCMKey(userId));
  //   }

  //   async getMemberFCMToken(userId: Types.ObjectId | string) {
  //     return await this._client.sMembers(this.getFCMKey(userId));
  //   }
}
