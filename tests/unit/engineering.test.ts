import { describe, expect, it } from 'vitest';
import type { WellScenario } from '../../src/types';
import { screenMaterial, screenMaterials } from '../../src/engineering/selection';
import { DEFAULT_SCENARIO, DEMO_SCENARIOS, validateScenario } from '../../src/services/scenarios';
import { filterMaterials, searchMaterials } from '../../src/services/materials';
import { toCanonical } from '../../src/services/units';

import { material } from './material-fixture';
describe('conservative engineering screening', () => {
  it.each(DEMO_SCENARIOS.map((s) => [s.name, s] as const))(
    '%s never yields an unverified qualified result',
    (_name, scenario) => {
      expect(validateScenario(scenario)).toEqual([]);
      const result = screenMaterial({ ...material, yieldMinMPa: 900 }, scenario);
      expect(['Further qualification required', 'Insufficient information']).toContain(
        result.eligibility,
      );
      expect(result.eligibility).not.toMatch(/safe|compliant|qualified/i);
      expect(result.cautions.join(' ')).toContain('unverified');
    },
  );
  it('a known source yield shortfall has priority over commercial preference', () => {
    const well = {
      ...DEFAULT_SCENARIO,
      preferredManufacturer: material.manufacturer,
      maxCostTier: 'I',
      costPriority: 'high' as const,
    };
    const weak = { ...material, id: 'weak', yieldMinMPa: 300 };
    const strong = { ...material, id: 'strong', manufacturer: 'Other supplier' };
    const results = screenMaterials([weak, strong], well);
    expect(results[0].material.id).toBe('strong');
    expect(results[1].eligibility).toBe('Mechanical incompatibility');
    expect(results[1].ranking.score).toBeGreaterThan(results[0].ranking.score);
  });
  it('unknown yield is never zero or a strength pass', () =>
    expect(screenMaterial({ ...material, yieldMinMPa: null }, DEFAULT_SCENARIO).eligibility).toBe(
      'Insufficient information',
    ));
  it('does not classify six-decimal imported yield as lower than the same converted ksi input', () => {
    const result = screenMaterial(
      { ...material, yieldMinMPa: 551.580583 },
      { ...DEFAULT_SCENARIO, requiredYieldMPa: toCanonical(80, 'ksi') },
    );
    expect(result.eligibility).toBe('Further qualification required');
    expect(result.reasons.join(' ')).toContain('not a design allowance');
    expect(
      screenMaterial(
        { ...material, yieldMinMPa: 551.580583 },
        { ...DEFAULT_SCENARIO, requiredYieldMPa: 551.581 },
      ).eligibility,
    ).toBe('Mechanical incompatibility');
  });
  it('unknown required strength is held', () =>
    expect(
      screenMaterial(material, { ...DEFAULT_SCENARIO, requiredYieldMPa: null }).eligibility,
    ).toBe('Insufficient information'));
  it.each(['API baseline', 'Proprietary family', 'Generic alloy reference'])(
    'holds %s listings',
    (listingType) =>
      expect(screenMaterial({ ...material, listingType }, DEFAULT_SCENARIO).eligibility).toBe(
        'Insufficient information',
      ),
  );
  it('holds API reference categories even if the listing label differs', () =>
    expect(
      screenMaterial(
        { ...material, manufacturer: 'API reference', listingType: 'Grade / category' },
        DEFAULT_SCENARIO,
      ).eligibility,
    ).toBe('Insufficient information'));
  it('an enhanced collapse designation never establishes a collapse rating', () => {
    const result = screenMaterial(
      { ...material, collapse: 'enhanced' },
      { ...DEFAULT_SCENARIO, collapseRequired: true },
    );
    expect(result.eligibility).toBe('Further qualification required');
    expect(result.cautions.join(' ')).toContain('size-specific ratings');
  });
  it('only a narrowly scoped dry input is a potential candidate, with qualification caveats', () => {
    const result = screenMaterial(material, {
      ...DEFAULT_SCENARIO,
      freeWater: 'no',
      h2sMPa: 0,
      co2MPa: 0,
      chlorideMgL: null,
      pH: null,
    });
    expect(result.eligibility).toBe('Potential technical candidate');
    expect(result.reasons.join(' ')).toContain(
      'does not establish environmental, temperature or design suitability',
    );
  });
  it('preserves inferred-property source limitations', () =>
    expect(screenMaterial(material, DEFAULT_SCENARIO).cautions).toContain(material.limitations[0]));
  it('recognizes all source ordinal cost tiers including I', () => {
    const result = screenMaterial(
      { ...material, costTier: 'I · nickel alloy' },
      { ...DEFAULT_SCENARIO, maxCostTier: 'I · nickel alloy' },
    );
    expect(result.ranking.factors.some((f) => f.label.includes('ordinal cost tier'))).toBe(true);
  });
  it('malformed input cannot run a preference ranking', () => {
    const invalid = {
      ...DEFAULT_SCENARIO,
      freeWater: 'invalid',
      maxCostTier: undefined,
    } as unknown as WellScenario;
    const result = screenMaterial(material, invalid);
    expect(result.eligibility).toBe('Insufficient information');
    expect(result.ranking.score).toBe(0);
  });
  it('sorting is deterministic for equal candidates', () =>
    expect(
      screenMaterials(
        [
          { ...material, id: 'b' },
          { ...material, id: 'a' },
        ],
        DEFAULT_SCENARIO,
      ).map((a) => a.material.id),
    ).toEqual(['a', 'b']));
});
describe('well validation', () => {
  it.each([NaN, Infinity, -1])('rejects invalid pressure %s', (pressure) =>
    expect(validateScenario({ ...DEFAULT_SCENARIO, operatingPressureMPa: pressure })).not.toEqual(
      [],
    ),
  );
  it('validates geometry and pressure/temperature crossfields', () => {
    const errors = validateScenario({
      ...DEFAULT_SCENARIO,
      designPressureMPa: 1,
      minTemperatureC: 200,
      maxTemperatureC: 50,
      wallThicknessMm: 50,
    });
    expect(errors.join(' ')).toMatch(/Design pressure/);
    expect(errors.join(' ')).toMatch(/Minimum temperature/);
    expect(errors.join(' ')).toMatch(/Twice wall thickness/);
  });
  it('rejects partial pressures whose sum exceeds absolute operating pressure', () =>
    expect(validateScenario({ ...DEFAULT_SCENARIO, h2sMPa: 12, co2MPa: 12 }).join(' ')).toContain(
      'sum of partial pressures',
    ));
  it('accepts explicitly unknown inputs without silently filling them', () =>
    expect(validateScenario(DEMO_SCENARIOS[6])).toEqual([]));
  it('rejects unsupported document versions and missing numeric fields', () =>
    expect(validateScenario({ schemaVersion: 2 })).not.toEqual([]));
  it('accepts physically meaningful subzero temperature', () =>
    expect(validateScenario({ ...DEFAULT_SCENARIO, minTemperatureC: -20 })).toEqual([]));
});
describe('pure material search and numeric filtering', () => {
  const records = [
    material,
    {
      ...material,
      id: 'other',
      manufacturer: 'Another supplier',
      grade: 'CRA',
      family: 'Nickel alloy',
      uns: 'N06625',
      yieldMinMPa: null,
    },
  ];
  it('searches case-insensitive manufacturer, grade, UNS and specification', () => {
    expect(searchMaterials(records, 'another N06625')[0].id).toBe('other');
    expect(searchMaterials(records, 'api 5ct')).toHaveLength(2);
  });
  it('combines manufacturer and numerical filters without treating unknown as zero', () => {
    expect(
      filterMaterials(records, { manufacturer: material.manufacturer, minYieldMPa: 700 }),
    ).toHaveLength(1);
    expect(filterMaterials(records, { maxYieldMPa: 800 })).toHaveLength(1);
    expect(filterMaterials(records, { minYieldMPa: 0 })).toHaveLength(1);
  });
});
