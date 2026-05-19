import { UnauthorizedException } from "@nestjs/common";
import { TenantGuard } from "./tenant.guard";

describe("TenantGuard", () => {
  const mockConfigService = {
    getDomainsForUser: jest.fn(),
  };
  const mockDevModeService = {
    isDevModeEnabled: jest.fn(),
  };

  const guard = new TenantGuard(mockConfigService as any, mockDevModeService as any);

  beforeEach(() => {
    jest.clearAllMocks();
    mockDevModeService.isDevModeEnabled.mockReturnValue(false);
  });

  it("should allow Basic auth when password contains colon", async () => {
    mockConfigService.getDomainsForUser.mockResolvedValue([{ id: "tenant-1", url: "https://example.com" }]);

    const credentials = "user:pass:with:colon";
    const authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: authHeader },
          query: { tenantId: "tenant-1" },
        }),
      }),
    };

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(mockConfigService.getDomainsForUser).toHaveBeenCalledWith("user");
  });

  it("should throw UnauthorizedException when decoded credentials have no colon", () => {
    const credentials = "userpass";
    const authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: authHeader },
          query: { tenantId: "tenant-1" },
        }),
      }),
    };

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
