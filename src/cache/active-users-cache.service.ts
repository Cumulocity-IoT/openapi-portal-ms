import { Injectable } from '@nestjs/common';
import { PXParams, User, UserFilter, UserSort } from '../model/gainsight-px.model';
import { GainsightPxService } from '../service/gainsight-px.service';
import { MyCache } from './cache.model';

@Injectable()  
export class ActiveUsersCacheService implements MyCache<User> {
  constructor(private api: GainsightPxService) {}

  private cache: User[] = [];

  createCache(start: string, end: string, domainName: string) {
    this.getActiveUserMetricsDateRange(start, end, domainName).then((users) => (this.cache = users));
  }

  queryCache(start: string, end: string): User[] {
    // Early return if cache is empty or completely out of range
    if (this.cache.length === 0) return [];

    const startStamp = new Date(start).getTime();
    const endStamp = new Date(end).getTime();

    // Check if range is completely outside cache bounds
    if (startStamp > this.cache[this.cache.length - 1].lastSeenDate || endStamp < this.cache[0].lastSeenDate) {
      return [];
    }

    const binarySearch = (time: number): number => {
      let left = 0;
      let right = this.cache.length - 1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (this.cache[mid].lastSeenDate === time) return mid;
        if (this.cache[mid].lastSeenDate < time) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      return left;
    };

    const startIndex = binarySearch(startStamp);
    if (startIndex >= this.cache.length) return [];

    const endIndex = binarySearch(endStamp);
    return this.cache.slice(startIndex, endIndex);
  }

  /*
  const startStamp = new Date(start).getTime();
    const endStamp = new Date(end).getTime();

    const binarySearch = (time: number): number => {
        let left = 0;
        let right = this.cache.length - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (this.cache[mid].lastSeenDate === time) return mid;
            if (this.cache[mid].lastSeenDate < time) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return left;
    };

    const startIndex = binarySearch(startStamp);
    if (startIndex >= this.cache.length) return [];

    const endIndex = binarySearch(endStamp);
    return this.cache.slice(startIndex, endIndex);
    */

  private async getActiveUserMetricsDateRange(start: string, end: string, domainName: string) {
    let filter = `customAttributes.domainName==${domainName};`;

    const dateFrom = new Date(start);
    filter += `lastSeenDate>${dateFrom.getTime()};`;

    const dateTo = new Date(end);
    filter += `lastSeenDate<${dateTo.getTime()};`;

    const params: PXParams<UserFilter, UserSort> = { filter: filter as UserFilter, sort: 'lastSeenDate', pageSize: 1000 };
    return this.api.getUsers(params).then((res) => res.users);
  }
}
