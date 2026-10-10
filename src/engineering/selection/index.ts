import type { Assessment, Eligibility, Material, WellScenario } from '../../types';
import { validateScenario } from '../../services/scenarios';
import { evaluateMechanical } from '../mechanical';
import { evaluateEnvironment } from '../corrosion';
import { isReferenceListing, materialCautions } from '../metallurgy';
import { dataCompleteness, preferenceRanking, RANKING_EXPLANATION } from '../scoring';

export function screenMaterial(material: Material, well: WellScenario): Assessment {
  const errors = validateScenario(well);
  if (errors.length)
    return {
      material,
      eligibility: 'Insufficient information',
      reasons: [`Scenario validation failed: ${errors.join(' ')}`],
      cautions: [...materialCautions(material), RANKING_EXPLANATION],
      ranking: {
        score: 0,
        factors: [{ label: 'Invalid inputs: preference ranking withheld', points: 0 }],
      },
      completeness: dataCompleteness(material),
    };
  const mechanical = evaluateMechanical(material, well);
  const environment = evaluateEnvironment(material, well);
  const reference = isReferenceListing(material);
  const reasons = [...mechanical.reasons, ...environment.reasons];
  if (reference)
    reasons.push(
      'Generic standard or alloy-family reference listing: a specific manufacturer product, condition and applicable properties must be identified.',
    );
  let eligibility: Eligibility;
  if (mechanical.incompatible) eligibility = 'Mechanical incompatibility';
  else if (mechanical.missing || environment.missing || reference)
    eligibility = 'Insufficient information';
  else if (environment.needsQualification || well.collapseRequired)
    eligibility = 'Further qualification required';
  else eligibility = 'Potential technical candidate';
  if (eligibility === 'Potential technical candidate')
    reasons.push(
      'No numerical yield shortfall was found for the entered dry-service inputs. This preliminary candidate status does not establish environmental, temperature or design suitability.',
    );
  return {
    material,
    eligibility,
    reasons,
    cautions: [
      ...new Set([
        ...mechanical.cautions,
        ...environment.cautions,
        ...materialCautions(material),
        RANKING_EXPLANATION,
      ]),
    ],
    ranking: preferenceRanking(material, well),
    completeness: dataCompleteness(material),
  };
}
const order: Record<Eligibility, number> = {
  'Potential technical candidate': 0,
  'Further qualification required': 1,
  'Insufficient information': 2,
  'Mechanical incompatibility': 3,
};
export function screenMaterials(materials: Material[], well: WellScenario): Assessment[] {
  return materials
    .map((material) => screenMaterial(material, well))
    .sort(
      (a, b) =>
        order[a.eligibility] - order[b.eligibility] ||
        b.ranking.score - a.ranking.score ||
        a.material.id.localeCompare(b.material.id),
    );
}
