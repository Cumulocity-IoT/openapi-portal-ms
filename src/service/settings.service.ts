import { Client, ITenantOption } from '@c8y/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SettingsService {
  private client: Client;

  setClient(client: Client) {
    this.client = client;
  }

  private createTenantOption(option: ITenantOption) {
    return this.client.options.tenant.create(option);
  }

  getTenantOption(option: ITenantOption) {
    return this.client.options.tenant.detail(option);
  }

  async fetchOrFallbackTo<T>(option: ITenantOption, defaultValue: T): Promise<T> {
    try {
      const { data } = await this.getTenantOption(option);
      const value = JSON.parse(data.value);
      return value;
    } catch (e) {
      console.warn(`Error occured for tenant option ${JSON.stringify(option)}: ${e} - using default value ${JSON.stringify(defaultValue)}`);
      await this.createDefault(option, defaultValue);
      return defaultValue;
    }
  }

  async fetchOrUndefined<T>(option: ITenantOption): Promise<T | undefined> {
    try {
      const { data } = await this.getTenantOption(option);
      const value = JSON.parse(data.value);
      return value;
    } catch (e) {
      console.warn(`Error occured for tenant option ${JSON.stringify(option)}: ${e} - returning undefined`);
      return undefined;
    }
  }

  private async createDefault<T>(option: ITenantOption, defaultValue: T): Promise<void> {
    try {
      await this.createTenantOption({
        ...option,
        value: JSON.stringify(defaultValue),
      });
    } catch (e) {
      console.error(`Could not create default value: ${JSON.stringify(e)}`);
    }
  }
}
