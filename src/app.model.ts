export const TENANT = {
  DOMAIN: 'main.dm-zz-q.ioee10-cloud.com',
  ID: 't2700',
};
export const REQUIRED_PERMISSION = 'ROLE_GAINSIGHT_READ';

import { z } from 'zod';

// Define the schema for the `value` field
export const GainsightConfigValueSchema = z.array(
  z.object({
    mail: z.string(), // e.g., "schindler.com"
    domains: z.array(
      z.object({
        url: z.string(), // e.g., "main.dm-zz-q.ioee10-cloud.com"
        id: z.string(), // e.g., "t2700"
      })
    ),
  })
);

// Define a TypeScript type from the schema
export type GainsightConfigValue = z.infer<typeof GainsightConfigValueSchema>;

// Function to check if a given response matches the schema
export function isValidGainsightConfigValue(data: unknown): data is GainsightConfigValue {
  const result = GainsightConfigValueSchema.safeParse(data);
  return result.success;
}
