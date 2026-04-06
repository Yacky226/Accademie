import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method?: string;
      originalUrl?: string;
      route?: { path?: string };
      user?: { sub?: string };
      ip?: string;
      headers?: Record<string, string>;
      body?: Record<string, unknown>;
      params?: Record<string, string>;
      query?: Record<string, string>;
    }>();

    const method = (request.method ?? 'UNKNOWN').toUpperCase();
    const shouldLog = method !== 'GET';

    if (!shouldLog) {
      return next.handle();
    }

    const path = request.route?.path ?? request.originalUrl ?? 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          const sanitizedBody = this.sanitizePayload(request.body ?? {});
          void this.auditService.createLog({
            action: method,
            resource: path,
            userId: request.user?.sub,
            ipAddress: request.ip,
            userAgent: request.headers?.['user-agent'],
            metadata: {
              body: sanitizedBody,
              params: request.params,
              query: request.query,
            },
          });
        },
      }),
    );
  }

  private sanitizePayload(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const sensitiveKeys = new Set([
      'password',
      'passwordHash',
      'refreshToken',
      'accessToken',
    ]);
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      result[key] = sensitiveKeys.has(key) ? '***' : value;
    }

    return result;
  }
}
