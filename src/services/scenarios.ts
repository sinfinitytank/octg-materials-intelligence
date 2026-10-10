import type { WellScenario } from '../types';

export const DEFAULT_SCENARIO: WellScenario = {
  schemaVersion: 1,
  id: 'illustrative-sweet',
  name: 'Sweet conventional · illustrative',
  application: 'production',
  product: 'tubing',
  location: 'onshore',
  depthM: 2200,
  designLifeYears: 20,
  operatingPressureMPa: 20,
  designPressureMPa: 25,
  operatingTemperatureC: 85,
  maxTemperatureC: 100,
  minTemperatureC: 10,
  internalPressureMPa: 25,
  externalPressureMPa: 10,
  h2sMPa: 0,
  co2MPa: 0.2,
  chlorideMgL: 10000,
  pH: 6,
  freeWater: 'yes',
  elementalSulfur: 'no',
  requiredYieldMPa: 550,
  collapseRequired: false,
  nominalSize: '3½ in',
  outsideDiameterMm: 88.9,
  wallThicknessMm: 6.45,
  otherLoads: '',
  environmentNotes:
    'Illustrative inputs for exercising the workflow; no qualification envelope or validated corrosion prediction is supplied.',
  preferredManufacturer: '',
  preferredFamily: '',
  maxCostTier: '',
  costPriority: 'balanced',
  illustrative: true,
};
export const DEMO_SCENARIOS: WellScenario[] = [
  DEFAULT_SCENARIO,
  {
    ...DEFAULT_SCENARIO,
    id: 'illustrative-co2',
    name: 'High CO₂ · illustrative',
    co2MPa: 4,
    pH: 4.5,
    operatingTemperatureC: 110,
    maxTemperatureC: 130,
  },
  {
    ...DEFAULT_SCENARIO,
    id: 'illustrative-sour',
    name: 'Sour service · illustrative',
    h2sMPa: 0.1,
    co2MPa: 1,
    pH: 4.2,
  },
  {
    ...DEFAULT_SCENARIO,
    id: 'illustrative-hpht',
    name: 'High pressure / temperature · illustrative',
    operatingPressureMPa: 80,
    designPressureMPa: 100,
    internalPressureMPa: 100,
    externalPressureMPa: 50,
    operatingTemperatureC: 175,
    maxTemperatureC: 200,
    requiredYieldMPa: 760,
    depthM: 5000,
  },
  {
    ...DEFAULT_SCENARIO,
    id: 'illustrative-collapse',
    name: 'High collapse · illustrative',
    product: 'casing',
    collapseRequired: true,
    externalPressureMPa: 35,
    outsideDiameterMm: 177.8,
    wallThicknessMm: 10.36,
    nominalSize: '7 in',
  },
  {
    ...DEFAULT_SCENARIO,
    id: 'illustrative-chloride',
    name: 'High chloride · illustrative',
    chlorideMgL: 150000,
    operatingTemperatureC: 130,
    maxTemperatureC: 150,
    co2MPa: 2,
  },
  {
    ...DEFAULT_SCENARIO,
    id: 'illustrative-unknown',
    name: 'Incomplete environment · illustrative',
    h2sMPa: null,
    co2MPa: null,
    chlorideMgL: null,
    pH: null,
    freeWater: 'unknown',
    elementalSulfur: 'unknown',
  },
];

const numericFields = [
  'depthM',
  'designLifeYears',
  'operatingPressureMPa',
  'designPressureMPa',
  'operatingTemperatureC',
  'maxTemperatureC',
  'minTemperatureC',
  'internalPressureMPa',
  'externalPressureMPa',
  'h2sMPa',
  'co2MPa',
  'chlorideMgL',
  'pH',
  'requiredYieldMPa',
  'outsideDiameterMm',
  'wallThicknessMm',
] as const;
const strings = [
  'id',
  'name',
  'nominalSize',
  'otherLoads',
  'environmentNotes',
  'preferredManufacturer',
  'preferredFamily',
  'maxCostTier',
] as const;
const choices = {
  application: ['production', 'injection', 'exploration'],
  product: ['tubing', 'casing'],
  location: ['onshore', 'offshore'],
  freeWater: ['yes', 'no', 'unknown'],
  elementalSulfur: ['yes', 'no', 'unknown'],
  costPriority: ['low', 'balanced', 'high'],
};
export function validateScenario(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return ['A well scenario must be an object.'];
  const s = value as Record<string, unknown>;
  const errors: string[] = [];
  if (s.schemaVersion !== 1) errors.push('Unsupported scenario schema version.');
  for (const field of strings)
    if (typeof s[field] !== 'string') errors.push(`${field} must be text.`);
  if (typeof s.name === 'string' && !s.name.trim()) errors.push('A scenario name is required.');
  if (typeof s.id === 'string' && !s.id.trim()) errors.push('A scenario identifier is required.');
  for (const [field, allowed] of Object.entries(choices))
    if (!allowed.includes(s[field] as string)) errors.push(`${field} has an invalid value.`);
  for (const field of ['collapseRequired', 'illustrative'])
    if (typeof s[field] !== 'boolean') errors.push(`${field} must be true or false.`);
  for (const field of numericFields) {
    const n = s[field];
    if (n !== null && (typeof n !== 'number' || !Number.isFinite(n))) {
      errors.push(`${field} must be a finite number or unknown.`);
      continue;
    }
    if (typeof n === 'number') {
      if (field.includes('Temperature') ? n < -273.15 : n < 0)
        errors.push(`${field} is outside its physical range.`);
      if (
        ['designLifeYears', 'outsideDiameterMm', 'wallThicknessMm', 'requiredYieldMPa'].includes(
          field,
        ) &&
        n === 0
      )
        errors.push(`${field} must be positive when provided.`);
      if (field === 'pH' && (n < 0 || n > 14))
        errors.push('pH must be between 0 and 14 for this input model.');
    }
  }
  const pair = (a: string, b: string, message: string) => {
    if (typeof s[a] === 'number' && typeof s[b] === 'number' && s[a] > s[b]) errors.push(message);
  };
  pair(
    'operatingPressureMPa',
    'designPressureMPa',
    'Design pressure must be at least operating pressure.',
  );
  pair(
    'operatingTemperatureC',
    'maxTemperatureC',
    'Maximum temperature must be at least operating temperature.',
  );
  pair(
    'minTemperatureC',
    'operatingTemperatureC',
    'Minimum temperature must not exceed operating temperature.',
  );
  pair(
    'minTemperatureC',
    'maxTemperatureC',
    'Minimum temperature must not exceed maximum temperature.',
  );
  for (const field of ['h2sMPa', 'co2MPa'])
    pair(field, 'operatingPressureMPa', `${field} must not exceed operating absolute pressure.`);
  if (
    typeof s.h2sMPa === 'number' &&
    typeof s.co2MPa === 'number' &&
    typeof s.operatingPressureMPa === 'number' &&
    s.h2sMPa + s.co2MPa > s.operatingPressureMPa
  )
    errors.push('The sum of partial pressures must not exceed operating absolute pressure.');
  if (
    typeof s.outsideDiameterMm === 'number' &&
    typeof s.wallThicknessMm === 'number' &&
    s.wallThicknessMm * 2 >= s.outsideDiameterMm
  )
    errors.push('Twice wall thickness must be less than outside diameter.');
  return errors;
}
