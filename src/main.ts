import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NoColorLogger } from "./logger/no-color.logger";

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

  const isDevMode = process.env.DEV_MODE === "true";
  const port = process.env.PORT || (isDevMode ? 8080 : 80);

  // Ensure common levels are enabled
  app.useLogger(["log", "error", "warn", "debug", "verbose"]);
  await app.listen(port);
}

bootstrap();
