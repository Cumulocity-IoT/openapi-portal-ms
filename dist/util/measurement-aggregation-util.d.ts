import { IMeasurement } from '@c8y/client';
export interface GroupedMeasurements {
    [key: string]: IMeasurement[];
}
export declare function calculateAverageMaxForLast24Hours(data: IMeasurement[], datapoint: string): {
    value: number | undefined;
    time: string;
};
export declare function calculateAverageMaxForLast7Days(data: IMeasurement[], datapoint: string): {
    value: number | undefined;
    time: string;
};
export declare function calculateAverageMaxForLast4Weeks(data: IMeasurement[], datapoint: string): {
    value: number | undefined;
    time: string;
};
export declare function calculatePercentile(data: IMeasurement[], datapoint: string, percentile?: number): {
    value: number | undefined;
    time: string;
};
