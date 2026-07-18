import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import CryptoJS from 'crypto-js';

@Injectable()
export class SecurityService {
  constructor(private configService: ConfigService) {}

  encryptValue({
    value,
    key = this.configService.getOrThrow<string>('ENCRYPTION_KEY'),
  }: {
    value: string;
    key?: string;
  }) {
    return CryptoJS.AES.encrypt(value, key).toString();
  }

  decryptValue({
    cipherText,
    key = this.configService.getOrThrow<string>('ENCRYPTION_KEY'),
  }: {
    cipherText: string;
    key?: string;
  }) {
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  }

  async hashOperation({
    plainText,
    rounds = Number(this.configService.get<string>('SALT_ROUND')),
  }: {
    plainText: string;
    rounds?: number;
  }) {
    return await hash(plainText, rounds);
  }

  async compareOperation({
    plainValue,
    hashedValue,
  }: {
    plainValue: string;
    hashedValue: string;
  }) {
    return await compare(plainValue, hashedValue);
  }
}
