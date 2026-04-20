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
    cache.setCache(
      [
        { date: freshTs, value: "fresh" },
        { date: now, value: "newest" },
      ],
      tenantId,
    );

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

// ── mergeSorted (tested indirectly via setCache) ─────────────────────────────
// mergeSorted(a, b) receives (existing, incomingBatch).  We control `a` by
// pre-seeding the cache and `b` by the items passed to setCache.

describe("mergeSorted", () => {
  let cache: TestCache;
  const MID = "merge-tenant";

  beforeEach(() => {
    cache = new TestCache();
    jest.spyOn(cache.getLogger(), "log").mockImplementation(() => {});
    jest.spyOn(cache.getLogger(), "verbose").mockImplementation(() => {});
    jest.spyOn(cache.getLogger(), "warn").mockImplementation(() => {});
  });

  // Fast path: a is empty (no prior cache) → result equals incoming batch
  it("returns incoming batch unchanged when cache is empty (a is empty)", () => {
    cache.setCache([item(200, "b"), item(100, "a")], MID);
    // setCache sorts before merging, so result should be ascending
    const result = cache.getCache(t(0), t(300), MID);
    expect(result.map((i) => i.value)).toEqual(["a", "b"]);
  });

  // No-overlap fast path: all of a is before b (common incremental-load path)
  it("appends new batch after existing cache without element-wise comparison (a tail ≤ b head)", () => {
    cache.setCache([item(100, "a1"), item(200, "a2")], MID);
    cache.setCache([item(300, "b1"), item(400, "b2")], MID);
    const result = cache.getCache(t(0), t(500), MID);
    expect(result.map((i) => i.value)).toEqual(["a1", "a2", "b1", "b2"]);
  });

  // No-overlap fast path: all of b is before a (back-fill scenario)
  it("prepends new batch before existing cache when b is entirely older (b tail ≤ a head)", () => {
    cache.setCache([item(300, "a1"), item(400, "a2")], MID);
    cache.setCache([item(100, "b1"), item(200, "b2")], MID);
    const result = cache.getCache(t(0), t(500), MID);
    expect(result.map((i) => i.value)).toEqual(["b1", "b2", "a1", "a2"]);
  });

  // Boundary of no-overlap: last of a equals first of b (touching, not interleaving)
  it("uses concat fast path when a's last timestamp equals b's first timestamp", () => {
    cache.setCache([item(100, "a1"), item(200, "a2")], MID);
    cache.setCache([item(200, "b_same"), item(300, "b1")], MID);
    const result = cache.getCache(t(0), t(400), MID);
    // Both items at t(200) must be present and a2 must precede b_same (stable)
    const values = result.map((i) => i.value);
    expect(values).toContain("a2");
    expect(values).toContain("b_same");
    expect(values.indexOf("a2")).toBeLessThan(values.indexOf("b_same"));
  });

  // Full merge loop: arrays interleave
  it("merges interleaved arrays into a single sorted sequence", () => {
    cache.setCache([item(100, "a1"), item(300, "a2"), item(500, "a3")], MID);
    cache.setCache([item(200, "b1"), item(400, "b2"), item(600, "b3")], MID);
    const result = cache.getCache(t(0), t(700), MID);
    expect(result.map((i) => i.value)).toEqual([
      "a1",
      "b1",
      "a2",
      "b2",
      "a3",
      "b3",
    ]);
  });

  // Full merge loop: a exhausted first → remaining b items appended
  it("appends remaining b items when a is exhausted during the merge loop", () => {
    cache.setCache([item(100, "a1"), item(200, "a2")], MID);
    cache.setCache([item(150, "b1"), item(300, "b2"), item(400, "b3")], MID);
    const result = cache.getCache(t(0), t(500), MID);
    expect(result.map((i) => i.value)).toEqual(["a1", "b1", "a2", "b2", "b3"]);
  });

  // Full merge loop: b exhausted first → remaining a items appended
  it("appends remaining a items when b is exhausted during the merge loop", () => {
    cache.setCache([item(100, "a1"), item(300, "a2"), item(400, "a3")], MID);
    cache.setCache([item(150, "b1"), item(200, "b2")], MID);
    const result = cache.getCache(t(0), t(500), MID);
    expect(result.map((i) => i.value)).toEqual(["a1", "b1", "b2", "a2", "a3"]);
  });

  // Equal timestamps: a[i] goes before b[j] due to <= comparison (stable-ish)
  it("places a's element before b's when timestamps are equal (≤ comparison)", () => {
    cache.setCache([item(100, "a_same"), item(200, "a2")], MID);
    cache.setCache([item(100, "b_same"), item(300, "b2")], MID);
    const result = cache.getCache(t(0), t(400), MID);
    const values = result.map((i) => i.value);
    expect(values.indexOf("a_same")).toBeLessThan(values.indexOf("b_same"));
  });

  // Single-element arrays
  it("merges two single-element arrays correctly", () => {
    cache.setCache([item(200, "a")], MID);
    cache.setCache([item(100, "b")], MID);
    const result = cache.getCache(t(0), t(300), MID);
    expect(result.map((i) => i.value)).toEqual(["b", "a"]);
  });
});

