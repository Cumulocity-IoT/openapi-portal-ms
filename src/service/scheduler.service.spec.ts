import { SchedulerService } from "./scheduler.service";

// ── Helpers ────────────────────────────────────────────────────────────────────

const makeDomain = (id: string) => ({ id, url: `${id}.example.com` });

const makeRateLimitError = () =>
  Object.assign(new Error("Request failed with status code 429"), {
    response: { status: 429 },
  });

const makeCacheService = () => ({
  createOrUpdateCache: jest.fn<Promise<void>, [string, string, { id: string; url: string }]>(),
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe("SchedulerService", () => {
  let scheduler: SchedulerService;
  let activeUsers: ReturnType<typeof makeCacheService>;
  let customEvents: ReturnType<typeof makeCacheService>;
  let pageViews: ReturnType<typeof makeCacheService>;
  let sessionEvents: ReturnType<typeof makeCacheService>;
  let configService: { getAllDomains: jest.Mock };
  let devModeService: { isDevModeEnabled: jest.Mock };

  const TWO_DOMAINS = [makeDomain("t1"), makeDomain("t2")];

  beforeEach(() => {
    jest.useFakeTimers();

    activeUsers = makeCacheService();
    customEvents = makeCacheService();
    pageViews = makeCacheService();
    sessionEvents = makeCacheService();

    activeUsers.createOrUpdateCache.mockResolvedValue(undefined);
    customEvents.createOrUpdateCache.mockResolvedValue(undefined);
    pageViews.createOrUpdateCache.mockResolvedValue(undefined);
    sessionEvents.createOrUpdateCache.mockResolvedValue(undefined);

    configService = { getAllDomains: jest.fn().mockResolvedValue(TWO_DOMAINS) };
    devModeService = { isDevModeEnabled: jest.fn().mockReturnValue(false) };

    scheduler = new SchedulerService(activeUsers as any, customEvents as any, pageViews as any, sessionEvents as any, configService as any, devModeService as any);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  /** Fire handleCron and wait for all pending timers and promises to settle. */
  const triggerAndWait = async () => {
    scheduler.handleCron();
    await jest.runAllTimersAsync();
  };

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  describe("lifecycle", () => {
    it("sets isTaskRunning while executing, clears it on completion", async () => {
      scheduler.handleCron();
      expect(scheduler.isTaskRunning).toBe(true);
      await jest.runAllTimersAsync();
      expect(scheduler.isTaskRunning).toBe(false);
    });

    it("resets isTaskRunning even when getAllDomains rejects", async () => {
      configService.getAllDomains.mockRejectedValue(new Error("config down"));
      await triggerAndWait();
      expect(scheduler.isTaskRunning).toBe(false);
    });

    it("sets lastRun after completion", async () => {
      await triggerAndWait();
      expect(scheduler.lastRun).toBeDefined();
      expect(new Date(scheduler.lastRun!).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("appends one entry to runs history per completed run", async () => {
      await triggerAndWait();
      await triggerAndWait();
      expect(scheduler.runs).toHaveLength(2);
      expect(scheduler.runs[0].start).toBeDefined();
      expect(scheduler.runs[0].end).toBeDefined();
    });

    it("ignores a second invocation while the first is still running", async () => {
      scheduler.handleCron(); // running
      scheduler.handleCron(); // ignored
      await jest.runAllTimersAsync();
      expect(configService.getAllDomains).toHaveBeenCalledTimes(1);
    });
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  describe("happy path", () => {
    it("calls all 4 cache services once per domain", async () => {
      await triggerAndWait();
      for (const svc of [activeUsers, customEvents, pageViews, sessionEvents]) {
        expect(svc.createOrUpdateCache).toHaveBeenCalledTimes(TWO_DOMAINS.length);
      }
    });

    it("passes the correct domain to each cache service", async () => {
      await triggerAndWait();
      const ids = customEvents.createOrUpdateCache.mock.calls.map(([, , domain]) => domain.id);
      expect(ids).toEqual(expect.arrayContaining(["t1", "t2"]));
    });

    it("reports overallSuccess=true and no failures in lastRunStatus", async () => {
      await triggerAndWait();
      expect(scheduler.lastRunStatus!.overallSuccess).toBe(true);
      expect(scheduler.lastRunStatus!.failureCount).toBe(0);
      expect(scheduler.lastRunStatus!.successCount).toBe(TWO_DOMAINS.length * 4);
    });
  });

  // ── Retry behavior ─────────────────────────────────────────────────────────

  describe("retry behavior", () => {
    it("retries a failing service exactly 3 times (MAX_RETRIES) before recording failure", async () => {
      customEvents.createOrUpdateCache.mockRejectedValue(new Error("persistent"));
      await triggerAndWait();

      // 3 attempts × 2 domains
      expect(customEvents.createOrUpdateCache).toHaveBeenCalledTimes(TWO_DOMAINS.length * 3);
      expect(scheduler.lastRunStatus!.failureCount).toBe(TWO_DOMAINS.length);
    });

    it("records the error message and retryAttempt on failure", async () => {
      customEvents.createOrUpdateCache.mockRejectedValue(new Error("boom"));
      await triggerAndWait();

      const failures = scheduler.lastRunStatus!.cacheUpdates.filter((u) => !u.success);
      expect(failures.length).toBeGreaterThan(0);
      expect(failures[0].error).toBe("boom");
      expect(failures[0].cacheType).toBe("custom-events");
      expect(failures[0].retryAttempt).toBe(2); // 0-indexed last attempt
    });

    it("succeeds on the second attempt and records retryAttempt=1", async () => {
      // First attempt fails for each domain, second succeeds
      customEvents.createOrUpdateCache
        .mockRejectedValueOnce(new Error("transient")) // t1 attempt 0
        .mockRejectedValueOnce(new Error("transient")) // t2 attempt 0
        .mockResolvedValue(undefined);

      await triggerAndWait();

      expect(scheduler.lastRunStatus!.overallSuccess).toBe(true);
      const retried = scheduler.lastRunStatus!.cacheUpdates.find((u) => u.success && u.cacheType === "custom-events" && u.retryAttempt === 1);
      expect(retried).toBeDefined();
    });

    it("only failing services retry — other services in the same domain are unaffected", async () => {
      customEvents.createOrUpdateCache.mockRejectedValue(new Error("error"));
      await triggerAndWait();

      // Non-failing services are called exactly once per domain
      expect(activeUsers.createOrUpdateCache).toHaveBeenCalledTimes(TWO_DOMAINS.length);
      expect(sessionEvents.createOrUpdateCache).toHaveBeenCalledTimes(TWO_DOMAINS.length);
    });

    it("uses the standard 2 s delay for non-rate-limit errors", async () => {
      // Single domain to keep things simple
      configService.getAllDomains.mockResolvedValue([makeDomain("t1")]);
      customEvents.createOrUpdateCache.mockRejectedValueOnce(new Error("generic error")).mockResolvedValue(undefined);

      scheduler.handleCron();

      // Flush initial execution — attempt 0 fires and fails
      await jest.advanceTimersByTimeAsync(0);
      expect(customEvents.createOrUpdateCache).toHaveBeenCalledTimes(1);

      // 1999 ms: retry has NOT fired yet
      await jest.advanceTimersByTimeAsync(1999);
      expect(customEvents.createOrUpdateCache).toHaveBeenCalledTimes(1);

      // 1 more ms (total 2000 ms): retry fires
      await jest.advanceTimersByTimeAsync(1);
      await jest.runAllTimersAsync();
      expect(customEvents.createOrUpdateCache).toHaveBeenCalledTimes(2);
    });

    it("uses the longer 5 s backoff delay for 429 rate-limit errors", async () => {
      configService.getAllDomains.mockResolvedValue([makeDomain("t1")]);
      customEvents.createOrUpdateCache.mockRejectedValueOnce(makeRateLimitError()).mockResolvedValue(undefined);

      scheduler.handleCron();

      await jest.advanceTimersByTimeAsync(0);
      expect(customEvents.createOrUpdateCache).toHaveBeenCalledTimes(1);

      // 4999 ms: retry has NOT fired yet (rate-limit delay is 5000 ms)
      await jest.advanceTimersByTimeAsync(4999);
      expect(customEvents.createOrUpdateCache).toHaveBeenCalledTimes(1);

      // 1 more ms: retry fires
      await jest.advanceTimersByTimeAsync(1);
      await jest.runAllTimersAsync();
      expect(customEvents.createOrUpdateCache).toHaveBeenCalledTimes(2);
    });

    it("detects 429 via error message text as well as response status", async () => {
      configService.getAllDomains.mockResolvedValue([makeDomain("t1")]);

      // Error whose message contains "429" but has no .response property
      customEvents.createOrUpdateCache.mockRejectedValueOnce(new Error("Read quota — status 429 reached")).mockResolvedValue(undefined);

      scheduler.handleCron();
      await jest.advanceTimersByTimeAsync(0);
      expect(customEvents.createOrUpdateCache).toHaveBeenCalledTimes(1);

      // Standard delay would fire at 2000 ms; rate-limit delay fires at 5000 ms.
      // At 2001 ms the retry should NOT have fired yet (rate-limit path chosen).
      await jest.advanceTimersByTimeAsync(2001);
      expect(customEvents.createOrUpdateCache).toHaveBeenCalledTimes(1);

      await jest.runAllTimersAsync();
      expect(customEvents.createOrUpdateCache).toHaveBeenCalledTimes(2);
    });
  });

  // ── Failed-domain carry-forward ────────────────────────────────────────────

  describe("failed-domain carry-forward", () => {
    it("retries all domains that had any failure in the next run", async () => {
      customEvents.createOrUpdateCache.mockRejectedValue(new Error("error"));
      await triggerAndWait(); // run 1: all custom-events fail (3 attempts × 2 domains = 6 calls)

      const callsAfterRun1 = customEvents.createOrUpdateCache.mock.calls.length;

      customEvents.createOrUpdateCache.mockResolvedValue(undefined);
      await triggerAndWait(); // run 2: retry succeeds

      // Two more calls (one per domain, first attempt succeeds)
      expect(customEvents.createOrUpdateCache).toHaveBeenCalledTimes(callsAfterRun1 + TWO_DOMAINS.length);
      expect(scheduler.lastRunStatus!.overallSuccess).toBe(true);
    });

    it("re-queues a domain that still fails on the retry run", async () => {
      customEvents.createOrUpdateCache.mockRejectedValue(new Error("persistent"));

      await triggerAndWait(); // run 1 — fails
      const callsAfterRun1 = customEvents.createOrUpdateCache.mock.calls.length;
      expect(scheduler.lastRunStatus!.overallSuccess).toBe(false);

      await triggerAndWait(); // run 2 — still fails, should re-queue
      const callsAfterRun2 = customEvents.createOrUpdateCache.mock.calls.length;
      expect(callsAfterRun2).toBeGreaterThan(callsAfterRun1);
      expect(scheduler.lastRunStatus!.overallSuccess).toBe(false);

      await triggerAndWait(); // run 3 — retried again
      expect(customEvents.createOrUpdateCache.mock.calls.length).toBeGreaterThan(callsAfterRun2);
    });

    it("clears a domain from the retry queue once it succeeds", async () => {
      customEvents.createOrUpdateCache.mockRejectedValue(new Error("error"));
      await triggerAndWait(); // run 1: fails

      customEvents.createOrUpdateCache.mockResolvedValue(undefined);
      await triggerAndWait(); // run 2: succeeds
      expect(scheduler.lastRunStatus!.overallSuccess).toBe(true);

      const callsAfterRun2 = customEvents.createOrUpdateCache.mock.calls.length;
      await triggerAndWait(); // run 3: no carry-forward, normal processing
      // Both domains are processed once each (not doubled)
      expect(customEvents.createOrUpdateCache).toHaveBeenCalledTimes(callsAfterRun2 + TWO_DOMAINS.length);
    });

    it("deduplicates a domain even when multiple services fail for it", async () => {
      customEvents.createOrUpdateCache.mockRejectedValue(new Error("error"));
      sessionEvents.createOrUpdateCache.mockRejectedValue(new Error("error"));
      await triggerAndWait(); // run 1: t1 and t2 each fail on two services

      customEvents.createOrUpdateCache.mockResolvedValue(undefined);
      sessionEvents.createOrUpdateCache.mockResolvedValue(undefined);
      await triggerAndWait(); // run 2: retry

      // Each domain appears once in run 2, not twice
      expect(scheduler.lastRunStatus!.domainsProcessed).toBe(TWO_DOMAINS.length);
      expect(scheduler.lastRunStatus!.overallSuccess).toBe(true);
    });

    it("prioritizes a previously failed domain into the first batch of the next run", async () => {
      // Use 6 domains (two batches: first 5, then 1)
      const SIX_DOMAINS = Array.from({ length: 6 }, (_, i) => makeDomain(`t${i + 1}`));
      configService.getAllDomains.mockResolvedValue(SIX_DOMAINS);

      // t6 (would normally be in batch 2) fails in run 1
      customEvents.createOrUpdateCache.mockImplementation((_s, _e, domain) => (domain.id === "t6" ? Promise.reject(new Error("error")) : Promise.resolve(undefined)));
      await triggerAndWait(); // run 1

      // Reset so all calls succeed in run 2
      customEvents.createOrUpdateCache.mockResolvedValue(undefined);

      const callsBeforeRun2 = customEvents.createOrUpdateCache.mock.calls.length;
      scheduler.handleCron(); // start run 2

      // Advance just past microtasks but well before the 2 s inter-batch delay.
      // At this point only batch 1 (5 domains) should have made their first API call.
      await jest.advanceTimersByTimeAsync(1);

      const calledIds = new Set(customEvents.createOrUpdateCache.mock.calls.slice(callsBeforeRun2).map(([, , d]) => d.id));

      // t6 must be in the first batch (called before the 2 s gap)
      expect(calledIds.has("t6")).toBe(true);
      // At most 5 domains in first batch
      expect(calledIds.size).toBeLessThanOrEqual(5);

      await jest.runAllTimersAsync(); // complete the run
    });
  });

  // ── getAllDomains failures ──────────────────────────────────────────────────

  describe("getAllDomains failure", () => {
    it("does not throw and resets isTaskRunning", async () => {
      configService.getAllDomains.mockRejectedValue(new Error("config unreachable"));
      await expect(triggerAndWait()).resolves.toBeUndefined();
      expect(scheduler.isTaskRunning).toBe(false);
    });

    it("still records lastRun so subsequent runs are not blocked", async () => {
      configService.getAllDomains.mockRejectedValue(new Error("config unreachable"));
      await triggerAndWait();
      expect(scheduler.lastRun).toBeDefined();
    });

    it("does not touch any cache service when config fails", async () => {
      configService.getAllDomains.mockRejectedValue(new Error("config unreachable"));
      await triggerAndWait();
      for (const svc of [activeUsers, customEvents, pageViews, sessionEvents]) {
        expect(svc.createOrUpdateCache).not.toHaveBeenCalled();
      }
    });
  });

  // ── Dev mode ───────────────────────────────────────────────────────────────

  describe("dev mode", () => {
    it("runs the first invocation normally", async () => {
      devModeService.isDevModeEnabled.mockReturnValue(true);
      await triggerAndWait();
      expect(configService.getAllDomains).toHaveBeenCalledTimes(1);
    });

    it("skips all subsequent invocations once data has been fetched", async () => {
      devModeService.isDevModeEnabled.mockReturnValue(true);
      await triggerAndWait(); // first run — allowed
      await triggerAndWait(); // second run — should skip
      await triggerAndWait(); // third run — should skip
      expect(configService.getAllDomains).toHaveBeenCalledTimes(1);
    });
  });
});
