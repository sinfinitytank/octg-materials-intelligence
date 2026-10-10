import { describe, expect, it } from 'vitest';
import type { Quotation } from '../../src/types';
import {
  calculateQuotation,
  compareQuotations,
  normalizedPricePerTonne,
  validateQuotation,
} from '../../src/services/costs';
const quote: Quotation = {
  schemaVersion: 1,
  id: 'quote-1',
  materialId: 'test-1',
  supplier: 'Test supplier',
  currency: 'USD',
  unit: 'tonne',
  unitPrice: 1000,
  date: '2026-10-10',
  commercialBasis: 'EXW stated mill',
  size: '88.9 × 6.45 mm',
  quantity: 10,
  lengthM: 12,
  nominalWeightKgM: 15,
  allowancePercent: 10,
};
describe('quotation dimensional arithmetic and terms', () => {
  it('uses kg/m, length per pipe and quantity exactly once', () => {
    const result = calculateQuotation(quote);
    expect(result.massTonnes).toBeCloseTo(1.8);
    expect(result.total).toBeCloseTo(1980);
  });
  it('normalizes kg and tonne quotations consistently', () =>
    expect(calculateQuotation({ ...quote, unit: 'kg', unitPrice: 1 }).total).toBeCloseTo(
      calculateQuotation(quote).total,
    ));
  it('normalizes m and ft dimensional prices consistently', () => {
    expect(calculateQuotation({ ...quote, unit: 'm', unitPrice: 20 }).total).toBeCloseTo(
      calculateQuotation({ ...quote, unit: 'ft', unitPrice: 20 * 0.3048 }).total,
    );
    expect(normalizedPricePerTonne({ ...quote, unit: 'm', unitPrice: 15 })).toBeCloseTo(1000);
  });
  it('length-price totals do not fabricate mass', () => {
    const result = calculateQuotation({
      ...quote,
      unit: 'm',
      unitPrice: 20,
      nominalWeightKgM: null,
    });
    expect(result.massTonnes).toBeNull();
    expect(result.total).toBeCloseTo(2640);
  });
  it('requires weight for mass-priced totals', () =>
    expect(() => calculateQuotation({ ...quote, nominalWeightKgM: null })).toThrow(/weight/));
  it.each(['currency', 'commercialBasis', 'size', 'date'] as const)(
    'blocks incompatible %s comparisons',
    (field) => {
      const replacement = {
        currency: 'EUR',
        commercialBasis: 'FOB port',
        size: 'different size',
        date: '2026-09-01',
      }[field];
      expect(compareQuotations(quote, { ...quote, [field]: replacement }).comparable).toBe(false);
    },
  );
  it('allows compatible prices in different units with explicit nominal weight', () =>
    expect(compareQuotations(quote, { ...quote, unit: 'kg', unitPrice: 1 }).comparable).toBe(true));
  it('does not compare incompatible mass and length units without weight', () =>
    expect(
      compareQuotations({ ...quote, unit: 'm', nominalWeightKgM: null }, quote).comparable,
    ).toBe(false));
  it.each([
    { quantity: 0 },
    { lengthM: -1 },
    { unitPrice: Infinity },
    { allowancePercent: -5 },
    { nominalWeightKgM: 0 },
    { date: '2026-02-30' },
    { commercialBasis: '' },
  ])('rejects invalid quote %j', (patch) =>
    expect(validateQuotation({ ...quote, ...patch }).length).toBeGreaterThan(0),
  );
  it('does not let numeric overflow produce a comparable quotation', () =>
    expect(compareQuotations({ ...quote, unitPrice: Number.MAX_VALUE }, quote).comparable).toBe(
      false,
    ));
});