// ── findFirstIndex / findLastIndex / getEventsInRange ────────────────────────
// Private methods accessed via (cache as any) cast.

describe("findFirstIndex / findLastIndex / getEventsInRange", () => {
  let cache: TestCache;

  let svc: any;

  const MIN = 60_000;
  // 7 items at minutes 0–6
  const arr: Item[] = Array.from({ length: 7 }, (_, i) =>
    item(i * MIN, `v${i}`),
  );

  beforeEach(() => {
    cache = new TestCache();
    svc = cache as any;
  });

  // ── findFirstIndex ──────────────────────────────────────────────────────────

  it("returns 0 when startDate equals the first element's date", () => {
    expect(svc.findFirstIndex(arr, t(0))).toBe(0);
  });

  it("returns 0 when startDate is before all elements", () => {
    expect(svc.findFirstIndex(arr, t(-1))).toBe(0);
  });

  it("returns last index when startDate equals the last element's date", () => {
    expect(svc.findFirstIndex(arr, t(6 * MIN))).toBe(6);
  });

  it("returns the index of the first element >= startDate when startDate falls in a gap", () => {
    // gap between v2 (t(2*MIN)) and v3 (t(3*MIN)): startDate = t(2*MIN)+1 → index 3
    expect(svc.findFirstIndex(arr, t(2 * MIN + 1))).toBe(3);
  });

  it("returns the exact index when startDate equals a mid-array element's date", () => {
    expect(svc.findFirstIndex(arr, t(3 * MIN))).toBe(3);
  });

  // ── findLastIndex ───────────────────────────────────────────────────────────

  it("returns last index when endDate equals the last element's date", () => {
    expect(svc.findLastIndex(arr, t(6 * MIN))).toBe(6);
  });

  it("returns last index when endDate is after all elements", () => {
    expect(svc.findLastIndex(arr, t(99 * MIN))).toBe(6);
  });

  it("returns 0 when endDate equals the first element's date", () => {
    expect(svc.findLastIndex(arr, t(0))).toBe(0);
  });

  it("returns the index of the last element <= endDate when endDate falls in a gap", () => {
    // gap between v3 (t(3*MIN)) and v4 (t(4*MIN)): endDate = t(3*MIN)+1 → index 3
    expect(svc.findLastIndex(arr, t(3 * MIN + 1))).toBe(3);
  });

  it("returns the exact index when endDate equals a mid-array element's date", () => {
    expect(svc.findLastIndex(arr, t(4 * MIN))).toBe(4);
  });

  it("excludes element when endDate is 1 ms before it", () => {
    expect(svc.findLastIndex(arr, t(4 * MIN - 1))).toBe(3);
  });

  // ── getEventsInRange ────────────────────────────────────────────────────────

  it("returns empty array for an empty input array", () => {
    expect(svc.getEventsInRange([], t(0), t(MIN))).toEqual([]);
  });

  it("returns all elements when range covers the full array", () => {
    const result = svc.getEventsInRange(arr, t(0), t(6 * MIN));
    expect(result).toHaveLength(7);
    expect(result[0].value).toBe("v0");
    expect(result[6].value).toBe("v6");
  });

  it("returns empty array when startIndex > endIndex after binary search", () => {
    // startDate = t(5*MIN) → findFirstIndex returns 5
    // endDate   = t(4*MIN) → findLastIndex  returns 4
    // 5 > 4 → []
    expect(svc.getEventsInRange(arr, t(5 * MIN), t(4 * MIN))).toEqual([]);
  });

  it("uses O(1) end path (endDate >= newest) and binary-search start path", () => {
    const result = svc.getEventsInRange(arr, t(2 * MIN), t(99 * MIN));
    expect(result).toHaveLength(5); // v2..v6
    expect(result[0].value).toBe("v2");
    expect(result[4].value).toBe("v6");
  });

  it("uses O(1) start path (startDate <= oldest) and binary-search end path", () => {
    const result = svc.getEventsInRange(arr, t(-1), t(3 * MIN));
    expect(result).toHaveLength(4); // v0..v3
    expect(result[0].value).toBe("v0");
    expect(result[3].value).toBe("v3");
  });

  it("uses both binary searches when range is strictly interior", () => {
    const result = svc.getEventsInRange(arr, t(1 * MIN), t(5 * MIN));
    expect(result).toHaveLength(5); // v1..v5
    expect(result[0].value).toBe("v1");
    expect(result[4].value).toBe("v5");
  });

  it("returns a single element when start and end equal the same element's date", () => {
    const result = svc.getEventsInRange(arr, t(3 * MIN), t(3 * MIN));
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe("v3");
  });
});
