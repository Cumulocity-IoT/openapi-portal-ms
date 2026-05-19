import { Injectable, INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { name, version } from "../../../package.json";

/**
 * Lazily generates the OpenAPI document the first time `getDocument()` is
 * called and caches the result for all subsequent requests.
 *
 * `setApp` must be called once from `main.ts` with the live `INestApplication`
 * instance before the server starts listening.
 */
@Injectable()
export class OpenApiDocumentService {
  private app: INestApplication | null = null;
  private cachedDocument: Record<string, unknown> | null = null;

  setApp(app: INestApplication): void {
    this.app = app;
  }

  getDocument(): Record<string, unknown> | null {
    if (this.cachedDocument) {
      return this.cachedDocument;
    }
    if (!this.app) {
      return null;
    }
    const config = new DocumentBuilder()
      .setTitle("Gainsight Sync Microservice API")
      .setDescription(
        "A NestJS microservice that periodically pulls Gainsight PX telemetry " +
          "(custom events, session events, page views, active-user metrics) from configured tenant domains, " +
          "caches the data in memory per tenant using a date-sorted array with binary-search range queries, " +
          "and exposes REST endpoints consumed by dashboards such as Grafana.\n\n" +
          "All data endpoints require `Authorization: Basic <base64(user:password)>` and a `tenantId` query parameter. " +
          "Public endpoints: `/health`, `/lastRun`, `/llms.txt`, `/llms-full.txt`, `/openapi.json`, `/robots.txt`, `/.well-known/ai-plugin.json`.",
      )
      .setVersion(version)
      .addServer(`https://gainsight.eu-latest.cumulocity.com/service/${name}`)
      .addBearerAuth()
      .build();
    this.cachedDocument = SwaggerModule.createDocument(this.app, config) as unknown as Record<string, unknown>;
    return this.cachedDocument;
  }
}
