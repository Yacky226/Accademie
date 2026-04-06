import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

interface UserPayload {
  sub: string;
  roles?: string[];
}

interface RequestWithUser {
  user?: UserPayload;
  params?: {
    id?: string;
  };
}

@Injectable()
export class UserSelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    const targetUserId = request.params?.id;

    if (!user?.sub || !targetUserId) {
      throw new ForbiddenException('Unable to evaluate ownership');
    }

    const isAdmin = (user.roles ?? [])
      .map((role) => role.trim().toUpperCase())
      .includes('ADMIN');
    const isOwner = user.sub === targetUserId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You can only access your own user resource',
      );
    }

    return true;
  }
}
