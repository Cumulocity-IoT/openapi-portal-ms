import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { NoColorLogger } from "./logger/no-color.logger";
import { SpecRegistryService } from "./spec/spec-registry.service";
import { RegisterSpecDto } from "./spec/spec.model";
import * as fs from "fs";
import * as path from "path";

async function bootstrap() {
  const logger = new NoColorLogger();
  const app = await NestFactory.create(AppModule, { logger });

  // ── Self-describing OpenAPI spec ────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle("OpenAPI Portal")
    .setDescription("A generic Cumulocity microservice that hosts and renders multiple OpenAPI specs.")
    .setVersion("1.0.0")
    .addBasicAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document, {
    customCssUrl: "https://unpkg.com/swagger-ui-dist/swagger-ui.css",
    customJs: [
      "https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js",
      "https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js",
    ],
  });

  // Write the portal's own spec to disk when requested (pnpm openapi:generate).
  if (process.env.GENERATE_API_DOCS === "true") {
    fs.writeFileSync(path.resolve("./docs/openapi.json"), JSON.stringify(document, null, 2));
    logger.log("OpenAPI JSON written to docs/openapi.json");
    await app.close();
    process.exit(0);
  }

  // ── Pre-populate spec registry from OPENAPI_SPECS env var ──────────────────
  // Format: JSON array of RegisterSpecDto objects.
  // Example: [{"id":"petstore","label":"Petstore","url":"https://...","ttlMs":3600000}]
  const specsEnv = process.env.OPENAPI_SPECS;
  if (specsEnv) {
    const registry = app.get(SpecRegistryService);
    let entries: RegisterSpecDto[] = [];
    try {
      entries = JSON.parse(specsEnv) as RegisterSpecDto[];
    } catch {
      logger.error("OPENAPI_SPECS is not valid JSON — skipping pre-population");
    }
    for (const entry of entries) {
      try {
        if (entry.url) {
          await registry.addFromUrl(entry.id, entry.label, entry.url, entry.ttlMs);
        } else if (entry.content) {
          registry.addFromPayload(entry.id, entry.label, entry.content);
        }
      } catch (err: unknown) {
        logger.error(`Failed to pre-load spec "${entry.id}": ${String(err)}`);
      }
    }
  }

  const isDevMode = process.env.DEV_MODE === "true";
  const port = process.env.PORT ?? (isDevMode ? 8080 : 80);
  app.useLogger(["log", "error", "warn", "debug", "verbose"]);
  await app.listen(port);
  logger.log(`OpenAPI Portal listening on port ${port}`);
}

bootstrap();
