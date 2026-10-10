import type { WellScenario } from '../types';
import { validateScenario } from './scenarios';
export const SCENARIOS_STORAGE_KEY = 'octg.scenarios.v1';
type Store = Pick<Storage, 'getItem' | 'setItem'>;
function browserStore(): Store | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
export function loadScenarios(store: Store | undefined = browserStore()): {
  scenarios: WellScenario[];
  errors: string[];
} {
  if (!store) return { scenarios: [], errors: ['Local storage is unavailable.'] };
  try {
    const raw = store.getItem(SCENARIOS_STORAGE_KEY);
    if (raw === null) return { scenarios: [], errors: [] };
    const document = JSON.parse(raw) as { schemaVersion?: number; scenarios?: unknown };
    if (!document || document.schemaVersion !== 1 || !Array.isArray(document.scenarios))
      return {
        scenarios: [],
        errors: [
          'Saved scenarios have an unsupported document format; stored data has been preserved.',
        ],
      };
    const scenarios: WellScenario[] = [];
    const errors: string[] = [];
    const ids = new Set<string>();
    for (const [index, candidate] of document.scenarios.entries()) {
      const issues = validateScenario(candidate);
      if (issues.length)
        errors.push(`Saved scenario ${index + 1} was not loaded: ${issues.join(' ')}`);
      else if (ids.has((candidate as WellScenario).id))
        errors.push(`Saved scenario ${index + 1} has a duplicate identifier and was not loaded.`);
      else {
        scenarios.push(candidate as WellScenario);
        ids.add((candidate as WellScenario).id);
      }
    }
    return { scenarios, errors };
  } catch {
    return {
      scenarios: [],
      errors: ['Saved scenarios could not be read; stored data has been preserved.'],
    };
  }
}
export function saveScenarios(
  scenarios: WellScenario[],
  store: Store | undefined = browserStore(),
): { ok: boolean; errors: string[] } {
  const errors = scenarios.flatMap((s, i) =>
    validateScenario(s).map((error) => `Scenario ${i + 1}: ${error}`),
  );
  if (new Set(scenarios.map((s) => s.id)).size !== scenarios.length)
    errors.push('Scenario identifiers must be unique.');
  if (!store) errors.push('Local storage is unavailable.');
  if (errors.length) return { ok: false, errors };
  const existing = loadScenarios(store);
  if (existing.errors.length)
    return {
      ok: false,
      errors: [
        ...existing.errors,
        'Existing scenario storage has been preserved. Resolve the stored-data errors before saving or deleting scenarios.',
      ],
    };
  try {
    store!.setItem(
      SCENARIOS_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, savedAt: new Date().toISOString(), scenarios }),
    );
    return { ok: true, errors: [] };
  } catch {
    return { ok: false, errors: ['Scenarios could not be saved; storage may be blocked or full.'] };
  }
}
