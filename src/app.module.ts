import { Module } from "@nestjs/common";
import { BootstrapModule } from "./bootstrap.module";
import { SpecRegistryModule } from "./spec/spec-registry.module";
import { AdminModule } from "./admin/admin.module";
import { DocModule } from "./doc/doc.module";

@Module({
  imports: [BootstrapModule, SpecRegistryModule, AdminModule, DocModule],
})
export class AppModule {}
