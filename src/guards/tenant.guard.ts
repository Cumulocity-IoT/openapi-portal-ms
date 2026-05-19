import { Injectable, CanActivate, ExecutionContext, SetMetadata, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { ConfigurationService } from "../service/configuration.service";
import { DevModeService } from "../service/dev-mode.service";

export const PERMISSIONS_KEY = "permissions";
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private configService: ConfigurationService,
    private devMode: DevModeService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    if (this.devMode.isDevModeEnabled()) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      throw new UnauthorizedException("Missing or invalid Authorization header");
    }

    const base64Credentials = authHeader.replace("Basic ", "").trim();
    const decoded = Buffer.from(base64Credentials, "base64").toString("utf8");

    const delimiterIndex = decoded.indexOf(":");
    if (delimiterIndex < 0) {
      throw new UnauthorizedException("Invalid BasicAuth format");
    }

    const username = decoded.substring(0, delimiterIndex);
    const password = decoded.substring(delimiterIndex + 1);

    if (!username || !password) {
      throw new UnauthorizedException("Invalid BasicAuth format");
    }

    const tenantId = request.query.tenantId;
    if (!tenantId || typeof tenantId !== "string" || tenantId.trim() === "") {
      throw new BadRequestException("Missing required query parameter: tenantId");
    }

    return this.configService.getDomainsForUser(username).then(
      (domains) => {
        const domain = domains.find((d) => d.id === tenantId);
        if (!domain) {
          throw new UnauthorizedException("User does not have access to the specified tenant");
        }
        return true;
      },
      () => false,
    );
  }
}
