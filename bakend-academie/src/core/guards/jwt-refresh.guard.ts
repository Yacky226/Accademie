import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../../modules/auth/services/token.service';

interface RefreshRequest {
  cookies?: Record<string, string>;
  user?: unknown;
  refreshToken?: string;
}

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RefreshRequest>();
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token cookie');
    }

    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    request.user = payload;
    request.refreshToken = refreshToken;
    return true;
  }
}
