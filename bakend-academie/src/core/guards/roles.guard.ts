import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface AuthenticatedRequest {
  user?: {
    roles?: string[];
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRoles = request.user?.roles ?? [];
    if (!userRoles.length) {
      throw new ForbiddenException('No role found on authenticated user');
    }

    const normalizedUserRoles = userRoles.map((role) =>
      role.trim().toUpperCase(),
    );
    const normalizedRequiredRoles = requiredRoles
      .map((role) => role.trim().toUpperCase())
      .filter((role) => role.length > 0);

    const hasRequiredRole = normalizedRequiredRoles.some((requiredRole) =>
      normalizedUserRoles.includes(requiredRole),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException('Insufficient role to access this resource');
    }

    return true;
  }
}
