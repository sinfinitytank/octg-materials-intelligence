import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseDataset } from '../../src/data/schema';
import { loadDataset } from '../../src/data/load';

const supplied = JSON.parse(readFileSync(resolve('public/data/materials.json'), 'utf8'));
describe('migrated dataset integrity', () => {
  it('accounts for every supplied ID without granting verification', () => {
    const dataset = parseDataset(supplied);
    expect(dataset.materials).toHaveLength(450);
    expect(new Set(dataset.materials.map((m) => m.id)).size).toBe(450);
    expect(dataset.materials.every((m) => m.source.verification === 'unverified')).toBe(true);
    expect(dataset.materials.every((m) => m.properties.environmentalEnvelope === null)).toBe(true);
    expect(dataset.materials.every((m) => m.properties.tensileMinMPa === null)).toBe(true);
    expect(dataset.materials.filter((m) => m.manufacturer === 'API reference')).toHaveLength(64);
    expect(dataset.materials.filter((m) => m.pricing.lowUSDPerTonne !== null)).toHaveLength(6);
    expect(dataset.materials.filter((m) => m.pricing.vendorUSDPerTonne !== null)).toHaveLength(0);
  });
  it('preserves source rows and distinguishes zero from unknown', () => {
    const dataset = parseDataset(supplied);
    const first = dataset.materials[0];
    expect(first.raw.ID).toBe(first.id);
    expect(first.raw.Supplier).toBe(first.manufacturer);
    expect(first.raw.Grade).toBe(first.grade);
    expect(first.source.row).toBe(2);
    expect(first.yieldMinMPa).toBeCloseTo(110 * 6.894757293168, 3);
    expect(dataset.materials.some((m) => m.yieldMinMPa === null)).toBe(true);
    expect(dataset.materials.every((m) => m.properties.hardness === null)).toBe(true);
  });
  it('rejects duplicate IDs, inconsistent units and malformed records', () => {
    expect(() =>
      parseDataset({ ...supplied, materials: [supplied.materials[0], supplied.materials[0]] }),
    ).toThrow();
    expect(() => parseDataset({ ...supplied, schemaVersion: 999 })).toThrow();
    expect(() =>
      parseDataset({ ...supplied, materials: [{ ...supplied.materials[0], yieldMinMPa: 110 }] }),
    ).toThrow();
    expect(() =>
      parseDataset({
        ...supplied,
        materials: [
          {
            ...supplied.materials[0],
            source: { ...supplied.materials[0].source, url: 'javascript:alert(1)' },
          },
        ],
      }),
    ).toThrow();
    expect(() =>
      parseDataset({
        ...supplied,
        materials: [
          {
            ...supplied.materials[0],
            properties: {
              ...supplied.materials[0].properties,
              environmentalEnvelope: { invented: true },
            },
          },
        ],
      }),
    ).toThrow();
  });
});
describe('browser data loading', () => {
  it('loads and validates a successful static response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => supplied }));
    const result = await loadDataset();
    expect(result.materials).toHaveLength(450);
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/data\/materials\.json$/), {
      signal: undefined,
    });
    vi.unstubAllGlobals();
  });
  it('exposes HTTP and schema failures instead of inventing fallback records', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(loadDataset()).rejects.toThrow('HTTP 404');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ materials: [] }) }),
    );
    await expect(loadDataset()).rejects.toThrow('validation failed');
    vi.unstubAllGlobals();
  });
});
