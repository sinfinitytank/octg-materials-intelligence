import type { Material, WellScenario } from '../../types';
export const RANKING_EXPLANATION =
  'Preference points describe information availability and stated user preferences. They are not performance, probability of suitability, qualification or compliance scores. Relative cost tiers are source ordinal categories, not prices.';
export function dataCompleteness(material: Material): number {
  const fields = [
    material.yieldMinMPa,
    material.uns,
    material.source.url,
    material.properties.tensileMinMPa,
    material.properties.yieldMaxMPa,
    material.properties.hardness,
    material.properties.heatTreatment,
    material.properties.environmentalEnvelope,
    material.properties.elongationPercent,
    Object.values(material.properties.chemistry).some((v) => v !== null && v !== '') ? true : null,
  ];
  return Math.round(
    (fields.filter((value) => value !== null && value !== '').length / fields.length) * 100,
  );
}
export function preferenceRanking(material: Material, well: WellScenario) {
  const factors: { label: string; points: number }[] = [];
  const completeness = dataCompleteness(material);
  factors.push({
    label: `Information availability ${completeness}% (verification tracked separately)`,
    points: completeness / 10,
  });
  if (well.preferredManufacturer && well.preferredManufacturer === material.manufacturer)
    factors.push({ label: 'Preferred manufacturer match', points: 15 });
  if (well.preferredFamily && well.preferredFamily === material.family)
    factors.push({ label: 'Preferred material family match', points: 10 });
  if (new RegExp(`\\b${well.application}\\b`, 'i').test(material.application))
    factors.push({
      label: 'Source application text matches requested application (unverified)',
      points: 3,
    });
  const tier = material.costTier?.match(/^([A-I])\b/)?.[1];
  const budget = well.maxCostTier.match(/^([A-I])\b/)?.[1];
  if (tier && budget && tier <= budget)
    factors.push({
      label: `Within requested ordinal cost tier (${tier} ≤ ${budget}); not a price comparison`,
      points: well.costPriority === 'high' ? 10 : well.costPriority === 'balanced' ? 5 : 2,
    });
  return {
    score: Number(factors.reduce((sum, factor) => sum + factor.points, 0).toFixed(2)),
    factors,
  };
}
