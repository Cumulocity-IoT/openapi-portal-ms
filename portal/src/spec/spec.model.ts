export interface SpecEntry {
  id: string;
  label: string;
  /** Remote URL this spec is pulled from (undefined for uploaded specs). */
  url?: string;
  /** Raw OpenAPI document (any version). */
  content: Record<string, unknown>;
  fetchedAt: Date;
  /** Milliseconds between automatic refreshes; only used when `url` is set. */
  ttlMs?: number;
}

export interface SpecSummary {
  id: string;
  label: string;
  url?: string;
  fetchedAt: Date;
}

export interface RegisterSpecDto {
  id: string;
  label: string;
  /** Fetch spec from this URL (mutually exclusive with `content`). */
  url?: string;
  /** Push spec JSON directly (mutually exclusive with `url`). */
  content?: Record<string, unknown>;
  /** Refresh interval in ms; only meaningful when `url` is set. Default 3 600 000 (1 h). */
  ttlMs?: number;
}
