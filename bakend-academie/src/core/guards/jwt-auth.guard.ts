import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenService } from '../../modules/auth/services/token.service';
import { ROLE_PERMISSIONS } from '../constants';

interface RequestUser {
  sub: string;
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
  permissions?: string[];
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
      user?: RequestUser;
    }>();
    const authorizationHeader = request.headers?.authorization;
    const accessToken = this.extractBearerToken(authorizationHeader);
    const payload = await this.tokenService.verifyAccessToken(accessToken);
    const normalizedRoles = payload.roles.map((role) =>
      role.trim().toUpperCase(),
    );
    const permissions = normalizedRoles.flatMap(
      (role) => ROLE_PERMISSIONS[role] ?? [],
    );

    request.user = {
      ...payload,
      permissions: [...new Set(permissions)],
    };

    return true;
  }

  private extractBearerToken(authorizationHeader?: string): string {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Expected a Bearer token');
    }

    return token;
  }
}
