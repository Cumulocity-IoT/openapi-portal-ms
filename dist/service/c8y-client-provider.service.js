"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var C8yClientProviderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.C8yClientProviderService = void 0;
const client_1 = require("@c8y/client");
const common_1 = require("@nestjs/common");
require("dotenv/config");
let C8yClientProviderService = C8yClientProviderService_1 = class C8yClientProviderService {
    constructor() {
        this.logger = new common_1.Logger(C8yClientProviderService_1.name);
        this.baseUrl = process.env.C8Y_BASEURL;
        this.bootstrapTenant = process.env.C8Y_BOOTSTRAP_TENANT;
        this.bootstrapUser = process.env.C8Y_BOOTSTRAP_USER;
        this.bootstrapPassword = process.env.C8Y_BOOTSTRAP_PASSWORD;
    }
    async client() {
        if (!this.bootstrapUser || !this.bootstrapPassword) {
            this.logger.error('No Bootstrap credentials available!');
        }
        if (this.bootstrapClient) {
            return this.bootstrapClient;
        }
        this.bootstrapClient = await client_1.Client.getMicroserviceSubscriptions({
            tenant: this.bootstrapTenant,
            user: this.bootstrapUser,
            password: this.bootstrapPassword,
        }, this.baseUrl).then((users) => {
            if (!users.length) {
                return Promise.reject('Microservice gainsight-sync-ms is not subscribed!');
            }
            const [user] = users;
            return client_1.Client.authenticate(user, this.baseUrl);
        }, (error) => {
            this.logger.error('Failed to fetch microservice subscriptions', error);
            return Promise.reject();
        });
        return this.bootstrapClient;
    }
};
exports.C8yClientProviderService = C8yClientProviderService;
exports.C8yClientProviderService = C8yClientProviderService = C8yClientProviderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], C8yClientProviderService);
//# sourceMappingURL=c8y-client-provider.service.js.map