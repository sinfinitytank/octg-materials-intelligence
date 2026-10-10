export interface Material {
  id: string;
  manufacturer: string;
  region: string;
  grade: string;
  listingType: string;
  specification: string;
  family: string;
  service: string;
  application: string;
  h2s: string;
  co2: string;
  collapse: 'enhanced' | 'not-stated';
  collapseSource: string;
  yieldMinKsi: number | null;
  yieldMinMPa: number | null;
  uns: string | null;
  craGroup: string | null;
  craCategory: string | null;
  costTier: string | null;
  pricing: {
    lowUSDPerTonne: number | null;
    highUSDPerTonne: number | null;
    vendorUSDPerTonne: number | null;
    evidence: string;
  };
  source: {
    url: string | null;
    status: string;
    reviewedAt: string | null;
    verification: 'unverified';
    file: string;
    row: number;
  };
  properties: {
    yieldMaxMPa: number | null;
    tensileMinMPa: number | null;
    elongationPercent: number | null;
    hardness: string | null;
    heatTreatment: string | null;
    chemistry: Record<string, string | number | null>;
    environmentalEnvelope: null;
  };
  notes: string;
  limitations: string[];
  raw: Record<string, string>;
}

export interface Dataset {
  schemaVersion: 1;
  dataVersion: string;
  sourceSha256: string;
  materials: Material[];
}

export interface WellScenario {
  schemaVersion: 1;
  id: string;
  name: string;
  application: 'production' | 'injection' | 'exploration';
  product: 'tubing' | 'casing';
  location: 'onshore' | 'offshore';
  depthM: number | null;
  designLifeYears: number | null;
  operatingPressureMPa: number | null;
  designPressureMPa: number | null;
  operatingTemperatureC: number | null;
  maxTemperatureC: number | null;
  minTemperatureC: number | null;
  internalPressureMPa: number | null;
  externalPressureMPa: number | null;
  h2sMPa: number | null;
  co2MPa: number | null;
  chlorideMgL: number | null;
  pH: number | null;
  freeWater: 'yes' | 'no' | 'unknown';
  elementalSulfur: 'yes' | 'no' | 'unknown';
  requiredYieldMPa: number | null;
  collapseRequired: boolean;
  nominalSize: string;
  outsideDiameterMm: number | null;
  wallThicknessMm: number | null;
  otherLoads: string;
  environmentNotes: string;
  preferredManufacturer: string;
  preferredFamily: string;
  maxCostTier: string;
  costPriority: 'low' | 'balanced' | 'high';
  illustrative: boolean;
}

export type Eligibility =
  | 'Mechanical incompatibility'
  | 'Potential technical candidate'
  | 'Insufficient information'
  | 'Further qualification required';
export interface Assessment {
  material: Material;
  eligibility: Eligibility;
  reasons: string[];
  cautions: string[];
  ranking: { score: number; factors: { label: string; points: number }[] };
  completeness: number;
}

export interface Quotation {
  schemaVersion: 1;
  id: string;
  materialId: string;
  supplier: string;
  currency: string;
  unit: 'tonne' | 'kg' | 'm' | 'ft';
  unitPrice: number;
  date: string;
  commercialBasis: string;
  size: string;
  quantity: number;
  lengthM: number;
  nominalWeightKgM: number | null;
  allowancePercent: number;
}
