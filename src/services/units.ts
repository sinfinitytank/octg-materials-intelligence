/** Canonical dimensions are MPa, °C, mm (diameter), m (length), mg/L and kg/m. */
export type Unit =
  | 'psi'
  | 'bar'
  | 'MPa'
  | 'ksi'
  | 'C'
  | 'F'
  | '°C'
  | '°F'
  | 'mm'
  | 'in'
  | 'm'
  | 'ft'
  | 'mg/L'
  | 'kg/m';
const factors: Partial<Record<Unit, number>> = {
  psi: 0.006894757293168,
  bar: 0.1,
  MPa: 1,
  ksi: 6.894757293168,
  mm: 1,
  in: 25.4,
  m: 1,
  ft: 0.3048,
  'mg/L': 1,
  'kg/m': 1,
};
export function toCanonical(value: number, unit: Unit): number {
  if (!Number.isFinite(value)) throw new Error('Conversion requires a finite number.');
  if (unit === 'F' || unit === '°F') return ((value - 32) * 5) / 9;
  if (unit === 'C' || unit === '°C') return value;
  const factor = factors[unit];
  if (factor === undefined) throw new Error(`Unsupported unit: ${unit}`);
  return value * factor;
}
export function fromCanonical(value: number, unit: Unit): number {
  if (!Number.isFinite(value)) throw new Error('Conversion requires a finite number.');
  if (unit === 'F' || unit === '°F') return (value * 9) / 5 + 32;
  if (unit === 'C' || unit === '°C') return value;
  const factor = factors[unit];
  if (factor === undefined) throw new Error(`Unsupported unit: ${unit}`);
  return value / factor;
}
/** ppm by mass requires solution density; no silent ppm = mg/L assumption. */
export function ppmToMgL(ppmByMass: number, densityKgL: number): number {
  if (
    !Number.isFinite(ppmByMass) ||
    ppmByMass < 0 ||
    !Number.isFinite(densityKgL) ||
    densityKgL <= 0
  )
    throw new Error(
      'Provide a nonnegative mass concentration and positive solution density in kg/L.',
    );
  return ppmByMass * densityKgL;
}
