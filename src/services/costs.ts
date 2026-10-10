import type { Quotation } from '../types';

export function validateQuotation(q: Quotation): string[] {
  const errors: string[] = [];
  if (!q || typeof q !== 'object') return ['Quotation must be an object.'];
  if (q.schemaVersion !== 1) errors.push('Unsupported quotation schema version.');
  for (const key of ['id', 'materialId', 'supplier', 'commercialBasis', 'size'] as const)
    if (typeof q[key] !== 'string' || !q[key].trim()) errors.push(`${key} is required.`);
  if (typeof q.currency !== 'string' || !/^[A-Z]{3}$/.test(q.currency))
    errors.push('Currency must use a three-letter uppercase code.');
  if (!['tonne', 'kg', 'm', 'ft'].includes(q.unit)) errors.push('Unsupported price unit.');
  if (
    typeof q.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(q.date) ||
    !Number.isFinite(Date.parse(q.date)) ||
    new Date(q.date).toISOString().slice(0, 10) !== q.date
  )
    errors.push('A valid quotation date is required (YYYY-MM-DD).');
  for (const key of ['unitPrice', 'quantity', 'lengthM', 'allowancePercent'] as const)
    if (!Number.isFinite(q[key]) || q[key] < 0)
      errors.push(`${key} must be a finite nonnegative number.`);
  if (q.quantity <= 0 || !Number.isInteger(q.quantity))
    errors.push('Quantity must be a positive integer number of pipe lengths.');
  if (q.lengthM <= 0) errors.push('Length per pipe must be positive in m.');
  if (
    q.nominalWeightKgM !== null &&
    (!Number.isFinite(q.nominalWeightKgM) || q.nominalWeightKgM <= 0)
  )
    errors.push('Nominal weight must be positive in kg/m or unknown.');
  if (['tonne', 'kg'].includes(q.unit) && q.nominalWeightKgM === null)
    errors.push('A mass-priced quotation requires nominal pipe weight in kg/m.');
  return errors;
}
export function calculateQuotation(q: Quotation): {
  total: number;
  massTonnes: number | null;
  assumptions: string[];
} {
  const errors = validateQuotation(q);
  if (errors.length) throw new Error(errors.join(' '));
  const totalLengthM = q.quantity * q.lengthM;
  const massTonnes =
    q.nominalWeightKgM === null ? null : (totalLengthM * q.nominalWeightKgM) / 1000;
  const pricedUnits =
    q.unit === 'tonne'
      ? massTonnes!
      : q.unit === 'kg'
        ? massTonnes! * 1000
        : q.unit === 'ft'
          ? totalLengthM / 0.3048
          : totalLengthM;
  const total = pricedUnits * q.unitPrice * (1 + q.allowancePercent / 100);
  if (!Number.isFinite(total) || (massTonnes !== null && !Number.isFinite(massTonnes)))
    throw new Error('Quotation calculation exceeds the supported numeric range.');
  return {
    total,
    massTonnes,
    assumptions: [
      `Quantity is ${q.quantity} pipe lengths, each ${q.lengthM} m; total length ${totalLengthM} m.`,
      massTonnes === null
        ? 'Mass is unknown; a length-priced total is calculated without estimating density or weight.'
        : `Mass uses the user-entered nominal weight ${q.nominalWeightKgM} kg/m; no density or geometry-based estimate is substituted.`,
      `Unit price ${q.unitPrice} ${q.currency}/${q.unit}; allowance ${q.allowancePercent}% applied once to the base material total.`,
      `Quotation ${q.date}; commercial basis: ${q.commercialBasis}; size: ${q.size}.`,
      'Indicative user quotation calculation only. Taxes, freight, connections and other charges are included only to the extent explicitly covered by the stated price or allowance. No exchange-rate conversion is performed.',
    ],
  };
}
export function normalizedPricePerTonne(q: Quotation): number | null {
  const errors = validateQuotation(q);
  if (errors.length) throw new Error(errors.join(' '));
  if (['m', 'ft'].includes(q.unit) && q.nominalWeightKgM === null) return null;
  const normalized =
    q.unit === 'tonne'
      ? q.unitPrice
      : q.unit === 'kg'
        ? q.unitPrice * 1000
        : (q.unitPrice * (q.unit === 'ft' ? 1 / 0.3048 : 1) * 1000) / q.nominalWeightKgM!;
  if (!Number.isFinite(normalized))
    throw new Error('Normalized price exceeds the supported numeric range.');
  return normalized;
}
export function compareQuotations(
  a: Quotation,
  b: Quotation,
): { comparable: boolean; reasons: string[] } {
  const reasons = [
    ...validateQuotation(a).map((v) => `First quotation: ${v}`),
    ...validateQuotation(b).map((v) => `Second quotation: ${v}`),
  ];
  if (reasons.length) return { comparable: false, reasons };
  try {
    calculateQuotation(a);
    calculateQuotation(b);
    normalizedPricePerTonne(a);
    normalizedPricePerTonne(b);
  } catch (error) {
    return {
      comparable: false,
      reasons: [error instanceof Error ? error.message : 'Quotation calculation failed.'],
    };
  }
  for (const [key, label] of [
    ['currency', 'Currencies'],
    ['commercialBasis', 'Commercial terms'],
    ['size', 'Sizes'],
    ['date', 'Quotation dates'],
    ['quantity', 'Quantities'],
    ['lengthM', 'Lengths per pipe'],
    ['allowancePercent', 'Allowance bases'],
  ] as const)
    if (a[key] !== b[key])
      reasons.push(`${label} differ; normalize explicitly before comparing totals.`);
  if (
    a.unit !== b.unit &&
    (normalizedPricePerTonne(a) === null || normalizedPricePerTonne(b) === null)
  )
    reasons.push('Price units differ and nominal weight is missing for mass/length normalization.');
  return { comparable: reasons.length === 0, reasons };
}
