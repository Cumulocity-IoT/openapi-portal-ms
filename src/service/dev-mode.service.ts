import { Injectable } from "@nestjs/common";

@Injectable()
export class DevModeService {
  isDevModeEnabled(): boolean {
    return process.env.DEV_MODE === "true";
  }

  getDevModeDomain() {
    const url = process.env.DEV_MODE_DOMAIN_URL;
    const id = process.env.DEV_MODE_DOMAIN_ID;

    return { url, id };
  }
}
