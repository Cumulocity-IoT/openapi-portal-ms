import { BasicAuth, Client, ICredentials } from "@c8y/client";
import { Injectable, Logger } from "@nestjs/common";
import "dotenv/config";
import { DevModeService } from "./dev-mode.service";
import { C8yBootstrapService } from "./c8y-bootstrap.service";

@Injectable()
export class C8yClientProviderService {
  private readonly baseUrl: string;

  private readonly tenant: string;
  private readonly user: string;
  private readonly password: string;

  private readonly bootstrapTenant: string;
  private readonly bootstrapUser: string;
  private readonly bootstrapPassword: string;

  private readonly logger = new Logger(C8yClientProviderService.name);

  constructor(
    private devModeService: DevModeService,
    private bootstrapService: C8yBootstrapService,
  ) {
    this.baseUrl = process.env.C8Y_BASEURL!;

    this.tenant = process.env.C8Y_TENANT!;
    this.user = process.env.C8Y_USER!;
    this.password = process.env.C8Y_PASSWORD!;

    this.bootstrapTenant = process.env.C8Y_BOOTSTRAP_TENANT!;
    this.bootstrapUser = process.env.C8Y_BOOTSTRAP_USER!;
    this.bootstrapPassword = process.env.C8Y_BOOTSTRAP_PASSWORD!;
  }

  get client() {
    if (!this.user || !this.password) {
      this.logger.error("No credentials available!");
    }

    const tenant = this.tenant;
    const auth = new BasicAuth({
      tenant,
      user: this.user,
      password: this.password,
    });

    const fixedBaseURL = this.baseUrl;
    const client = new Client(auth, fixedBaseURL);

    if (tenant) {
      client.core.tenant = tenant;
    }
    client.core.defaultHeaders = Object.assign(client.core.defaultHeaders);
    return client;
  }

  getBootstrapClient() {
    if (this.bootstrapUser && this.bootstrapPassword) {
      return Client.getMicroserviceSubscriptions(
        {
          tenant: this.bootstrapTenant,
          user: this.bootstrapUser,
          password: this.bootstrapPassword,
        },
        this.baseUrl,
      ).then(
        (users) => {
          if (!users.length) {
            return Promise.reject("Microservice swagger-sample-ms is not subscribed!");
          }
          const [user] = users;
          return Client.authenticate(user, this.baseUrl);
        },
        (error) => {
          this.logger.error("Failed to fetch microservice subscriptions", error);
          return Promise.reject();
        },
      );
    } else if (this.devModeService.isDevModeEnabled()) {
      return this.bootstrapService
        .resolveBootstrapCredentials()
        .then((ms) =>
          Client.getMicroserviceSubscriptions(
            {
              tenant: ms.tenant,
              user: ms.name,
              password: ms.password,
            },
            this.baseUrl,
          ),
        )
        .then((users) => {
          if (!users.length) {
            return Promise.reject("Microservice swagger-sample-ms is not subscribed!");
          }
          const [user] = users;
          return Client.authenticate(user, this.baseUrl);
        });
    } else {
      return Promise.reject("No Bootstrap credentials available");
    }
  }

  getUserClient(username: string, password: string): Promise<Client> {
    const user: ICredentials = {
      user: username,
      password: password,
      tenant: this.tenant,
    };
    return Client.authenticate(user, this.baseUrl);
  }
}
