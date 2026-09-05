import { z } from 'zod';

export const stopSchema = z.object({
  id: z.string(),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
});

export const columnMappingSchema = z.object({
  title: z.string(),
  start: z.string(),
  end: z.string(),
  location: z.string(),
  description: z.string(),
});

export const configSchema = z.object({
  version: z.literal(1),
  admin: z.object({
    passwordHash: z.string().nullable(),
  }),
  facility: z.object({
    address: z.string(),
    lat: z.number().nullable(),
    lon: z.number().nullable(),
  }),
  transit: z.object({
    refreshIntervalSeconds: z.number().int().positive(),
    selectedStops: z.array(stopSchema),
  }),
  graph: z.object({
    tenantId: z.string(),
    clientId: z.string(),
    clientSecretEncrypted: z.string().nullable(),
    siteId: z.string().nullable(),
    siteName: z.string().nullable(),
    listId: z.string().nullable(),
    listName: z.string().nullable(),
    columnMapping: columnMappingSchema.nullable(),
    refreshIntervalSeconds: z.number().int().positive(),
  }),
});

export type AppConfig = z.infer<typeof configSchema>;

export const defaultConfig: AppConfig = {
  version: 1,
  admin: { passwordHash: null },
  facility: { address: '', lat: null, lon: null },
  transit: { refreshIntervalSeconds: 60, selectedStops: [] },
  graph: {
    tenantId: '',
    clientId: '',
    clientSecretEncrypted: null,
    siteId: null,
    siteName: null,
    listId: null,
    listName: null,
    columnMapping: null,
    refreshIntervalSeconds: 300,
  },
};
