import { Injectable, Logger } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import {
  GainsightConfigValue,
  isValidGainsightConfigValue,
} from "../app.model";
import { DevModeService } from "./dev-mode.service";

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);
  constructor(
    private settings: SettingsService,
    private devMode: DevModeService,
  ) {}

  async getAllDomains(): Promise<{ url: string; id: string }[]> {
    if (this.devMode.isDevModeEnabled()) {
      return [this.devMode.getDevModeDomain()];
    }

    try {
      const res =
        (await this.settings.fetchOrUndefined<GainsightConfigValue>({
          key: "config",
          category: "gainsight",
        })) ?? [];
      if (res && isValidGainsightConfigValue(res)) {
        return res.map((s) => s.domains).flat();
      }
      return [];
    } catch (e) {
      this.logger.error("Error fetching Gainsight domains from settings", e);
      return [];
    }
  }

  async getDomainsForUser(
    user: string,
  ): Promise<{ url: string; id: string }[]> {
    if (this.devMode.isDevModeEnabled()) {
      return [this.devMode.getDevModeDomain()];
    }

    try {
      const res =
        (await this.settings.fetchOrUndefined<GainsightConfigValue>({
          key: `config`,
          category: "gainsight",
        })) ?? [];
      if (res && isValidGainsightConfigValue(res)) {
        return res.find((cfg) => user.includes(cfg.mail))?.domains ?? [];
      }
      return [];
    } catch (e) {
      this.logger.error(
        "Could not find any matching domain for user " + user,
        e,
      );
      return [];
    }
  }
}
