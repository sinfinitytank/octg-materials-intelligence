import type { Material } from '../../types';
export function isReferenceListing(material: Material): boolean {
  return (
    /baseline|family|reference|generic/i.test(material.listingType) ||
    /^API reference$/i.test(material.manufacturer)
  );
}
export function materialCautions(material: Material): string[] {
  return [
    'All imported material records are unverified. Check the current manufacturer datasheet, product dimensions, delivery condition and procurement specification before engineering use.',
    'A grade name or manufacturer service designation does not establish ISO 15156 / NACE MR0175 acceptance.',
    ...material.limitations,
  ];
}
