import { Logger } from "@nestjs/common";
import { ChronoArrayCache } from "./chrono-array-cache.service";

interface Item {
  date: number;
  value: string;
}

class TestCache extends ChronoArrayCache<Item> {
  private readonly logger = new Logger(TestCache.name);
  getDate(item: Item): number {
    return item.date;
  }
  queryCache(start: string, end: string, tenantId: string): Item[] {
    return this.getCache(
      new Date(start).getTime(),
      new Date(end).getTime(),
      tenantId,
    );
  }
  getLogger(): Logger {
    return this.logger;
  }
}

const TENANT = "t1";

/** Build a timestamp relative to a fixed epoch so tests never depend on wall time. */
const epoch = new Date("2025-01-01T00:00:00.000Z").getTime();
const t = (offsetMs: number): number => epoch + offsetMs;
const iso = (offsetMs: number): string => new Date(t(offsetMs)).toISOString();

const item = (offsetMs: number, value = ""): Item => ({
  date: t(offsetMs),
  value,
});

describe("TreeCache – date range queries", () => {
  let cache: TestCache;

  beforeEach(() => {
    cache = new TestCache();
    jest.spyOn(cache.getLogger(), "log").mockImplementation(() => {});
    jest.spyOn(cache.getLogger(), "verbose").mockImplementation(() => {});
    jest.spyOn(cache.getLogger(), "warn").mockImplementation(() => {});

    // Seed 10 items, one per minute
    const items = Array.from({ length: 10 }, (_, i) =>
      item(i * 60_000, `v${i}`),
    );
    cache.setCache(items, TENANT);
  });

  // ── getCache (via numeric timestamps) ───────────────────────────────────────

  it("returns all items when range covers entire array (O(1) both ends)", () => {
    const result = cache.getCache(t(0), t(9 * 60_000), TENANT);
    expect(result).toHaveLength(10);
  });

  it("returns all items when endDate is beyond the newest event (Grafana path)", () => {
    const result = cache.getCache(t(0), t(99 * 60_000), TENANT);
    expect(result).toHaveLength(10);
  });

  it("returns correct subset for a mid-range start and now-style end", () => {
    // start = 3 minutes in → items 3–9 (7 items)
    const result = cache.getCache(t(3 * 60_000), t(99 * 60_000), TENANT);
    expect(result).toHaveLength(7);
    expect(result[0].value).toBe("v3");
    expect(result[result.length - 1].value).toBe("v9");
  });

  it("returns correct subset for mid-range start and mid-range end", () => {
    // items 2–6 inclusive (5 items)
    const result = cache.getCache(t(2 * 60_000), t(6 * 60_000), TENANT);
    expect(result).toHaveLength(5);
    expect(result[0].value).toBe("v2");
    expect(result[result.length - 1].value).toBe("v6");
  });

  it("returns a single item when start === end === that item's date", () => {
    const result = cache.getCache(t(5 * 60_000), t(5 * 60_000), TENANT);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe("v5");
  });

  it("includes boundary items (inclusive on both ends)", () => {
    const result = cache.getCache(t(1 * 60_000), t(8 * 60_000), TENANT);
    expect(result[0].value).toBe("v1");
    expect(result[result.length - 1].value).toBe("v8");
  });

  it("returns empty array when start is after newest cached event", () => {
    const result = cache.getCache(t(99 * 60_000), t(200 * 60_000), TENANT);
    expect(result).toHaveLength(0);
  });

  it("returns empty array when end is before oldest cached event", () => {
    const result = cache.getCache(t(-200 * 60_000), t(-1), TENANT);
    expect(result).toHaveLength(0);
  });

  it("returns empty array for unknown tenant", () => {
    const result = cache.getCache(t(0), t(9 * 60_000), "unknown");
    expect(result).toHaveLength(0);
  });

  // ── queryCache (ISO string interface) ───────────────────────────────────────

  it("queryCache returns correct items using ISO strings", () => {
    const result = cache.queryCache(iso(2 * 60_000), iso(99 * 60_000), TENANT);
    expect(result).toHaveLength(8); // items 2–9
    expect(result[0].value).toBe("v2");
  });

  // ── setCache ingestion ───────────────────────────────────────────────────────

  it("sorts an out-of-order batch before appending", () => {
    const unsorted: Item[] = [
      item(15 * 60_000, "late"),
      item(11 * 60_000, "early"),
      item(13 * 60_000, "mid"),
    ];
    cache.setCache(unsorted, TENANT);
    // After appending the sorted batch, the array must be in ascending order
    const result = cache.getCache(t(11 * 60_000), t(15 * 60_000), TENANT);
    expect(result).toHaveLength(3);
    expect(result[0].value).toBe("early");
    expect(result[1].value).toBe("mid");
    expect(result[2].value).toBe("late");
  });

  it("setCache with empty array is a no-op", () => {
    cache.setCache([], TENANT);
    const result = cache.getCache(t(0), t(9 * 60_000), TENANT);
    expect(result).toHaveLength(10);
  });

  // ── getStartDate ─────────────────────────────────────────────────────────────

  it("getStartDate returns newest cached item's date for an existing tenant", () => {
    const startDate = cache.getStartDate(iso(0), TENANT);
    expect(startDate).toBe(iso(9 * 60_000));
  });

  it("getStartDate falls back to provided start for an unknown tenant", () => {
    const fallback = iso(0);
    expect(cache.getStartDate(fallback, "unknown")).toBe(fallback);
  });

  // ── TTL eviction (mocked time) ───────────────────────────────────────────────

  it("evicts items older than 60 days on the next setCache call", () => {
    const sixtyOneDaysMs = 61 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Backfill a cache with one stale item and one fresh item
    const staleTs = now - sixtyOneDaysMs;
    const freshTs = now - 60_000;
    const staleTenant = "evict-test";
    cache.setCache(
      [
        { date: staleTs, value: "stale" },
        { date: freshTs, value: "fresh" },
      ],
      staleTenant,
    );

    // Trigger a second setCache (as the cron would) which runs eviction
    cache.setCache([{ date: now, value: "newest" }], staleTenant);

    const all = cache.getCache(0, now + 1, staleTenant);
    expect(all.some((i) => i.value === "stale")).toBe(false);
    expect(all.some((i) => i.value === "fresh")).toBe(true);
    expect(all.some((i) => i.value === "newest")).toBe(true);
  });

  it("uses a custom per-tenant TTL when provided", () => {
    const now = Date.now();
    const tenantId = "custom-ttl-test";
    const customTtlDays = 7;

    // Item within 7 days: 3 days ago
    const freshTs = now - 3 * 24 * 60 * 60 * 1000;
    // Item outside 7 days but within 60 days: 10 days ago
    const staleTs = now - 10 * 24 * 60 * 60 * 1000;

    cache.setCache(
      [
        { date: staleTs, value: "stale" },
        { date: freshTs, value: "fresh" },
      ],
      tenantId,
      customTtlDays,
    );

    // Trigger eviction with a new item using the same custom TTL
    cache.setCache([{ date: now, value: "newest" }], tenantId, customTtlDays);

    const all = cache.getCache(0, now + 1, tenantId);
    expect(all.some((i) => i.value === "stale")).toBe(false);
    expect(all.some((i) => i.value === "fresh")).toBe(true);
    expect(all.some((i) => i.value === "newest")).toBe(true);
  });

  it("retains the custom TTL from the first call and applies it on subsequent calls without ttlDays", () => {
    const now = Date.now();
    const tenantId = "retained-ttl-test";
    const customTtlDays = 7;

    const staleTs = now - 10 * 24 * 60 * 60 * 1000; // 10 days ago → outside 7-day TTL
    const freshTs = now - 3 * 24 * 60 * 60 * 1000; // 3 days ago → within 7-day TTL

    // First call sets the custom TTL
    cache.setCache(
      [{ date: staleTs, value: "stale" }],
      tenantId,
      customTtlDays,
    );

    // Second call omits ttlDays — stored TTL (7 days) should still be used
    cache.setCache([{ date: freshTs, value: "fresh" }, { date: now, value: "newest" }], tenantId);

    const all = cache.getCache(0, now + 1, tenantId);
    expect(all.some((i) => i.value === "stale")).toBe(false);
    expect(all.some((i) => i.value === "fresh")).toBe(true);
    expect(all.some((i) => i.value === "newest")).toBe(true);
  });

  it("falls back to default TTL_DAYS (60) when no custom TTL is set", () => {
    const now = Date.now();
    const tenantId = "default-ttl-test";

    // 61 days ago → outside default 60-day TTL
    const staleTs = now - 61 * 24 * 60 * 60 * 1000;
    // 59 days ago → within default 60-day TTL
    const freshTs = now - 59 * 24 * 60 * 60 * 1000;

    cache.setCache(
      [
        { date: staleTs, value: "stale" },
        { date: freshTs, value: "fresh" },
      ],
      tenantId,
    );
    cache.setCache([{ date: now, value: "newest" }], tenantId);

    const all = cache.getCache(0, now + 1, tenantId);
    expect(all.some((i) => i.value === "stale")).toBe(false);
    expect(all.some((i) => i.value === "fresh")).toBe(true);
  });
});
