import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from "@nestjs/common";
import { Request } from "express";
import { DevModeService } from "../service/dev-mode.service";

/**
 * Verifies the caller is an authenticated Cumulocity user via GET /user/currentUser.
 *
 * Follows MicroserviceClientRequestAuth pattern (cumulocity-ui SDK):
 *   OAI-Secure: `authorization` cookie → Authorization: Bearer <jwt>  +  X-XSRF-TOKEN
 *   Basic Auth / Bearer header: forwarded as-is
 *   X-Forwarded-Host is always forwarded for SSO tenant resolution (MTM-66206).
 *
 * In DEV_MODE the guard always passes.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(private devMode: DevModeService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.devMode.isDevModeEnabled()) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();

    this.logger.debug(
      `[guard] ${req.method} ${req.path} | ` +
        `cookie=${req.headers["cookie"] ? "present" : "absent"} | ` +
        `authorization=${req.headers["authorization"] ? "present" : "absent"} | ` +
        `x-forwarded-host=${req.headers["x-forwarded-host"] ?? "(none)"} | ` +
        `C8Y_BASEURL=${process.env.C8Y_BASEURL ?? "(not set)"}`,
    );

    const forwardHeaders = this.extractCredentialHeaders(req);

    if (!forwardHeaders) {
      this.logger.warn("[guard] No usable credentials found in request — denying");
      throw new UnauthorizedException("Missing Cumulocity credentials (Basic Auth or OAI-Secure cookie)");
    }

    const baseUrl = this.resolveBaseUrl(req);
    this.logger.debug(`[guard] Calling ${baseUrl}/user/currentUser with Authorization=${forwardHeaders["Authorization"]?.slice(0, 20)}...`);

    const verified = await this.verifyWithCumulocity(baseUrl, forwardHeaders);
    if (!verified) {
      this.logger.warn("[guard] /user/currentUser rejected credentials — denying");
      throw new UnauthorizedException("Cumulocity credential verification failed");
    }

    this.logger.debug("[guard] Credentials verified — allowing");
    return true;
  }

  /**
   * Builds headers for the server-to-server /user/currentUser call.
   *
   * Priority (mirrors MicroserviceClientRequestAuth from cumulocity-ui):
   *  1. `authorization` cookie → Authorization: Bearer <jwt>  (OAI-Secure / SSO)
   *  2. Authorization: Bearer <token> header   (already a bearer token)
   *  3. Authorization: Basic <base64> header   (Basic Auth)
   *
   * X-XSRF-TOKEN (from XSRF-TOKEN cookie) and X-Forwarded-Host are added when present.
   */
  private extractCredentialHeaders(req: Request): Record<string, string> | null {
    const forwardedHost = req.headers["x-forwarded-host"] as string | undefined;
    const hostHeaders: Record<string, string> = forwardedHost ? { "X-Forwarded-Host": forwardedHost } : {};

    const cookie = req.headers["cookie"] as string | undefined;
    if (cookie) {
      const jwt = this.parseCookieValue(cookie, "authorization");
      const xsrf = this.parseCookieValue(cookie, "XSRF-TOKEN");
      if (jwt) {
        this.logger.debug(`[guard] Using OAI-Secure cookie (jwt len=${jwt.length}, xsrf=${xsrf ? "present" : "absent"})`);
        return {
          Authorization: `Bearer ${jwt}`,
          ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
          ...hostHeaders,
        };
      }
    }

    const authHeader = req.headers["authorization"] as string | undefined;
    if (authHeader?.startsWith("Bearer ") || authHeader?.startsWith("Basic ")) {
      this.logger.debug(`[guard] Using Authorization header (${authHeader.split(" ")[0]})`);
      return { Authorization: authHeader, ...hostHeaders };
    }

    return null;
  }

  private parseCookieValue(cookieHeader: string, name: string): string | undefined {
    return cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1];
  }

  private resolveBaseUrl(req: Request): string {
    if (process.env.C8Y_BASEURL) {
      return process.env.C8Y_BASEURL.replace(/\/$/, "");
    }
    const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
    // x-forwarded-host may include a non-standard port (e.g. :444) added by the
    // Cumulocity gateway — strip it so the verification call uses standard HTTPS.
    const rawHost = (req.headers["x-forwarded-host"] as string) ?? (req.headers["host"] as string);
    const host = rawHost?.split(":")[0] ?? rawHost;
    return `${proto}://${host}`;
  }

  private async verifyWithCumulocity(baseUrl: string, headers: Record<string, string>): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl}/user/currentUser`, { method: "GET", headers });
      this.logger.debug(`[guard] /user/currentUser → ${res.status}`);
      if (res.status !== 200) {
        this.logger.warn(`[guard] /user/currentUser returned ${res.status} — body: ${await res.text().catch(() => "")}`);
      }
      return res.status === 200;
    } catch (err) {
      this.logger.error(`[guard] fetch to /user/currentUser failed: ${String(err)}`);
      return false;
    }
  }
}
