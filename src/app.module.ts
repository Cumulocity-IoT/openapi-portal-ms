import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { SchedulerService } from './service/scheduler.service';
import { C8yClientProviderService } from './service/c8y-client-provider.service';
import { SettingsService } from './service/settings.service';
import { GainsightPxService } from './service/gainsight-px.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    SchedulerService,
    C8yClientProviderService,
    GainsightPxService,
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
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
