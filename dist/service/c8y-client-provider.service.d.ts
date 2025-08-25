import { Client } from '@c8y/client';
import 'dotenv/config';
export declare class C8yClientProviderService {
    private readonly baseUrl;
    private readonly bootstrapTenant;
    private readonly bootstrapUser;
    private readonly bootstrapPassword;
    private readonly logger;
    private bootstrapClient;
    constructor();
    client(): Promise<Client>;
}
