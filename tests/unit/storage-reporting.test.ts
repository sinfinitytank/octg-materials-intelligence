import { describe, expect, it } from 'vitest';
import { DEFAULT_SCENARIO } from '../../src/services/scenarios';
import { loadScenarios, saveScenarios, SCENARIOS_STORAGE_KEY } from '../../src/services/storage';
import {
  csvCell,
  toCSV,
  materialsCSV,
  comparisonCSV,
  shortlistCSV,
  engineeringSummaryHTML,
  scenarioJSON,
} from '../../src/reporting';
import { screenMaterial } from '../../src/engineering/selection';
import { material } from './material-fixture';
function memoryStore() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}
const meta = {
  appVersion: '1.0.0',
  dataVersion: 'source-sha-test',
  analysisDate: '2026-10-10T10:00:00Z',
};
describe('versioned defensive local scenario storage', () => {
  it('round trips canonical units and schema version', () => {
    const store = memoryStore();
    expect(saveScenarios([DEFAULT_SCENARIO], store).ok).toBe(true);
    expect(loadScenarios(store).scenarios).toEqual([DEFAULT_SCENARIO]);
  });
  it('preserves unreadable or unknown future documents', () => {
    const store = memoryStore();
    const original = '{"schemaVersion":9,"scenarios":[]}';
    store.setItem(SCENARIOS_STORAGE_KEY, original);
    expect(loadScenarios(store).errors.length).toBe(1);
    expect(store.getItem(SCENARIOS_STORAGE_KEY)).toBe(original);
    store.setItem(SCENARIOS_STORAGE_KEY, '{broken');
    expect(loadScenarios(store).errors.length).toBe(1);
  });
  it.each(['', '{broken', '{"schemaVersion":9,"scenarios":[]}'])(
    'prevents overwriting unreadable stored scenario data %s',
    (raw) => {
      const store = memoryStore();
      store.setItem(SCENARIOS_STORAGE_KEY, raw);
      expect(saveScenarios([DEFAULT_SCENARIO], store).ok).toBe(false);
      expect(store.getItem(SCENARIOS_STORAGE_KEY)).toBe(raw);
    },
  );
  it('loads valid entries while reporting malformed entries', () => {
    const store = memoryStore();
    store.setItem(
      SCENARIOS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        scenarios: [DEFAULT_SCENARIO, { ...DEFAULT_SCENARIO, id: 'invalid', pH: 99 }],
      }),
    );
    expect(loadScenarios(store).scenarios).toHaveLength(1);
    expect(loadScenarios(store).errors).toHaveLength(1);
  });
  it('rejects invalid or duplicate scenarios before replacing the stored document', () => {
    const store = memoryStore();
    saveScenarios([DEFAULT_SCENARIO], store);
    const original = store.getItem(SCENARIOS_STORAGE_KEY);
    expect(saveScenarios([DEFAULT_SCENARIO, DEFAULT_SCENARIO], store).ok).toBe(false);
    expect(store.getItem(SCENARIOS_STORAGE_KEY)).toBe(original);
  });
  it('reports blocked storage gracefully', () => {
    const store = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('full');
      },
    };
    expect(loadScenarios(store).errors).toHaveLength(1);
    expect(saveScenarios([DEFAULT_SCENARIO], store).ok).toBe(false);
  });
});
describe('traceable safe exports', () => {
  it.each(['=HYPERLINK("bad")', '+cmd', '-cmd', '@SUM(A1)', '  =A1', '\t=A1', '\r=A1'])(
    'neutralizes spreadsheet formula %j',
    (value) => expect(csvCell(value).startsWith('"\'')).toBe(true),
  );
  it('quotes commas, unicode, embedded quotes and newlines', () =>
    expect(toCSV([['H₂S, °C', 'a"b\nc']])).toBe('\uFEFF"H₂S, °C","a""b\nc"\r\n'));
  it('reports source and application versions without inventing data', () => {
    const csv = materialsCSV([material], meta);
    expect(csv).toContain('source-sha-test');
    expect(csv).toContain('unverified');
    expect(csv).toContain('test.csv');
  });
  it('exports full side-by-side comparison with source/converted labels and explicit unknowns', () => {
    const csv = comparisonCSV(
      [
        material,
        { ...material, id: 'other', properties: { ...material.properties, tensileMinMPa: 850 } },
      ],
      meta,
    );
    expect(csv).toContain('"Comparison field","test-1","other"');
    expect(csv).toContain('"Minimum tensile MPa · source, unverified","Unknown","850"');
    expect(csv).toContain('"Chemical composition · source, unverified","Unknown","Unknown"');
    expect(csv).toContain('Minimum yield MPa · converted from source ksi');
    expect(csv).toContain('Verified environmental qualification envelope · unavailable');
    expect(csv).toContain('not a verification date');
  });
  it('includes well conditions, explanations and limits in shortlist exports', () => {
    const csv = shortlistCSV([screenMaterial(material, DEFAULT_SCENARIO)], DEFAULT_SCENARIO, meta);
    expect(csv).toContain('operatingPressureMPa');
    expect(csv).toContain('Further qualification required');
    expect(csv).toContain('Preference points');
  });
  it('escapes user-entered HTML in printable reports', () => {
    const html = engineeringSummaryHTML(
      { ...DEFAULT_SCENARIO, name: '<script>alert(1)</script>' },
      [screenMaterial(material, DEFAULT_SCENARIO)],
      meta,
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('source-sha-test');
  });
  it('exports a versioned scenario with exact nulls', () =>
    expect(
      JSON.parse(scenarioJSON({ ...DEFAULT_SCENARIO, h2sMPa: null })).scenario.h2sMPa,
    ).toBeNull());
  it('includes dataset provenance and unit basis in scenario exports', () => {
    const exported = JSON.parse(scenarioJSON(DEFAULT_SCENARIO, meta));
    expect(exported.dataVersion).toBe(meta.dataVersion);
    expect(exported.appVersion).toBe(meta.appVersion);
    expect(exported.canonicalUnits.pressure).toBe('MPa absolute');
  });
});
