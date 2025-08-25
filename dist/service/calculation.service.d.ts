import { APIService } from './api.service';
import { IManagedObject } from '@c8y/client';
export declare class CalculationService {
    private api;
    private readonly logger;
    constructor(api: APIService);
    calculateLatestValue(device: IManagedObject, eligibleDatapoints: string[]): Promise<void>;
    calculateAggregates(device: IManagedObject, eligibleDatapoints: string[]): Promise<void>;
}
