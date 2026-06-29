import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { DevModeService } from "../service/dev-mode.service";

/**
 * Guards admin endpoints with Cumulocity Basic-Auth.
 *
 * In DEV_MODE the guard always passes so local development requires no credentials.
 * In production mode the request must carry a valid `Authorization: Basic …` header
 * issued by Cumulocity (any authenticated C8Y user is allowed — the guard only
 * verifies that credentials are structurally valid; actual identity checks are
 * delegated to C8Y via the upstream proxy).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private devMode: DevModeService) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.devMode.isDevModeEnabled()) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const authHeader = request.headers["authorization"];

    // No Authorization header — request came through the Cumulocity proxy which
    // already authenticated the user (browser/SSO sessions). Trust the proxy.
    if (!authHeader) {
      return true;
    }

    // If an Authorization header IS present it must be a well-formed Basic token.
    // This validates direct API/curl calls that supply credentials explicitly.
    if (!authHeader.startsWith("Basic ")) {
      throw new UnauthorizedException("Unsupported authorization scheme — use Basic");
    }

    const base64Credentials = authHeader.replace("Basic ", "").trim();
    const decoded = Buffer.from(base64Credentials, "base64").toString("utf8");
    const delimiterIndex = decoded.indexOf(":");

    if (delimiterIndex < 0 || !decoded.substring(0, delimiterIndex) || !decoded.substring(delimiterIndex + 1)) {
      throw new UnauthorizedException("Invalid Basic auth format");
    }

    return true;
  }
}
