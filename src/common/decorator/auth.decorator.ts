import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { TokenType } from '../enums/token.enum';
import { RoleEnum } from '../enums/user.enums';
import { AuthGuard } from '../guard/authentication.guard';
import { AuthorizationGuard } from '../guard/authorization.guard';

export function Auth({
  tokenType = TokenType.access,
  roles = [RoleEnum.User, RoleEnum.Admin],
}: {
  tokenType?: TokenType;
  roles?: RoleEnum[];
}) {
  return applyDecorators(
    SetMetadata('tokenType', tokenType),
    SetMetadata('Roles', roles),
    UseGuards(AuthGuard, AuthorizationGuard),
  );
}
