/**
 * Tracks the result of a cache update operation.
 * Provides detailed audit information about what was attempted and whether it succeeded.
 */
export interface CacheUpdateStatus {
  cacheType: string;
  tenantId: string;
  rangeStart: string;
  rangeEnd: string;
  success: boolean;
  error?: string;
  stackTrace?: string;
  timestamp: string;
  durationMs: number;
  retryAttempt: number;
}

/**
 * Aggregated results for a scheduler run.
 * Tracks which caches succeeded and which failed.
 */
export interface SchedulerRunStatus {
  /** Unique run ID for correlation */
  runId: string;

  /** When the run started */
  startTime: string;

  /** When the run ended */
  endTime: string;

  /** Total duration (ms) */
  durationMs: number;

  /** Number of domains processed */
  domainsProcessed: number;

  /** Results for each cache update (4 per domain = 4x domains total) */
  cacheUpdates: CacheUpdateStatus[];

  /** Number of successful updates */
  successCount: number;

  /** Number of failed updates */
  failureCount: number;

  /** Whether the entire run was successful (all caches updated) */
  overallSuccess: boolean;

  /** Summary message for logging */
  summary: string;
}
