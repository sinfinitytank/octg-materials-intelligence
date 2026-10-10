import type { Quotation } from '../types';
import { calculateQuotation, normalizedPricePerTonne, validateQuotation } from './costs';

export const QUOTATIONS_STORAGE_KEY = 'octg.quotations.v1';
type Store = Pick<Storage, 'getItem' | 'setItem'>;
export interface StoredQuotations {
  quotes: Quotation[];
  error: string;
  legacyFormat?: boolean;
}
function browserStore(): Store | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
function quotationErrors(values: unknown[], materialIds?: Iterable<string>): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const materials = materialIds === undefined ? undefined : new Set(materialIds);
  for (const [index, value] of values.entries()) {
    const quote = value as Quotation;
    const issues = validateQuotation(quote);
    if (issues.length) {
      errors.push(`Quotation ${index + 1}: ${issues.join(' ')}`);
      continue;
    }
    if (ids.has(quote.id)) errors.push(`Quotation ${index + 1}: duplicate identifier ${quote.id}.`);
    ids.add(quote.id);
    if (materials && !materials.has(quote.materialId))
      errors.push(
        `Quotation ${index + 1}: material ${quote.materialId} is absent from the current dataset.`,
      );
    try {
      calculateQuotation(quote);
      normalizedPricePerTonne(quote);
    } catch (error) {
      errors.push(
        `Quotation ${index + 1}: ${error instanceof Error ? error.message : 'Calculation failed.'}`,
      );
    }
  }
  return errors;
}
const preserved =
  'Existing quotation storage has been preserved. Saves and deletions are disabled to avoid overwriting it.';
export function loadQuotations(
  materialIds?: Iterable<string>,
  store: Store | undefined = browserStore(),
): StoredQuotations {
  if (!store) return { quotes: [], error: `Local quotation storage is unavailable. ${preserved}` };
  try {
    const raw = store.getItem(QUOTATIONS_STORAGE_KEY);
    if (raw === null) return { quotes: [], error: '' };
    const document: unknown = JSON.parse(raw);
    let values: unknown[];
    let legacyFormat = false;
    if (Array.isArray(document)) {
      values = document;
      legacyFormat = true;
    } else if (
      document &&
      typeof document === 'object' &&
      'schemaVersion' in document &&
      document.schemaVersion === 1 &&
      'quotations' in document &&
      Array.isArray(document.quotations)
    )
      values = document.quotations;
    else
      return {
        quotes: [],
        error: `Unsupported quotation document format or version. ${preserved}`,
      };
    const errors = quotationErrors(values, materialIds);
    if (errors.length) return { quotes: [], error: `${errors.join(' ')} ${preserved}` };
    return { quotes: values as Quotation[], error: '', legacyFormat };
  } catch {
    return { quotes: [], error: `Local quotation storage could not be read. ${preserved}` };
  }
}
/** A valid legacy array is migrated to a versioned envelope only after an explicit successful save. */
export function saveQuotations(
  quotes: Quotation[],
  materialIds?: Iterable<string>,
  store: Store | undefined = browserStore(),
): { ok: boolean; error: string } {
  if (!store)
    return { ok: false, error: 'Local quotation storage is unavailable; nothing was saved.' };
  // Material sets can be one-shot iterators, so stabilize before checking both old and new documents.
  const materials = materialIds === undefined ? undefined : [...materialIds];
  const previous = loadQuotations(materials, store);
  if (previous.error) return { ok: false, error: previous.error };
  const errors = quotationErrors(quotes, materials);
  if (errors.length) return { ok: false, error: `${errors.join(' ')} Nothing was saved.` };
  try {
    store.setItem(
      QUOTATIONS_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, savedAt: new Date().toISOString(), quotations: quotes }),
    );
    return { ok: true, error: '' };
  } catch {
    return {
      ok: false,
      error:
        'Quotations could not be saved; local storage may be blocked or full. Existing data has not been replaced.',
    };
  }
}
