import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface RequestWithPermissions {
  user?: {
    permissions?: string[];
  };
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithPermissions>();
    const userPermissions = request.user?.permissions ?? [];
    const normalizedUserPermissions = userPermissions.map((permission) => permission.trim().toUpperCase());

    const hasAllPermissions = requiredPermissions
      .map((permission) => permission.trim().toUpperCase())
      .every((requiredPermission) => normalizedUserPermissions.includes(requiredPermission));

    if (!hasAllPermissions) {
      throw new ForbiddenException('Missing required permission');
    }

    return true;
  }
}
