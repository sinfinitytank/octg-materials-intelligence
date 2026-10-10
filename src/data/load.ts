import { parseDataset } from './schema';
import type { Dataset } from '../types';

export async function loadDataset(signal?: AbortSignal): Promise<Dataset> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/materials.json`, { signal });
  if (!response.ok)
    throw new Error(
      `Material database could not be loaded (HTTP ${response.status}). Try reloading the application.`,
    );
  try {
    return parseDataset(await response.json());
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('Material database validation failed. Please contact the project maintainer.');
  }
}
