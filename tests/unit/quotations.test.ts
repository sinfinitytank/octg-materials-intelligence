import { describe, expect, it } from 'vitest';
import type { Quotation } from '../../src/types';
import {
  loadQuotations,
  saveQuotations,
  QUOTATIONS_STORAGE_KEY,
} from '../../src/services/quotations';
const quote: Quotation = {
  schemaVersion: 1,
  id: 'q1',
  materialId: 'm1',
  supplier: 'User supplier',
  currency: 'USD',
  unit: 'tonne',
  unitPrice: 1000,
  date: '2026-10-10',
  commercialBasis: 'EXW supplier',
  size: '88.9 × 6.45 mm',
  quantity: 10,
  lengthM: 12,
  nominalWeightKgM: 15,
  allowancePercent: 5,
};
function memoryStore(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: (_key: string) => value,
    setItem: (_key: string, replacement: string) => {
      value = replacement;
    },
  };
}
describe('defensive quotation persistence', () => {
  it('round trips a versioned document with exact commercial metadata', () => {
    const store = memoryStore();
    expect(saveQuotations([quote], ['m1'], store)).toEqual({ ok: true, error: '' });
    const document = JSON.parse(store.getItem(QUOTATIONS_STORAGE_KEY)!);
    expect(document.schemaVersion).toBe(1);
    expect(document.savedAt).toBeTruthy();
    expect(loadQuotations(['m1'], store).quotes).toEqual([quote]);
  });
  it('reads a valid legacy array without changing it, and migrates on a user save', () => {
    const raw = JSON.stringify([quote]);
    const store = memoryStore(raw);
    expect(loadQuotations(['m1'], store).legacyFormat).toBe(true);
    expect(store.getItem(QUOTATIONS_STORAGE_KEY)).toBe(raw);
    expect(saveQuotations([quote], ['m1'], store).ok).toBe(true);
    expect(Array.isArray(JSON.parse(store.getItem(QUOTATIONS_STORAGE_KEY)!))).toBe(false);
    expect(loadQuotations(['m1'], store).legacyFormat).toBe(false);
  });
  it.each([
    '',
    '{broken',
    'null',
    '{"schemaVersion":2,"quotations":[]}',
    '{"schemaVersion":1,"quotations":{}}',
    JSON.stringify([{ ...quote, unitPrice: Number.MAX_VALUE }]),
    JSON.stringify([{ ...quote, date: '2026-02-30' }]),
    JSON.stringify([quote, quote]),
  ])('preserves invalid, unsupported or unsafe document %s', (raw) => {
    const store = memoryStore(raw);
    const loaded = loadQuotations(['m1'], store);
    expect(loaded.quotes).toEqual([]);
    expect(loaded.error).toContain('preserved');
    expect(saveQuotations([], ['m1'], store).ok).toBe(false);
    expect(store.getItem(QUOTATIONS_STORAGE_KEY)).toBe(raw);
  });
  it('withholds orphaned dataset material IDs without deleting the quote', () => {
    const raw = JSON.stringify([quote]);
    const store = memoryStore(raw);
    expect(loadQuotations(['other-material'], store).error).toContain(
      'absent from the current dataset',
    );
    expect(saveQuotations([], ['other-material'], store).ok).toBe(false);
    expect(store.getItem(QUOTATIONS_STORAGE_KEY)).toBe(raw);
    expect(loadQuotations(undefined, store).quotes).toEqual([quote]);
  });
  it('validates new quotations before replacing a valid stored document', () => {
    const store = memoryStore();
    saveQuotations([quote], ['m1'], store);
    const before = store.getItem(QUOTATIONS_STORAGE_KEY);
    expect(saveQuotations([quote, quote], ['m1'], store).ok).toBe(false);
    expect(saveQuotations([{ ...quote, materialId: 'missing' }], ['m1'], store).ok).toBe(false);
    expect(
      saveQuotations([{ ...quote, unit: 'm', nominalWeightKgM: Number.MIN_VALUE }], ['m1'], store)
        .ok,
    ).toBe(false);
    expect(store.getItem(QUOTATIONS_STORAGE_KEY)).toBe(before);
  });
  it('reports blocked/full storage and never throws to the UI', () => {
    const blocked = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    };
    expect(loadQuotations(['m1'], blocked).quotes).toEqual([]);
    expect(saveQuotations([quote], ['m1'], blocked).ok).toBe(false);
    const full = {
      getItem: () => null,
      setItem() {
        throw new Error('full');
      },
    };
    expect(saveQuotations([quote], ['m1'], full).error).toContain('full');
  });
  it('validates both existing and incoming records with a one-shot material iterator', () => {
    const store = memoryStore(JSON.stringify([quote]));
    const ids = new Set(['m1']).values();
    expect(saveQuotations([quote], ids, store).ok).toBe(true);
  });
});
