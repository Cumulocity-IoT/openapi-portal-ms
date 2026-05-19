import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { formatDuration, intervalToDuration, subDays, subMilliseconds } from "date-fns";
import { ActiveUsersCacheService } from "../cache/active-users-cache.service";
import { CustomEventsCacheService } from "../cache/custom-events-cache.service";
import { PageViewCacheService } from "../cache/page-view-cache.service";
import { SessionEventsCacheService } from "../cache/session-events-cache.service";
import { ConfigurationService } from "./configuration.service";
import { DevModeService } from "./dev-mode.service";
import { TTL_DAYS } from "../app.model";
import { CacheUpdateStatus, SchedulerRunStatus } from "../model/cache-update-status.model";

const EVERY_10_MINUTES = "*/10 * * * *";
// const EVERY_HOUR = '0 * * * *';
const DOMAIN_BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const RATE_LIMIT_DELAY_MS = 5000;
const RATE_LIMIT_BACKOFF_MULTIPLIER = 3;

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  public isTaskRunning = false;
  public lastRun?: string;
  public lastRunStatus?: SchedulerRunStatus;
  private runStart!: Date;
  public runDuration?: string;
  public runs: { start: string; end: string; duration: string }[] = [];
  private failedDomains = new Set<string>();

  constructor(
    private activeUserCacheService: ActiveUsersCacheService,
    private customEventsCacheService: CustomEventsCacheService,
    private pageViewCacheService: PageViewCacheService,
    private sessionEventsCacheService: SessionEventsCacheService,
    private configService: ConfigurationService,
    private devModeService: DevModeService,
  ) {}

  @Cron(EVERY_10_MINUTES)
  handleCron() {
    if (this.lastRun && this.devModeService.isDevModeEnabled()) {
      this.logger.warn("Dev mode is enabled and content was fetched once already. Skipping delta updates.");
      return;
    }

    if (this.isTaskRunning) {
      this.logger.warn("Task is already running. Skipping this execution.");
      return;
    }

    this.isTaskRunning = true;
    this.runStart = new Date();
    delete this.runDuration;
    const runId = this.generateRunId();
    this.logger.log(`Starting the scheduled task. RunId: ${runId}`);

    const isDevMode = this.devModeService.isDevModeEnabled();
    const cacheUpdateResults: CacheUpdateStatus[] = [];

    this.configService
      .getAllDomains()
      .then(async (domains) => {
        const prevFailed = new Set(this.failedDomains);
        this.failedDomains.clear();
        if (prevFailed.size > 0) {
          this.logger.log(`Retrying ${prevFailed.size} domain(s) that failed last run: ${[...prevFailed].join(", ")}`);
        }
        const prioritizedDomains = [...domains.filter((d) => prevFailed.has(d.id)), ...domains.filter((d) => !prevFailed.has(d.id))];

        for (let i = 0; i < prioritizedDomains.length; i += DOMAIN_BATCH_SIZE) {
          const batch = prioritizedDomains.slice(i, i + DOMAIN_BATCH_SIZE);
          this.logger.log(`Processing domain batch ${Math.floor(i / DOMAIN_BATCH_SIZE) + 1} of ${Math.ceil(prioritizedDomains.length / DOMAIN_BATCH_SIZE)} (${batch.length} domains)`);

          await Promise.allSettled(
            batch.map(async (domain) => {
              let timeRange: { start: string; end: string };
              if (isDevMode) {
                const randomMs = Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 3); // up to 3 days
                timeRange = {
                  start: subMilliseconds(new Date(), randomMs).toISOString(),
                  end: new Date().toISOString(),
                };
              } else {
                const ttlDays = domain.ttl ?? TTL_DAYS;
                timeRange = {
                  start: subDays(new Date(), ttlDays).toISOString(),
                  end: new Date().toISOString(),
                };
              }

              this.logger.log("Running cache update for domain: " + domain.url + " (tenantId: " + domain.id + ")");

              await Promise.allSettled([
                this.updateCacheWithRetry("active-users", () => this.activeUserCacheService.createOrUpdateCache(timeRange.start, timeRange.end, domain), domain.id, timeRange.start, timeRange.end, cacheUpdateResults),
                this.updateCacheWithRetry("custom-events", () => this.customEventsCacheService.createOrUpdateCache(timeRange.start, timeRange.end, domain), domain.id, timeRange.start, timeRange.end, cacheUpdateResults),
                this.updateCacheWithRetry("page-views", () => this.pageViewCacheService.createOrUpdateCache(timeRange.start, timeRange.end, domain), domain.id, timeRange.start, timeRange.end, cacheUpdateResults),
                this.updateCacheWithRetry("session-events", () => this.sessionEventsCacheService.createOrUpdateCache(timeRange.start, timeRange.end, domain), domain.id, timeRange.start, timeRange.end, cacheUpdateResults),
              ]);
            }),
          );

          if (i + DOMAIN_BATCH_SIZE < prioritizedDomains.length) {
            await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
          }
        }

        return domains;
      })
      .catch((error) => {
        this.logger.error("Scheduled cache run failed.", error);
      })
      .finally(() => {
        const runEnd = new Date();
        this.lastRun = runEnd.toISOString();
        const duration = intervalToDuration({
          start: this.runStart,
          end: runEnd,
        });

        this.runDuration = formatDuration(duration);
        this.updateRuns();

        // Create comprehensive run status
        const successCount = cacheUpdateResults.filter((r) => r.success).length;
        const failureCount = cacheUpdateResults.length - successCount;
        const overallSuccess = failureCount === 0;

        this.lastRunStatus = {
          runId,
          startTime: this.runStart.toISOString(),
          endTime: this.lastRun,
          durationMs: runEnd.getTime() - this.runStart.getTime(),
          domainsProcessed: cacheUpdateResults.length / 4,
          cacheUpdates: cacheUpdateResults,
          successCount,
          failureCount,
          overallSuccess,
          summary: `Cache updates completed: ${successCount} succeeded, ${failureCount} failed. Overall: ${overallSuccess ? "SUCCESS" : "PARTIAL FAILURE"}`,
        };

        this.logger.log(`Task execution completed. Duration: ${this.runDuration}. ${this.lastRunStatus.summary}`);

        if (!overallSuccess) {
          this.logger.warn(`Failed cache updates detected in run ${runId}. See lastRunStatus for details.`);
          for (let i = 0; i < cacheUpdateResults.length; i++) {
            if (!cacheUpdateResults[i].success) {
              this.failedDomains.add(cacheUpdateResults[i].tenantId);
            }
          }
          this.logger.log(`${this.failedDomains.size} domain(s) queued for retry in the next run.`);
        }

        this.isTaskRunning = false;
      });
  }

  /**
   * Updates a cache with automatic retry on failure.
   * For 429 (rate limit) errors, uses exponential backoff and varies the time window
   * to avoid hitting the exact same request that's rate limited.
   * Tracks success/failure status for audit trail.
   */
  private async updateCacheWithRetry(cacheType: string, updateFn: () => Promise<void>, tenantId: string, rangeStart: string, rangeEnd: string, results: CacheUpdateStatus[]): Promise<void> {
    let lastError: Error | null = null;
    const baseStart = Date.now();

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const attemptStart = Date.now();
      try {
        this.logger.debug(`[${cacheType}] Attempt ${attempt + 1}/${MAX_RETRIES} for tenant ${tenantId}`);

        await updateFn();

        results.push({
          cacheType,
          tenantId,
          rangeStart,
          rangeEnd,
          success: true,
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - attemptStart,
          retryAttempt: attempt,
        });

        this.logger.log(`[${cacheType}] Cache update succeeded for tenant ${tenantId} on attempt ${attempt + 1}`);
        return;
      } catch (error) {
        lastError = error as Error;
        const isRateLimitError = this.isRateLimitError(lastError);

        this.logger.warn(`[${cacheType}] Cache update failed on attempt ${attempt + 1}/${MAX_RETRIES} for tenant ${tenantId}: ${lastError.message}${isRateLimitError ? " (Rate limited - 429)" : ""}`);

        if (attempt < MAX_RETRIES - 1) {
          const delayMs = isRateLimitError ? RATE_LIMIT_DELAY_MS * Math.pow(RATE_LIMIT_BACKOFF_MULTIPLIER, attempt) : RETRY_DELAY_MS;
          this.logger.debug(`[${cacheType}] Retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          results.push({
            cacheType,
            tenantId,
            rangeStart,
            rangeEnd,
            success: false,
            error: lastError.message,
            stackTrace: lastError.stack,
            timestamp: new Date().toISOString(),
            durationMs: Date.now() - baseStart,
            retryAttempt: attempt,
          });

          this.logger.error(`[${cacheType}] Cache update FAILED after ${MAX_RETRIES} attempts for tenant ${tenantId}`, lastError);
        }
      }
    }
  }

  /**
   * Detects if an error is a rate limit error (429).
   * Checks both error message and HTTP status code if available.
   */
  private isRateLimitError(error: Error): boolean {
    if (!error) return false;

    const message = error.message.toLowerCase();
    // Check for 429 in message or common rate limit indicators
    return (
      message.includes("429") || message.includes("too many requests") || message.includes("rate limit") || message.includes("throttled") || (error as any).status === 429 || (error as any).statusCode === 429 || (error as any).response?.status === 429 || (error as any).response?.statusCode === 429
    );
  }

  /**
   * Generate a unique run ID for correlation and auditing.
   */
  private generateRunId(): string {
    return `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getDuration() {
    if (this.isTaskRunning) {
      const now = new Date();
      const duration = intervalToDuration({
        start: this.runStart,
        end: now,
      });
      return formatDuration(duration);
    }
    return this.runDuration;
  }

  private updateRuns() {
    this.runs.push({
      start: this.runStart.toISOString(),
      end: this.lastRun!,
      duration: this.runDuration!,
    });
    if (this.runs.length > 1000) {
      this.runs.shift();
    }
  }
}
