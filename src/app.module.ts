import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { C8yClientProviderService } from './service/c8y-client-provider.service';
import { SettingsService } from './service/settings.service';
import { GainsightPxService } from './service/gainsight-px.service';
import { BootstrapModule } from './bootstrap.module';
import { UserUtilityService } from './service/user-utility.service';
import { ActiveUserController } from './active-users.controller';
import { EventsController } from './events.controller';
import { SessionEventsController } from './session-events.controller';
import { PageViewController } from './page-view.controller';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    BootstrapModule,
    CacheModule.register({
      ttl: 60, // cache time-to-live in seconds
      max: 100, // max number of items in cache
    }),
  ],
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
    }
  ],
  controllers: [AppController, ActiveUserController, EventsController, SessionEventsController, PageViewController],
})
export class AppModule {}
