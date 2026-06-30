import { Module } from "@nestjs/common";
import { SpecRegistryService } from "./spec-registry.service";

@Module({
  providers: [SpecRegistryService],
  exports: [SpecRegistryService],
})
export class SpecRegistryModule {}
