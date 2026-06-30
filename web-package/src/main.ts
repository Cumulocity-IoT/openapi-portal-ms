import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NoColorLogger } from "./logger/no-color.logger";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as fs from "fs";
import { version } from "../package.json";

async function bootstrap() {
  const logger = new NoColorLogger();
  const app = await NestFactory.create(AppModule, { logger });

  // Health endpoint required by the Cumulocity liveness/readiness probes
  app.getHttpAdapter().get("/health", (_req, res) => res.json({ status: "UP" }));

  const config = new DocumentBuilder()
    .setTitle("swagger-sample-ms API")
    .setDescription(
      "A NestJS proof-of-concept demonstrating how to derive OpenAPI documentation from a microservice " +
        "using Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiQuery`, `@ApiParam`, `@ApiBody`, `@ApiResponse`, `@ApiProperty`).\n\n" +
        "All endpoints require `Authorization: Basic <base64(user:password)>`.",
    )
    .setVersion(version)
    .addBasicAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  if (process.env.GENERATE_API_DOCS === "true") {
    fs.writeFileSync("./docs/openapi.json", JSON.stringify(document, null, 2));
    console.log("✅ OpenAPI JSON generated successfully at ./docs/openapi.json");
    await app.close();
    process.exit(0);
  }

  SwaggerModule.setup("api-docs", app, document);

  const isDevMode = process.env.DEV_MODE === "true";
  const port = process.env.PORT || (isDevMode ? 3000 : 80);
  app.useLogger(["log", "error", "warn", "debug", "verbose"]);
  await app.listen(port);
  logger.log(`Application running on port ${port} — Swagger UI at http://localhost:${port}/api-docs`);
}

bootstrap();
