import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TokenPayload } from '../../modules/auth/services/token.service';

export const CurrentUser = createParamDecorator(
  (property: keyof TokenPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: TokenPayload }>();
    const user = request.user;
    if (!user) {
      return undefined;
    }

    return property ? user[property] : user;
  },
);
