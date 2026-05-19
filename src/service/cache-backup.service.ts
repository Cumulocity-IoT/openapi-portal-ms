import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { promisify } from "util";
import { Gzip, createGzip, gunzip } from "zlib";
import { ActiveUsersCacheService } from "../cache/active-users-cache.service";
import { CustomEventsCacheService } from "../cache/custom-events-cache.service";
import { PageViewCacheService } from "../cache/page-view-cache.service";
import { SessionEventsCacheService } from "../cache/session-events-cache.service";
import { CachedEvent, CachedPageView, CachedSessionEvent, CachedUser } from "../model/cache-model";
import { C8yClientProviderService } from "./c8y-client-provider.service";
import { DevModeService } from "./dev-mode.service";

const gunzipAsync = promisify(gunzip);
const DAILY_AT_2AM = "0 2 * * *";
const BACKUP_TYPE = "c8y_GainsightCacheBackup";

interface CacheBackupData {
  timestamp: string;
  activeUsers: Record<string, CachedUser[]>;
  customEvents: Record<string, CachedEvent[]>;
  pageViews: Record<string, CachedPageView[]>;
  sessionEvents: Record<string, CachedSessionEvent[]>;
}

@Injectable()
export class CacheBackupService implements OnModuleInit {
  private readonly logger = new Logger(CacheBackupService.name);

  constructor(
    private readonly c8yClientProvider: C8yClientProviderService,
    private readonly activeUsersCache: ActiveUsersCacheService,
    private readonly customEventsCache: CustomEventsCacheService,
    private readonly pageViewCache: PageViewCacheService,
    private readonly sessionEventsCache: SessionEventsCacheService,
    private readonly devModeService: DevModeService,
  ) {}

  async onModuleInit() {
    if (this.devModeService.isDevModeEnabled()) {
      return;
    }
    await this.tryRestoreFromBackup();
  }

  @Cron(DAILY_AT_2AM)
  async handleBackupCron() {
    if (this.devModeService.isDevModeEnabled()) {
      return;
    }
    await this.createBackup();
  }

  async createBackup(): Promise<void> {
    this.logger.log("Starting daily cache backup...");
    const start = Date.now();
    try {
      const client = await this.c8yClientProvider.getBootstrapClient();

      // Stream JSON directly into gzip one domain at a time to avoid
      // materialising a single giant JSON string for the whole cache.
      const gz = createGzip();
      const gzipChunks: Buffer[] = [];
      gz.on("data", (chunk: Buffer) => gzipChunks.push(chunk));
      const finished = new Promise<void>((resolve, reject) => {
        gz.on("end", resolve);
        gz.on("error", reject);
      });

      gz.write(`{"timestamp":${JSON.stringify(new Date().toISOString())}`);
      let totalItems = 0;
      totalItems += this.writeCacheSection(gz, "activeUsers", this.activeUsersCache.cache);
      totalItems += this.writeCacheSection(gz, "customEvents", this.customEventsCache.cache);
      totalItems += this.writeCacheSection(gz, "pageViews", this.pageViewCache.cache);
      totalItems += this.writeCacheSection(gz, "sessionEvents", this.sessionEventsCache.cache);
      gz.write("}");
      gz.end();
      await finished;

      const compressed = Buffer.concat(gzipChunks);

      const { data: existing } = await client.inventory.list({
        type: BACKUP_TYPE,
        pageSize: 5,
      });
      await Promise.all((existing ?? []).map((mo) => client.inventoryBinary.delete(mo.id)));

      await client.inventoryBinary.create(compressed, {
        name: "gainsight-cache-backup",
        type: BACKUP_TYPE,
      });

      this.logger.log(`Cache backup created. ${totalItems} items, ${compressed.length} bytes compressed. Duration: ${Date.now() - start}ms`);
    } catch (error) {
      this.logger.error("Failed to create cache backup", error);
    }
  }

  async tryRestoreFromBackup(): Promise<void> {
    if (!this.areCachesEmpty()) {
      return;
    }
    this.logger.log("Caches are empty on startup — attempting to restore from backup...");
    try {
      const client = await this.c8yClientProvider.getBootstrapClient();
      const { data } = await client.inventory.list({
        type: BACKUP_TYPE,
        pageSize: 1,
      });
      const backupMO = data?.[0];
      if (!backupMO) {
        this.logger.log("No backup found in inventory.");
        return;
      }

      const response = await client.inventoryBinary.download(backupMO.id);
      if (!response.ok) {
        this.logger.error(`Failed to download backup: HTTP ${response.status}`);
        return;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const decompressed = await gunzipAsync(buffer);
      const backupData: CacheBackupData = JSON.parse(decompressed.toString("utf8"));

      this.activeUsersCache.importAll(backupData.activeUsers);
      this.customEventsCache.importAll(backupData.customEvents);
      this.pageViewCache.importAll(backupData.pageViews);
      this.sessionEventsCache.importAll(backupData.sessionEvents);

      let totalItems = 0;
      const sections = [backupData.activeUsers, backupData.customEvents, backupData.pageViews, backupData.sessionEvents];
      for (let s = 0; s < sections.length; s++) {
        const vals = Object.values(sections[s]);
        for (let i = 0; i < vals.length; i++) {
          totalItems += vals[i].length;
        }
      }

      this.logger.log(`Cache restored from backup (${backupData.timestamp}). ${totalItems} items imported.`);
    } catch (error) {
      this.logger.error("Failed to restore cache from backup", error);
    }
  }

  private writeCacheSection(gz: Gzip, label: string, cache: Map<string, unknown[]>): number {
    gz.write(`,"${label}":{`);
    let count = 0;
    let i = 0;
    cache.forEach((values, key) => {
      if (i > 0) gz.write(",");
      gz.write(`${JSON.stringify(key)}:${JSON.stringify(values)}`);
      count += values.length;
      i++;
    });
    gz.write("}");
    return count;
  }

  private areCachesEmpty(): boolean {
    return this.activeUsersCache.cache.size === 0 && this.customEventsCache.cache.size === 0 && this.pageViewCache.cache.size === 0 && this.sessionEventsCache.cache.size === 0;
  }
}
