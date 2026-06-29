import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { SpecRegistryModule } from "../spec/spec-registry.module";
import { BootstrapModule } from "../bootstrap.module";
import { TenantGuard } from "../guards/tenant.guard";

@Module({
  imports: [BootstrapModule, SpecRegistryModule],
  providers: [TenantGuard],
  controllers: [AdminController],
})
export class AdminModule {}
