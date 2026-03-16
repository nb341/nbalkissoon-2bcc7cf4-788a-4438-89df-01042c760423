import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static store = new Map<string, RateLimitEntry>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const now = Date.now();

    const { key, max, windowMs } = this.getLimitConfig(request);
    const entry = RateLimitGuard.store.get(key);

    if (!entry || entry.resetAt <= now) {
      RateLimitGuard.store.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (entry.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      response.setHeader('Retry-After', retryAfter.toString());
      throw new HttpException('Too many requests, please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    entry.count += 1;
    return true;
  }

  private getLimitConfig(request: any): { key: string; max: number; windowMs: number } {
    const ip = this.getRequestIp(request);
    const path = (request.originalUrl || request.url || '').toString();

    if (path.startsWith('/api/auth')) {
      const windowMs = this.getEnvNumber('AUTH_RATE_LIMIT_WINDOW_MS', 60_000);
      const max = this.getEnvNumber('AUTH_RATE_LIMIT_MAX', 10);
      return { key: `auth:${ip}`, max, windowMs };
    }

    if (path.startsWith('/api/admin')) {
      const windowMs = this.getEnvNumber('ADMIN_RATE_LIMIT_WINDOW_MS', 60_000);
      const max = this.getEnvNumber('ADMIN_RATE_LIMIT_MAX', 30);
      return { key: `admin:${ip}`, max, windowMs };
    }

    const windowMs = this.getEnvNumber('RATE_LIMIT_WINDOW_MS', 60_000);
    const max = this.getEnvNumber('RATE_LIMIT_MAX', 120);
    return { key: `global:${ip}`, max, windowMs };
  }

  private getRequestIp(request: any): string {
    const forwarded = request.headers?.['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  private getEnvNumber(key: string, fallback: number): number {
    const value = parseInt(process.env[key] || '', 10);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
    return fallback;
  }
}
