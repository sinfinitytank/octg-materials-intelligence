export interface EngineeringReference {
  designation: string;
  title: string;
  application: string;
  families: string;
  url: string;
  edition: string | null;
  notes: string;
  verifiedAt: string;
}
export const REFERENCES: EngineeringReference[] = [
  {
    designation: 'API 5CT',
    title: 'Casing and Tubing',
    application:
      'Product specification for casing and tubing. Apply the controlled edition, product scope, grade and purchase requirements.',
    families: 'Carbon and low-alloy OCTG; applicable 5CT grades',
    url: 'https://www.api.org/products-and-services/api-monogram-and-apiqr/latest-updates',
    edition: '11th edition; Addendum 1 (2025), Errata 3 (June 2026) listed by API',
    notes:
      'Standard designation and yield strength alone do not establish environmental qualification. Historical M65 listings require review.',
    verifiedAt: '2026-10-10',
  },
  {
    designation: 'API 5CRA',
    title: 'Corrosion Resistant Alloy Seamless Tubes for Use as Casing, Tubing and Coupling Stock',
    application:
      'Technical delivery conditions for CRA seamless OCTG products. Confirm applicable product specification level and purchase requirements.',
    families: 'Martensitic stainless, duplex stainless, Fe-Ni and nickel alloys within scope',
    url: 'https://www.api.org/products-and-services/api-monogram-and-apiqr/latest-updates',
    edition: '3rd edition update (April 2025) listed by API',
    notes:
      'The supplied grade mapping uses a 2023 licensing information form. It has not been validated against the current controlled standard.',
    verifiedAt: '2026-10-10',
  },
  {
    designation: 'ISO 13680',
    title:
      'Corrosion-resistant alloy seamless products for use as casing, tubing, coupling stock and accessory material — Technical delivery conditions',
    application:
      'CRA product delivery requirements. Confirm the applicable edition and its relationship to the procurement specification.',
    families: 'CRA seamless products within the standard scope',
    url: 'https://www.iso.org/standard/87722.html',
    edition: '2024, 5th edition (a 6th edition draft is under development)',
    notes:
      'The catalogue confirms delivery scope. End sizing, connections and welding require their own applicability review. No copyrighted tables are reproduced.',
    verifiedAt: '2026-10-10',
  },
  {
    designation: 'ISO 15156 / NACE MR0175',
    title: 'Materials for use in H₂S-containing environments in oil and gas production',
    application:
      'Material selection and qualification for resistance to H₂S-related cracking, using applicable parts and actual service conditions.',
    families: 'Part 2: carbon and low-alloy steels. Part 3: corrosion-resistant and other alloys.',
    url: 'https://www.iso.org/standard/79658.html',
    edition: 'Part 1: 2020, 4th edition; confirm applicable parts and amendments',
    notes:
      'Grade names, sour-service catalogue descriptions and relative alloy content are not proof of compliance. Corrosion rate and design life are separate assessments.',
    verifiedAt: '2026-10-10',
  },
  {
    designation: 'API TR 5C3 / ISO/TR 10400',
    title: 'Calculations for casing, tubing and pipe performance properties',
    application:
      'Controlled performance-property calculation procedures, dimensions, material properties, tolerances and load cases.',
    families: 'Casing and tubing within the applicable technical report scope',
    url: 'https://www.api.org/products-and-services/standards/important-standards-announcements/standard-5ct',
    edition: null,
    notes:
      'This application does not calculate collapse, burst or combined-load resistance. An enhanced-collapse catalogue designation is not a verified resistance value.',
    verifiedAt: '2026-10-10',
  },
];
