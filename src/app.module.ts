import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { C8yClientProviderService } from './service/c8y-client-provider.service';
import { SettingsService } from './service/settings.service';
import { GainsightPxService } from './service/gainsight-px.service';
import { BootstrapModule } from './bootstrap.module';
import { UserUtilityService } from './service/user-utility.service';
import { ActiveUserController } from './api/active-users.controller';
import { EventsController } from './api/custom-events.controller';
import { SessionEventsController } from './api/session-events.controller';
import { PageViewController } from './api/page-view.controller';
import { SchedulerService } from './service/scheduler.service';
import { ActiveUsersCacheService } from './cache/active-users-cache.service';
import { CustomEventsCacheService } from './cache/custom-events-cache.service';
import { PageViewCacheService } from './cache/page-view-cache.service';
import { SessionEventsCacheService } from './cache/session-events-cache.service';
import { PermissionService } from './service/permission.service';

@Module({
  imports: [BootstrapModule, ScheduleModule.forRoot()],
  providers: [
    UserUtilityService,
    {
      provide: GainsightPxService,
      useFactory: async (c8yClientProvider: C8yClientProviderService) => {
        const client = await c8yClientProvider.getBootstrapClient();
        const settings = new SettingsService(client);
        const { data } = await settings.getTenantOption({ category: 'gainsight', key: 'api.key' });
        if (!data || !data.value) {
          throw new Error('Gainsight PX API key is not configured. Please set the tenant option gainsight/api.key');
        }
        const service = new GainsightPxService(data.value!);
        return service;
      },
      inject: [C8yClientProviderService],
    },
    ActiveUsersCacheService,
    CustomEventsCacheService,
    PageViewCacheService,
    SessionEventsCacheService,
    SchedulerService,
    PermissionService,
  ],
  controllers: [AppController, ActiveUserController, EventsController, SessionEventsController, PageViewController],
})
export class AppModule {}
