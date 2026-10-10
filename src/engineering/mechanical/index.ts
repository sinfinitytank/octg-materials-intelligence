import type { Material, WellScenario } from '../../types';
/** Imported MPa values have six decimal places. This only resolves conversion rounding, never a design margin. */
export const YIELD_NUMERICAL_PRECISION_MPA = 0.000001;
export function evaluateMechanical(material: Material, well: WellScenario) {
  const reasons: string[] = [];
  const cautions: string[] = [];
  let incompatible = false;
  let missing = false;
  if (well.requiredYieldMPa === null) {
    missing = true;
    reasons.push('Required minimum yield strength is unknown.');
  }
  if (material.yieldMinMPa === null) {
    missing = true;
    reasons.push('Material minimum yield strength is unknown.');
  }
  if (well.requiredYieldMPa !== null && material.yieldMinMPa !== null) {
    incompatible = material.yieldMinMPa + YIELD_NUMERICAL_PRECISION_MPA < well.requiredYieldMPa;
    reasons.push(
      `Source minimum yield ${material.yieldMinMPa.toFixed(1)} MPa ${incompatible ? 'is below' : 'meets the numerical input of'} ${well.requiredYieldMPa.toFixed(1)} MPa. This is a preliminary source-value comparison; 0.000001 MPa numerical precision accounts only for source conversion rounding, not a design allowance.`,
    );
  }
  if (well.collapseRequired)
    cautions.push(
      `${material.collapse === 'enhanced' ? 'An enhanced-collapse designation is listed' : 'No enhanced-collapse designation is listed'}; collapse resistance needs size-specific ratings, tolerances, axial loads and applicable design calculations.`,
    );
  cautions.push(
    'Yield strength alone does not establish burst, collapse, axial, fatigue, connection or combined-load capacity. Temperature derating and product-form applicability have not been established.',
  );
  return { incompatible, missing, reasons, cautions };
}
