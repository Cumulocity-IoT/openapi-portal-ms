import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NoColorLogger } from "./logger/no-color.logger";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as fs from "fs";
import { name, version } from "../package.json";
import { OpenApiDocumentService } from "./api/ai/openapi-document.service";

async function bootstrap() {
  // Use a logger that strips ANSI colors so logs are plain text (no color codes).
  const logger = new NoColorLogger();
  const app = await NestFactory.create(AppModule, { logger });

  if (process.env.DEV_MODE === "true") {
    const target = process.env.C8Y_BASEURL;
    const tenant = process.env.C8Y_TENANT;
    const user = process.env.C8Y_USER;
    const password = process.env.C8Y_PASSWORD;

    if (!target || !tenant || !user || !password) {
      logger.warn(
        "DEV_MODE proxy is enabled, but C8Y_BASEURL, C8Y_TENANT, C8Y_USER, or C8Y_PASSWORD is missing. Proxy will not be mounted.",
      );
    } else {
      const { createProxyMiddleware } = await import("http-proxy-middleware");
      const authorization = `Basic ${Buffer.from(`${tenant}/${user}:${password}`).toString("base64")}`;

      app.use(
        "/proxy",
        createProxyMiddleware({
          target,
          changeOrigin: true,
          pathRewrite: { "^/proxy": "" },
          on: {
            proxyReq: (proxyReq) => {
              proxyReq.setHeader("Authorization", authorization);
            },
          },
        }),
      );
      logger.log(`DEV_MODE proxy enabled at /proxy -> ${target}`);
    }
  }

  if (process.env.GENERATE_API_DOCS === "true") {
    const config = new DocumentBuilder()
      .setTitle("Gainsight Sync Microservice API")
      .setDescription(
        "A NestJS microservice that periodically pulls Gainsight PX telemetry " +
          "(custom events, session events, page views, active-user metrics) from configured tenant domains, " +
          "caches the data in memory per tenant using a date-sorted array with binary-search range queries, " +
          "and exposes REST endpoints consumed by dashboards such as Grafana.\n\n" +
          "All data endpoints require `Authorization: Basic <base64(user:password)>` and a `tenantId` query parameter. " +
          "Public endpoints: `/health`, `/lastRun`, `/llms.txt`, `/llms-full.txt`.\n\n" +
          "Interactive docs: https://gainsight.eu-latest.cumulocity.com/apps/gainsight-c8y-openapi/index.html",
      )
      .setVersion(version)
      .addServer(`https://gainsight.eu-latest.cumulocity.com/service/${name}`)
      .addBasicAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    fs.writeFileSync("./docs/openapi.json", JSON.stringify(document, null, 2));
    console.log("✅ OpenAPI JSON generated successfully at ./openapi.json");

    await app.close();
    process.exit(0); // Exit the process immediately
  }

  const isDevMode = process.env.DEV_MODE === "true";
  const port = process.env.PORT || (isDevMode ? 8080 : 80);

  // Wire the live app instance into the service so /openapi.json can be
  // generated lazily on first request and cached thereafter.
  const openApiDocument = app.get(OpenApiDocumentService);
  openApiDocument.setApp(app);

  // Ensure common levels are enabled
  app.useLogger(["log", "error", "warn", "debug", "verbose"]);
  await app.listen(port);
}

bootstrap();
