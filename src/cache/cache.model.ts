export interface MyCache<T> {
    createCache(start: string, end: string, domainName: string);
    queryCache(start: string, end: string): T[];
}