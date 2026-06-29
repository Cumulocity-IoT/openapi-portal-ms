import { Controller, Get, Header, NotFoundException, Param, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Response } from "express";
import { SpecRegistryService } from "../spec/spec-registry.service";
import { SpecSummary } from "../spec/spec.model";

const REDOC_HTML = (specUrl: string, title: string) => `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>body { margin: 0; padding: 0; }</style>
  </head>
  <body>
    <redoc spec-url='${specUrl}'></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc/bundles/redoc.standalone.js"></script>
  </body>
</html>`;

const SWAGGER_HTML = (specUrl: string, title: string) => `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({ url: "${specUrl}", dom_id: '#swagger-ui', presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset], layout: "BaseLayout" });
    </script>
  </body>
</html>`;

@ApiTags("docs")
@Controller()
export class DocController {
  constructor(private readonly registry: SpecRegistryService) {}

  /** Portal index — lists all registered specs with links to Redoc and Swagger UI. */
  @Get("/")
  @Header("Content-Type", "text/html")
  @ApiOperation({ summary: "Portal home — lists all specs" })
  portalIndex(): string {
    const specs = this.registry.getAll();
    const rows = specs.length
      ? specs
          .map(
            (s) => `
        <tr>
          <td>${s.id}</td>
          <td>${s.label}</td>
          <td><a href="/specs/${s.id}/redoc">Redoc</a> &nbsp; <a href="/specs/${s.id}/swagger">Swagger UI</a></td>
          <td>${s.url ?? "<em>uploaded</em>"}</td>
          <td>${s.fetchedAt.toISOString()}</td>
        </tr>`,
          )
          .join("")
      : `<tr><td colspan="5"><em>No specs registered yet. Use POST /admin/specs to add one.</em></td></tr>`;

    return `<!DOCTYPE html>
<html>
<head>
  <title>OpenAPI Portal</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: sans-serif; margin: 2rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: .5rem 1rem; text-align: left; }
    th { background: #f4f4f4; }
    a { color: #0072c6; }
  </style>
</head>
<body>
  <h1>OpenAPI Portal</h1>
  <table>
    <thead><tr><th>ID</th><th>Label</th><th>Docs</th><th>Source URL</th><th>Last fetched</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
  }

  /** JSON list of all registered specs (id + label). */
  @Get("/specs")
  @ApiOperation({ summary: "List all specs (JSON)" })
  @ApiResponse({ status: 200, description: "Array of spec summaries" })
  listSpecs(): SpecSummary[] {
    return this.registry.getAll();
  }

  /** Raw OpenAPI JSON for a specific spec. */
  @Get("/specs/:id/openapi.json")
  @Header("Content-Type", "application/json")
  @ApiOperation({ summary: "Get raw OpenAPI JSON" })
  @ApiResponse({ status: 200, description: "OpenAPI document" })
  @ApiResponse({ status: 404, description: "Spec not found" })
  getSpecJson(@Param("id") id: string): Record<string, unknown> {
    const entry = this.registry.getById(id);
    if (!entry) throw new NotFoundException(`Spec "${id}" not found`);
    return entry.content;
  }

  /** Redoc HTML viewer for a specific spec. */
  @Get("/specs/:id/redoc")
  @ApiOperation({ summary: "Redoc viewer" })
  @ApiResponse({ status: 404, description: "Spec not found" })
  getRedoc(@Param("id") id: string, @Res() res: Response): void {
    const entry = this.registry.getById(id);
    if (!entry) throw new NotFoundException(`Spec "${id}" not found`);
    res.setHeader("Content-Type", "text/html");
    res.send(REDOC_HTML(`/specs/${id}/openapi.json`, entry.label));
  }

  /** Swagger UI viewer for a specific spec. */
  @Get("/specs/:id/swagger")
  @ApiOperation({ summary: "Swagger UI viewer" })
  @ApiResponse({ status: 404, description: "Spec not found" })
  getSwagger(@Param("id") id: string, @Res() res: Response): void {
    const entry = this.registry.getById(id);
    if (!entry) throw new NotFoundException(`Spec "${id}" not found`);
    res.setHeader("Content-Type", "text/html");
    res.send(SWAGGER_HTML(`/specs/${id}/openapi.json`, entry.label));
  }

  /** Plain-text LLM summary — one block per registered spec. */
  @Get("/llms.txt")
  @Header("Content-Type", "text/plain; charset=utf-8")
  @ApiOperation({ summary: "LLM-friendly plain-text summary of all specs" })
  llmsTxt(): string {
    const specs = this.registry.getAll();
    if (!specs.length) return "No specs registered.\n";

    return specs
      .map((s) => {
        const entry = this.registry.getById(s.id)!;
        const info = (entry.content as { info?: { title?: string; description?: string; version?: string } }).info ?? {};
        return [
          `# ${info.title ?? s.label}`,
          info.version ? `> Version: ${info.version}` : "",
          info.description ? `\n${info.description}` : "",
          `\nOpenAPI JSON: /specs/${s.id}/openapi.json`,
          `Interactive docs (Redoc): /specs/${s.id}/redoc`,
          `Interactive docs (Swagger UI): /specs/${s.id}/swagger`,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n---\n\n");
  }

  /** Health check. */
  @Get("/health")
  @ApiOperation({ summary: "Health check" })
  health(): { status: string; specCount: number } {
    return { status: "ok", specCount: this.registry.getAll().length };
  }
}
