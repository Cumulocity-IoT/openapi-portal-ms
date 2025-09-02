import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class NormalizedDateCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();

    const { start, end } = request.query;

    if (!start || !end) {
      // fallback to default cache key if params are missing
      return request.originalUrl;
    }

    const normalizedStart = this.normalizeToMinute(start);
    const normalizedEnd = this.normalizeToMinute(end);

    const path = request.route?.path || request.originalUrl;
    return `${path}:${normalizedStart}:${normalizedEnd}`;
  }

  private normalizeToMinute(dateStr: string): string {
    try {
      const date = new Date(dateStr);

      if (isNaN(date.getTime())) {
        return dateStr; // fallback if invalid
      }

      date.setSeconds(0);
      date.setMilliseconds(0);

      return date.toISOString();
    } catch (e) {
      return dateStr; // fallback on error
    }
  }
}
