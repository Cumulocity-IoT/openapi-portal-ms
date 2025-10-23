import { Injectable, Logger } from '@nestjs/common';
import { C8yClientProviderService } from './c8y-client-provider.service';
import { ICredentials } from '@c8y/client';
import { REQUIRED_PERMISSION } from '../app.model';

@Injectable()
export class PermissionService {
  private logger = new Logger(PermissionService.name);
  private map = new Map<string, Promise<boolean>>();

  constructor(private clientProvider: C8yClientProviderService) {}

  hasPermission(creds: ICredentials): Promise<boolean> {
    const key = `${creds.user}:${creds.password}`;
    if (!this.map.has(key)) {
      this.logger.log('Checking user for permission ' + REQUIRED_PERMISSION);
      this.map.set(key, this.hasCurrentUserPermissionAssigned(creds));
    }
    return this.map.get(key);
  }

  private async hasCurrentUserPermissionAssigned(creds: ICredentials): Promise<boolean> {
    try {
      const client = await this.clientProvider.getUserClient(creds.user, creds.password);
      const { data: user } = await client.user.currentWithEffectiveRoles();
      if (!user.effectiveRoles) {
        return false;
      }

      return !!user.effectiveRoles?.find((effectiveRole) => effectiveRole.id === REQUIRED_PERMISSION);
    } catch (e) {
      this.logger.error('Error while fetching current user permissions', e);
      return false;
    }
  }
}
