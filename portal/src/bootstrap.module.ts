import { Module } from "@nestjs/common";
import { C8yClientProviderService } from "./service/c8y-client-provider.service";
import { C8yBootstrapService } from "./service/c8y-bootstrap.service";
import { DevModeService } from "./service/dev-mode.service";

@Module({
  providers: [C8yClientProviderService, C8yBootstrapService, DevModeService],
  exports: [C8yClientProviderService, DevModeService],
})
export class BootstrapModule {}
