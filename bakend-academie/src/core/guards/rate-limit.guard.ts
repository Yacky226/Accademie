import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';

interface RateLimitBucket {
  count: number;
  windowStart: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      ip?: string;
      route?: { path?: string };
      method?: string;
      originalUrl?: string;
    }>();

    const now = Date.now();
    const path = request.route?.path ?? request.originalUrl ?? 'unknown';
    const method = request.method ?? 'UNKNOWN';
    const ip = request.ip ?? 'unknown';
    const key = `${ip}:${method}:${path}`;

    const current = this.buckets.get(key);
    if (!current || now - current.windowStart >= options.windowMs) {
      this.buckets.set(key, { count: 1, windowStart: now });
      return true;
    }

    current.count += 1;
    this.buckets.set(key, current);

    if (current.count > options.maxRequests) {
      throw new HttpException(
        'Too many requests, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
