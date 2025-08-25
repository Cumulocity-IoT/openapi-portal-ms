import { Client, IIdentified, IManagedObject, IMeasurement, ITenantOption } from '@c8y/client';
export declare class APIService {
    client: Client;
    fetchOrbDevices(): Promise<Array<IManagedObject>>;
    updateDevice(device: IIdentified, update: any): Promise<import("@c8y/client").IResult<IManagedObject>>;
    private fetchBoreholes;
    private fetchVentingWells;
    fetchMeasurements(dates: {
        dateFrom: string;
        dateTo: string;
    }, source: string, datapoint: string): Promise<IMeasurement[]>;
    fetchLatestMeasurement(datapoint: string, source: string): Promise<IMeasurement | undefined>;
    fetchAllMeasurements(client: Client, filter: object, MAX_PAGES?: number): Promise<IMeasurement[]>;
    fetchSupportedSeries(device: IManagedObject): Promise<string[]>;
    createTenantOption(option: ITenantOption): Promise<import("@c8y/client").IResult<ITenantOption>>;
    getTenantOption(option: ITenantOption): Promise<import("@c8y/client").IResult<ITenantOption>>;
}
