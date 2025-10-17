import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export type FetchRange = { start: string; end: string };

@Injectable()
export class MyCacheService {

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  
  
}
