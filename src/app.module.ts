import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { C8yClientProviderService } from "./service/c8y-client-provider.service";
import { SettingsService } from "./service/settings.service";
import { GainsightPxService } from "./service/gainsight-px.service";
import { BootstrapModule } from "./bootstrap.module";
import { UserUtilityService } from "./service/user-utility.service";
import { ActiveUserController } from "./api/v1/active-users.controller";
import { EventsController } from "./api/v1/custom-events.controller";
import { SessionEventsController } from "./api/v1/session-events.controller";
import { PageViewController } from "./api/v1/page-view.controller";
import { ActiveUserControllerV2 } from "./api/v2/active-users-v2.controller";
import { EventsControllerV2 } from "./api/v2/custom-events-v2.controller";
import { PageViewControllerV2 } from "./api/v2/page-view-v2.controller";
import { SessionEventsControllerV2 } from "./api/v2/session-events-v2.controller";
import { SchedulerService } from "./service/scheduler.service";
import { ActiveUsersCacheService } from "./cache/active-users-cache.service";
import { CustomEventsCacheService } from "./cache/custom-events-cache.service";
import { PageViewCacheService } from "./cache/page-view-cache.service";
import { SessionEventsCacheService } from "./cache/session-events-cache.service";
import { ConfigurationService } from "./service/configuration.service";
import { DevModeService } from "./service/dev-mode.service";
import { LlmController } from "./api/ai/llm.controller";
import { OpenApiDocumentService } from "./api/ai/openapi-document.service";

@Module({
  imports: [BootstrapModule, ScheduleModule.forRoot()],
  providers: [
    UserUtilityService,
    {
      provide: GainsightPxService,
      useFactory: async (
        c8yClientProvider: C8yClientProviderService,
        settings: SettingsService,
      ) => {
        const client = await c8yClientProvider.getBootstrapClient();
        settings.setClient(client);
        const { data } = await settings.getTenantOption({
          category: "gainsight",
          key: "api.key",
        });
        if (!data || !data.value) {
          throw new Error(
            "Gainsight PX API key is not configured. Please set the tenant option gainsight/api.key",
          );
        }
        const service = new GainsightPxService(data.value!);
        return service;
      },
      inject: [C8yClientProviderService, SettingsService],
    },
    ActiveUsersCacheService,
    CustomEventsCacheService,
    PageViewCacheService,
    SessionEventsCacheService,
    SchedulerService,
    ConfigurationService,
    SettingsService,
    DevModeService,
    OpenApiDocumentService,
  ],
  controllers: [
    AppController,
    ActiveUserController,
    EventsController,
    SessionEventsController,
    PageViewController,
    ActiveUserControllerV2,
    EventsControllerV2,
    PageViewControllerV2,
    SessionEventsControllerV2,
    LlmController,
  ],
})
export class AppModule {}
