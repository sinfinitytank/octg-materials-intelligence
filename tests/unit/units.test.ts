import { describe, expect, it } from 'vitest';
import { toCanonical, fromCanonical, ppmToMgL, type Unit } from '../../src/services/units';
describe('dimensionally consistent conversions', () => {
  it.each([
    ['psi', 145.03773773, 1],
    ['bar', 10, 1],
    ['ksi', 1, 6.894757293168],
    ['F', 212, 100],
    ['in', 1, 25.4],
    ['ft', 1, 0.3048],
  ] as [Unit, number, number][])('%s uses its canonical dimension', (unit, input, output) =>
    expect(toCanonical(input, unit)).toBeCloseTo(output, 7),
  );
  it.each(['psi', 'bar', 'MPa', 'ksi', 'C', 'F', 'mm', 'in', 'm', 'ft', 'mg/L', 'kg/m'] as Unit[])(
    '%s round trips',
    (unit) => expect(fromCanonical(toCanonical(74.2, unit), unit)).toBeCloseTo(74.2, 10),
  );
  it('does not silently convert mass ppm to mg/L without a density basis', () => {
    expect(ppmToMgL(1000, 1.05)).toBe(1050);
    expect(() => ppmToMgL(1000, 0)).toThrow();
  });
  it('rejects nonfinite numbers and unsupported units', () => {
    expect(() => toCanonical(NaN, 'MPa')).toThrow();
    expect(() => toCanonical(1, 'ppm' as Unit)).toThrow();
  });
});
