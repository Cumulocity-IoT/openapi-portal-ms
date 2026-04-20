import { Logger } from "@nestjs/common";
import { TTL_DAYS } from "../app.model";

export abstract class ChronoArrayCache<T> {
  cache = new Map<string, T[]>();
  private ttlMap = new Map<string, number>();

  abstract getDate(item: T): number;
  abstract queryCache(start: string, end: string, tenantId: string): T[];
  abstract getLogger(): Logger;

  getStartDate(start: string, tenantId: string): string {
    const arr = this.cache.get(tenantId);
    if (arr && arr.length > 0) {
      return new Date(this.getDate(arr[arr.length - 1])).toISOString();
    }
    return start;
  }

  setCache(items: T[], tenantId: string, ttlDays?: number): void {
    const length = items?.length ?? 0;
    if (length === 0) {
      this.getLogger().verbose("No items to add.");
      return;
    }

    // Sort the incoming batch by date ascending before appending
    const sorted = [...items].sort((a, b) => this.getDate(a) - this.getDate(b));

    if (!this.cache.has(tenantId)) {
      this.cache.set(tenantId, []);
    }
    const arr = this.cache.get(tenantId);
    arr.push(...sorted);
    this.getLogger().log(`Cache items count: ${arr.length}`);

    // Store or update the per-tenant TTL if provided
    if (ttlDays !== undefined) {
      this.ttlMap.set(tenantId, ttlDays);
    }

    // TTL eviction: drop records older than the tenant's TTL (or the global default)
    const effectiveTtl = this.ttlMap.get(tenantId) ?? TTL_DAYS;
    const cutoff = Date.now() - effectiveTtl * 24 * 60 * 60 * 1000;
    if (arr.length > 0 && this.getDate(arr[0]) < cutoff) {
      const cutoffIndex = arr.findIndex((item) => this.getDate(item) >= cutoff);
      if (cutoffIndex > 0) {
        this.cache.set(tenantId, arr.slice(cutoffIndex));
        this.getLogger().log(
          `Evicted ${cutoffIndex} items older than ${effectiveTtl} days.`,
        );
      }
    }
  }

  /** Binary search: index of first element where date >= startDate (lower bound). */
  private findFirstIndex(arr: T[], startDate: number): number {
    let lo = 0;
    let hi = arr.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.getDate(arr[mid]) < startDate) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  /** Binary search: index of last element where date <= endDate (upper bound). */
  private findLastIndex(arr: T[], endDate: number): number {
    let lo = 0;
    let hi = arr.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1;
      if (this.getDate(arr[mid]) > endDate) {
        hi = mid - 1;
      } else {
        lo = mid;
      }
    }
    return lo;
  }

  private getEventsInRange(arr: T[], startDate: number, endDate: number): T[] {
    const length = arr.length;

    if (length === 0) return [];

    // O(1) "Up to Now" optimisation: Grafana always passes the current timestamp
    // as endDate, which is >= every cached event, so this branch is the common path.
    const endIndex =
      endDate >= this.getDate(arr[length - 1])
        ? length - 1
        : this.findLastIndex(arr, endDate);

    // O(1) "All Time" optimisation: skip binary search when start covers head
    const startIndex =
      startDate <= this.getDate(arr[0])
        ? 0
        : this.findFirstIndex(arr, startDate);

    if (startIndex > endIndex) return [];
    return arr.slice(startIndex, endIndex + 1);
  }

  getCache(start: number, end: number, tenantId: string): T[] {
    if (!tenantId || !this.cache.has(tenantId)) {
      this.getLogger().log("No cache for tenantId " + tenantId);
      return [];
    }
    const arr = this.cache.get(tenantId);
    const length = arr.length;
    if (length === 0) return [];

    const oldest = this.getDate(arr[0]);
    const newest = this.getDate(arr[length - 1]);

    if (start > newest) {
      this.getLogger().warn(
        `Start date param is more recent than the newest date in the cache. ${start} > ${newest}`,
      );
      return [];
    }

    if (end < oldest) {
      this.getLogger().warn(
        `End date param is older than the oldest date in the cache. ${end} < ${oldest}`,
      );
      return [];
    }

    const results = this.getEventsInRange(arr, start, end);
    this.getLogger().verbose(
      `Cache query from ${new Date(start).toISOString()} to ${new Date(end).toISOString()} returned ${results.length} items.`,
    );
    return results;
  }
}
