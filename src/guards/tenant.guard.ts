import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from "@nestjs/common";
import { Request } from "express";
import { DevModeService } from "../service/dev-mode.service";

/**
 * Verifies the caller is an authenticated Cumulocity user via GET /user/currentUser.
 *
 *   OAI-Secure: JWT from `authorization` cookie → Authorization: Bearer <jwt>
 *   Basic Auth: Authorization header forwarded as-is
 *
 * X-XSRF-TOKEN is a browser CSRF mechanism not needed for server-to-server calls.
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
    const forwardHeaders = this.extractCredentialHeaders(req);

    if (!forwardHeaders) {
      throw new UnauthorizedException("Missing Cumulocity credentials (Basic Auth or OAI-Secure cookie)");
    }

    const baseUrl = this.resolveBaseUrl(req);
    this.logger.debug(`Verifying credentials at ${baseUrl}/user/currentUser`);

    const verified = await this.verifyWithCumulocity(baseUrl, forwardHeaders);
    if (!verified) {
      throw new UnauthorizedException("Cumulocity credential verification failed");
    }

    return true;
  }

  /**
   * Builds the outgoing verification headers for the server-to-server call to
   * GET /user/currentUser, following the pattern described in MTM-66206:
   *
   *   OAI-Secure: Authorization: Bearer <jwt>  +  X-XSRF-TOKEN  +  X-Forwarded-Host
   *   Basic Auth: Authorization: Basic <base64>  +  X-Forwarded-Host
   *
   * X-Forwarded-Host is required for tenant resolution when using SSO/external
   * tokens — without it, Cumulocity cannot identify the tenant from the request domain.
   */
  private extractCredentialHeaders(req: Request): Record<string, string> | null {
    // X-Forwarded-Host is needed for tenant resolution in SSO/external-token scenarios.
    const forwardedHost = req.headers["x-forwarded-host"] as string | undefined;
    const hostHeaders: Record<string, string> = forwardedHost ? { "X-Forwarded-Host": forwardedHost } : {};

    const cookie = req.headers["cookie"] as string | undefined;

    if (cookie) {
      const jwt = this.parseCookieValue(cookie, "authorization");
      const xsrf = this.parseCookieValue(cookie, "XSRF-TOKEN");

      if (jwt) {
        return {
          Authorization: `Bearer ${jwt}`,
          ...(xsrf ? { "X-XSRF-TOKEN": xsrf } : {}),
          ...hostHeaders,
        };
      }
    }

    const authHeader = req.headers["authorization"] as string | undefined;
    if (authHeader?.startsWith("Basic ")) {
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
    const host = (req.headers["x-forwarded-host"] as string) ?? (req.headers["host"] as string);
    return `${proto}://${host}`;
  }

  private async verifyWithCumulocity(baseUrl: string, headers: Record<string, string>): Promise<boolean> {
    try {
      const res = await fetch(`${baseUrl}/user/currentUser`, { method: "GET", headers });
      if (res.status !== 200) {
        this.logger.warn(`/user/currentUser returned ${res.status}`);
      }
      return res.status === 200;
    } catch (err) {
      this.logger.error(`Auth verification failed: ${String(err)}`);
      return false;
    }
  }
}
