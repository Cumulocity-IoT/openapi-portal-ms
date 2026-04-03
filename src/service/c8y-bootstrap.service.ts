import { Client, ICredentials, IMicroserviceSubscription } from "@c8y/client";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class C8yBootstrapService {
  private readonly logger = new Logger(C8yBootstrapService.name);

  async resolveBootstrapCredentials(): Promise<IMicroserviceSubscription> {
    const baseUrl = process.env.C8Y_BASEURL;
    const tenant = process.env.C8Y_TENANT;
    const user = process.env.C8Y_USER;
    const password = process.env.C8Y_PASSWORD;
    const appName = process.env.C8Y_MICROSERVICE_NAME || "gainsight-sync-ms";

    if (!baseUrl || !tenant || !user || !password) {
      throw new Error(
        "Missing C8Y_BASEURL, C8Y_TENANT, C8Y_USER, or C8Y_PASSWORD for bootstrap credential lookup.",
      );
    }

    const credentials: ICredentials = { tenant, user, password };
    const client = await Client.authenticate(credentials, baseUrl);

    const app = await this.findMicroserviceApplication(client, appName);
    if (!app?.id) {
      throw new Error(`Microservice application '${appName}' was not found.`);
    }

    this.logger.log(
      `Found microservice application '${appName}' with id ${app.id}`,
    );
    const { data } = await client.application.getBootstrapUser(app.id);

    if (!data?.tenant || !data?.name || !data?.password) {
      throw new Error(
        `Bootstrap credentials for application '${appName}' are incomplete.`,
      );
    }

    return data;
  }

  private async findMicroserviceApplication(client: Client, appName: string) {
    const result = await client.application.list({
      pageSize: 2000,
      withTotalPages: false,
    });
    return result.data.find((application) => application.name === appName);
  }
}
