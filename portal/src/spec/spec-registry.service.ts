import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { SpecEntry, SpecSummary } from "./spec.model";

@Injectable()
export class SpecRegistryService implements OnModuleDestroy {
  private readonly logger = new Logger(SpecRegistryService.name);
  private readonly specs = new Map<string, SpecEntry>();
  private readonly timers = new Map<string, ReturnType<typeof setInterval>>();

  // ─── Public API ────────────────────────────────────────────────────────────

  async addFromUrl(id: string, label: string, url: string, ttlMs = 3_600_000): Promise<void> {
    await this.fetchAndStore(id, label, url, ttlMs);
    this.scheduleRefresh(id, label, url, ttlMs);
  }

  addFromPayload(id: string, label: string, content: Record<string, unknown>): void {
    this.specs.set(id, { id, label, content, fetchedAt: new Date() });
    this.logger.log(`Spec "${id}" registered from payload`);
  }

  async refresh(id: string): Promise<void> {
    const entry = this.specs.get(id);
    if (!entry?.url) {
      throw new Error(`Spec "${id}" has no URL to refresh from`);
    }
    await this.fetchAndStore(id, entry.label, entry.url, entry.ttlMs);
  }

  getAll(): SpecSummary[] {
    return [...this.specs.values()].map(({ id, label, url, fetchedAt }) => ({ id, label, url, fetchedAt }));
  }

  getById(id: string): SpecEntry | undefined {
    return this.specs.get(id);
  }

  delete(id: string): boolean {
    this.clearTimer(id);
    return this.specs.delete(id);
  }

  onModuleDestroy() {
    for (const id of this.timers.keys()) {
      this.clearTimer(id);
    }
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private async fetchAndStore(id: string, label: string, url: string, ttlMs?: number): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch spec "${id}" from ${url}: HTTP ${response.status}`);
    }
    const content = (await response.json()) as Record<string, unknown>;
    this.specs.set(id, { id, label, url, content, fetchedAt: new Date(), ttlMs });
    this.logger.log(`Spec "${id}" fetched from ${url}`);
  }

  private scheduleRefresh(id: string, label: string, url: string, ttlMs: number): void {
    this.clearTimer(id);
    const timer = setInterval(() => {
      this.fetchAndStore(id, label, url, ttlMs).catch((err: unknown) =>
        this.logger.error(`Auto-refresh of spec "${id}" failed: ${String(err)}`),
      );
    }, ttlMs);
    // Allow Node to exit even if this timer is still pending
    if (typeof timer === "object" && timer !== null && "unref" in timer) {
      (timer as { unref(): void }).unref();
    }
    this.timers.set(id, timer);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }
}
