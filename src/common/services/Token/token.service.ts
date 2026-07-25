import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from '../Redis/redis.service';
import { UserRepo } from 'src/Repo/user.repo';
import { ConfigService } from '@nestjs/config';
import { RoleEnum } from 'src/common/enums/user.enums';
import { TokenType } from 'src/common/enums/token.enum';
import { JwtPayload } from 'jsonwebtoken';
import { IHUser } from 'src/Models/user.model';
import { randomUUID } from 'crypto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  private TOKEN_SIGNATURE_ADMIN_REFRESH: string;
  private TOKEN_SIGNATURE_ADMIN_ACCESS: string;
  private TOKEN_SIGNATURE_USER_REFRESH: string;
  private TOKEN_SIGNATURE_USER_ACCESS: string;

  constructor(
    private _redisService: RedisService,
    private _userRepo: UserRepo,
    private _configService: ConfigService,
    private _jwtService: JwtService,
  ) {
    this.TOKEN_SIGNATURE_ADMIN_ACCESS = _configService.get(
      'TOKEN_SIGNATURE_ADMIN_ACCESS',
    ) as string;
    this.TOKEN_SIGNATURE_ADMIN_REFRESH = _configService.get(
      'TOKEN_SIGNATURE_ADMIN_REFRESH',
    ) as string;
    this.TOKEN_SIGNATURE_USER_REFRESH = _configService.get(
      'TOKEN_SIGNATURE_USER_REFRESH',
    ) as string;
    this.TOKEN_SIGNATURE_USER_ACCESS = _configService.get(
      'TOKEN_SIGNATURE_USER_ACCESS',
    ) as string;
  }

  getSignature(role: RoleEnum = RoleEnum.User): {
    accessSignature: string;
    refreshSignature: string;
  } {
    let accessSignature = '';
    let refreshSignature = '';
    switch (role) {
      case RoleEnum.User:
        accessSignature = this.TOKEN_SIGNATURE_USER_ACCESS;
        refreshSignature = this.TOKEN_SIGNATURE_USER_REFRESH;
        break;

      case RoleEnum.Admin:
        accessSignature = this.TOKEN_SIGNATURE_ADMIN_ACCESS;
        refreshSignature = this.TOKEN_SIGNATURE_ADMIN_REFRESH;
        break;
    }
    return { accessSignature, refreshSignature };
  }

  generateToken({
    payload = {},
    siganture,
    options = {},
  }: {
    payload?: object;
    siganture: string;
    options?: JwtSignOptions;
  }) {
    return this._jwtService.sign(payload, { secret: siganture, ...options });
  }

  verifyToken({ token, siganture }: { token: string; siganture: string }) {
    return this._jwtService.verify(token, { secret: siganture });
  }

  async checkToken(token: string, tokenTypeParam = TokenType.access) {
    const decodedToken = this.decodeToken(token) as JwtPayload;

    if (!decodedToken || !decodedToken.aud) {
      throw new UnauthorizedException('Invalid Token Payload');
    }

    const [userRole, tokenType] = decodedToken.aud;

    if (tokenType != tokenTypeParam) {
      throw new BadRequestException('Invalid Token Type');
    }

    const { accessSignature, refreshSignature } = this.getSignature(
      Number(userRole) as RoleEnum,
    );

    const verifiedToken = this.verifyToken({
      token: token,
      siganture:
        tokenTypeParam == TokenType.access ? accessSignature : refreshSignature,
    }) as JwtPayload;
    // bn check lw la2ena aandna fel tokenmodel doc bel id bta3 el token elli galy fa hna baa bn stop w n2oolo
    // en m7tag l login tany yaani token gdeeda
    if (
      verifiedToken.jti &&
      (await this._redisService.exists(
        this._redisService.getBlackListTokenKey({
          userId: verifiedToken.sub as string,
          tokenId: verifiedToken.jti,
        }),
      ))
    ) {
      throw new UnauthorizedException('you need to login again');
    }

    const user = await this._userRepo.findById({
      id: verifiedToken.sub as string,
    });

    if (!user) {
      throw new UnauthorizedException('Account not found , signup again');
    }

    if (new Date(verifiedToken.iat! * 1000) < user.changeCreditTime!) {
      throw new UnauthorizedException('You need to login again');
    }

    return { user, verifiedToken };
  }

  decodeToken(token: string) {
    return this._jwtService.decode(token);
  }

  generateAccessAndRefreshTokens(user: IHUser) {
    const { accessSignature, refreshSignature } = this.getSignature(user.role);
    const tokenId = randomUUID();

    const access_token = this.generateToken({
      siganture: accessSignature,
      options: {
        audience: [String(user.role), TokenType.access],
        expiresIn: 60 * 15,
        subject: user._id.toString(),
        jwtid: tokenId,
      },
    });

    const refresh_token = this.generateToken({
      siganture: refreshSignature,
      options: {
        audience: [String(user.role), TokenType.refresh],
        expiresIn: '1y',
        subject: user._id.toString(),
        jwtid: tokenId,
      },
    });
    return { access_token, refresh_token };
  }
}
