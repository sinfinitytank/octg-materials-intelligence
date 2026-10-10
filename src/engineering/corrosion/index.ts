import type { Material, WellScenario } from '../../types';
export function evaluateEnvironment(material: Material, well: WellScenario) {
  const reasons: string[] = [];
  const cautions: string[] = [];
  const missing: string[] = [];
  for (const [key, label] of [
    ['operatingPressureMPa', 'Operating absolute pressure'],
    ['h2sMPa', 'H₂S partial pressure'],
    ['co2MPa', 'CO₂ partial pressure'],
    ['operatingTemperatureC', 'Operating temperature'],
    ['minTemperatureC', 'Minimum temperature'],
    ['maxTemperatureC', 'Maximum temperature'],
  ] as const)
    if (well[key] === null) missing.push(label);
  if (well.freeWater === 'unknown') missing.push('Free-water presence');
  if (well.elementalSulfur === 'unknown') missing.push('Elemental-sulfur presence');
  if (well.freeWater === 'yes') {
    if (well.chlorideMgL === null) missing.push('Aqueous chloride concentration');
    if (well.pH === null) missing.push('Aqueous pH');
  }
  if (missing.length) reasons.push(`Environmental inputs are unknown: ${missing.join(', ')}.`);
  const needsQualification =
    well.freeWater === 'yes' ||
    (well.h2sMPa ?? 0) > 0 ||
    (well.co2MPa ?? 0) > 0 ||
    well.elementalSulfur === 'yes';
  if (needsQualification && !material.properties.environmentalEnvelope)
    reasons.push(
      'No applicable, verified environmental qualification envelope is supplied for this material and well. Further qualification is required.',
    );
  if ((well.h2sMPa ?? 0) > 0)
    cautions.push(
      `H₂S is present (${well.h2sMPa} MPa partial pressure). Review the applicable ISO 15156 part, product condition, hardness and full environmental limits; no H₂S acceptance threshold is inferred.`,
    );
  if ((well.co2MPa ?? 0) > 0)
    cautions.push(
      `CO₂ is present (${well.co2MPa} MPa partial pressure). No corrosion rate or CO₂ service limit is calculated; water chemistry, flow and mitigation need evaluation.`,
    );
  if (well.freeWater === 'yes')
    cautions.push(
      `Wet environment: chloride ${well.chlorideMgL ?? 'unknown'} mg/L and pH ${well.pH ?? 'unknown'}. No pitting, crevice corrosion or cracking threshold is inferred from alloy family.`,
    );
  if (well.elementalSulfur === 'yes')
    cautions.push(
      'Elemental sulfur requires an explicit materials and environmental qualification review.',
    );
  cautions.push(
    `Temperature input: ${well.minTemperatureC ?? '?'} to ${well.maxTemperatureC ?? '?'} °C. Manufacturer temperature limits and strength derating are unavailable; temperature suitability has not been assessed.`,
  );
  cautions.push(
    `Source service text: ${material.service || 'not provided'}. H₂S designation: ${material.h2s || 'not provided'}. CO₂ designation: ${material.co2 || 'not provided'}. These statements are context, not operating envelopes.`,
  );
  return { missing: missing.length > 0, needsQualification, reasons, cautions };
}
