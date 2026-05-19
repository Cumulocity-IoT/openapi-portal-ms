import { PageViewController } from "./page-view.controller";

describe("PageViewController (empty input)", () => {
  let controller: PageViewController;
  let mockCacheService: any;

  beforeEach(() => {
    mockCacheService = { queryCache: jest.fn() };
    controller = new PageViewController(mockCacheService);
  });

  it("aggregateById returns empty array for empty input and any type", () => {
    const result = (controller as any).aggregateById([], "device");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("createrPopularPagesAggregation returns empty array for empty input", () => {
    const result = (controller as any).createrPopularPagesAggregation([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("getDeviceCounts returns empty array and calls cache when cache returns empty synchronously", async () => {
    mockCacheService.queryCache.mockReturnValue([]);
    const res = await controller.getDeviceCounts("2020-01-01", "2020-01-02", "t1234");
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
    expect(mockCacheService.queryCache).toHaveBeenCalledWith("2020-01-01", "2020-01-02", "t1234");
  });

  it("getCountsForType returns empty array and calls cache with type parameter", async () => {
    mockCacheService.queryCache.mockReturnValue([]);
    const res = await controller.getCountsForType("2020-01-01", "2020-01-02", "t1234", "group");
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
    expect(mockCacheService.queryCache).toHaveBeenCalledWith("2020-01-01", "2020-01-02", "t1234");
  });

  it("getPageViewCounts returns empty array and calls cache when cache resolves empty", async () => {
    mockCacheService.queryCache.mockReturnValue([]);
    const res = await controller.getPageViewCounts("2020-01-01", "2020-01-02", "t1234");
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
    expect(mockCacheService.queryCache).toHaveBeenCalledWith("2020-01-01", "2020-01-02", "t1234");
  });
});
