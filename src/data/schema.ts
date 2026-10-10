import { z } from 'zod';
import type { Dataset } from '../types';

const nullableNumber = z.number().finite().nonnegative().nullable();
const nullableText = z.string().nullable();
const sourceUrl = z
  .string()
  .url()
  .refine((url) => /^https?:\/\//.test(url), 'Only HTTP(S) source links are supported')
  .nullable();
export const materialSchema = z
  .object({
    id: z.string().min(1),
    manufacturer: z.string().min(1),
    region: z.string(),
    grade: z.string().min(1),
    listingType: z.string(),
    specification: z.string(),
    family: z.string().min(1),
    service: z.string(),
    application: z.string(),
    h2s: z.string(),
    co2: z.string(),
    collapse: z.enum(['enhanced', 'not-stated']),
    collapseSource: z.string(),
    yieldMinKsi: nullableNumber,
    yieldMinMPa: nullableNumber,
    uns: nullableText,
    craGroup: nullableText,
    craCategory: nullableText,
    costTier: nullableText,
    pricing: z
      .object({
        lowUSDPerTonne: nullableNumber,
        highUSDPerTonne: nullableNumber,
        vendorUSDPerTonne: nullableNumber,
        evidence: z.string(),
      })
      .strict(),
    source: z
      .object({
        url: sourceUrl,
        status: z.string(),
        reviewedAt: nullableText,
        verification: z.literal('unverified'),
        file: z.string(),
        row: z.number().int().min(2),
      })
      .strict(),
    properties: z
      .object({
        yieldMaxMPa: nullableNumber,
        tensileMinMPa: nullableNumber,
        elongationPercent: nullableNumber,
        hardness: nullableText,
        heatTreatment: nullableText,
        chemistry: z.record(z.union([z.string(), z.number().finite(), z.null()])),
        environmentalEnvelope: z.null(),
      })
      .strict(),
    notes: z.string(),
    limitations: z.array(z.string()),
    raw: z.record(z.string()),
  })
  .strict()
  .superRefine((material, ctx) => {
    if ((material.yieldMinKsi === null) !== (material.yieldMinMPa === null))
      ctx.addIssue({
        code: 'custom',
        message: 'Yield source and converted value must share missingness',
      });
    if (
      material.yieldMinKsi !== null &&
      material.yieldMinMPa !== null &&
      Math.abs(material.yieldMinMPa - material.yieldMinKsi * 6.894757293168) > 0.001
    )
      ctx.addIssue({ code: 'custom', message: 'Inconsistent ksi → MPa conversion' });
    if (
      material.pricing.lowUSDPerTonne !== null &&
      material.pricing.highUSDPerTonne !== null &&
      material.pricing.lowUSDPerTonne > material.pricing.highUSDPerTonne
    )
      ctx.addIssue({ code: 'custom', message: 'Price range is inverted' });
  });
export const datasetSchema = z
  .object({
    schemaVersion: z.literal(1),
    dataVersion: z.string().min(1),
    sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
    materials: z.array(materialSchema).min(1),
  })
  .strict()
  .superRefine((dataset, ctx) => {
    if (new Set(dataset.materials.map((material) => material.id)).size !== dataset.materials.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate material identifiers' });
  });
export function parseDataset(value: unknown): Dataset {
  return datasetSchema.parse(value);
}
