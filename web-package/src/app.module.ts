import { Module } from "@nestjs/common";
import { BootstrapModule } from "./bootstrap.module";
import { ItemsController } from "./api/items/items.controller";

@Module({
  imports: [BootstrapModule],
  controllers: [ItemsController],
})
export class AppModule {}
