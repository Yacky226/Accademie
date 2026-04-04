import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentRefreshToken = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ refreshToken?: string }>();
  if (!request.refreshToken) {
    throw new UnauthorizedException('Refresh token was not resolved by guard');
  }

  return request.refreshToken;
});
