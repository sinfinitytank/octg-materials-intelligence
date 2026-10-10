import type { Material } from '../types';
import { YIELD_NUMERICAL_PRECISION_MPA } from '../engineering/mechanical';
export interface MaterialFilters {
  search?: string;
  manufacturer?: string;
  family?: string;
  specification?: string;
  listingType?: string;
  h2s?: string;
  collapse?: string;
  costTier?: string;
  minYieldMPa?: number | null;
  maxYieldMPa?: number | null;
  minYield?: number | null;
  maxYield?: number | null;
}
export function filterMaterials(materials: Material[], filters: MaterialFilters = {}): Material[] {
  const terms = filters.search?.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean) ?? [];
  return materials.filter((material) => {
    const searchable = [
      material.id,
      material.grade,
      material.manufacturer,
      material.uns,
      material.specification,
      material.family,
      material.service,
      material.application,
      material.notes,
    ]
      .join(' ')
      .toLocaleLowerCase();
    if (!terms.every((term) => searchable.includes(term))) return false;
    for (const key of [
      'manufacturer',
      'family',
      'specification',
      'listingType',
      'h2s',
      'costTier',
    ] as const)
      if (filters[key] && material[key] !== filters[key]) return false;
    if (filters.collapse && filters.collapse !== material.collapse) return false;
    const min = filters.minYieldMPa ?? filters.minYield;
    const max = filters.maxYieldMPa ?? filters.maxYield;
    if (
      min != null &&
      (material.yieldMinMPa === null || material.yieldMinMPa + YIELD_NUMERICAL_PRECISION_MPA < min)
    )
      return false;
    if (
      max != null &&
      (material.yieldMinMPa === null || material.yieldMinMPa - YIELD_NUMERICAL_PRECISION_MPA > max)
    )
      return false;
    return true;
  });
}
export function searchMaterials(materials: Material[], search: string): Material[] {
  return filterMaterials(materials, { search });
}
