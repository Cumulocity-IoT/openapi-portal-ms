import { Module } from "@nestjs/common";
import { DocController } from "./doc.controller";
import { SpecRegistryModule } from "../spec/spec-registry.module";

@Module({
  imports: [SpecRegistryModule],
  controllers: [DocController],
})
export class DocModule {}
