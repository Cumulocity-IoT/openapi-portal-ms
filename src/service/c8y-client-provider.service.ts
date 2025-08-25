import { BasicAuth, Client } from '@c8y/client';
import { Injectable, Logger } from '@nestjs/common';
import 'dotenv/config';

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

  constructor() {
    this.baseUrl = process.env.C8Y_BASEURL;

    this.tenant = process.env.C8Y_TENANT;
    this.user = process.env.C8Y_USER;
    this.password = process.env.C8Y_PASSWORD;

    this.bootstrapTenant = process.env.C8Y_BOOTSTRAP_TENANT;
    this.bootstrapUser = process.env.C8Y_BOOTSTRAP_USER;
    this.bootstrapPassword = process.env.C8Y_BOOTSTRAP_PASSWORD;
  }

  get client() {
    if (!this.user || !this.password) {
      this.logger.error('No credentials available!');
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
    if (!this.bootstrapUser || !this.bootstrapPassword) {
      this.logger.error('No Bootstrap credentials available!');
    }
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
          return Promise.reject(
            'Microservice gainsight-sync-ms is not subscribed!',
          );
        }
        const [user] = users;
        return Client.authenticate(user, this.baseUrl);
      },
      (error) => {
        this.logger.error('Failed to fetch microservice subscriptions', error);
        return Promise.reject();
      },
    );
  }
}
