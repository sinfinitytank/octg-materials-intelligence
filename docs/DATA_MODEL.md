# Versioned catalog and evidence model

The implementation contract is [`src/types/index.ts`](../src/types/index.ts); the migration schema is [`data/schemas/materials.schema.json`](../data/schemas/materials.schema.json). Dataset schema `1`, data version `2026-10-10.1`, contains the original CSV SHA-256 and 450 material records. `public/data/materials.json` and `data/processed/materials.json` are identical generated files. Import requires Python's standard library and performs no network activity or workbook writes.

## Identity and source fidelity

`Material.id` is the original `ID` cell (`OCTG-0001` … `OCTG-0450`). IDs identify supplier/listing records, not chemical equivalence. Grade names shared by multiple manufacturers are not merged. Original row order is retained. `raw` holds all 25 exact CSV cell strings, including empty strings and original source wording. The CSV header is source row 1; each normalized `source.row` points to its original data row starting at 2.

`source.file`, `source.row`, `source.url`, `source.status`, and `source.reviewedAt` preserve the source context. `source.verification` is always `unverified`. Neither the `Reviewed` date nor source text containing “verified” upgrades this status. The frozen SHA-256 manifest covers both XLSX files, HTML and CSV; the dataset's SHA-256 refers specifically to its CSV authority. A deliberate source replacement must be reviewed and explicitly update the manifest, version and generated audit.

## Column mapping

| CSV column(s)                                                         | Normalized field(s)             | Interpretation                                                                                  |
| --------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| ID, Supplier, Region, Grade                                           | id, manufacturer, region, grade | Exact source labels                                                                             |
| Listing type, Standard context                                        | listingType, specification      | Preserve baseline/family/offer distinctions and edition wording                                 |
| Material family, Service / use, Typical application                   | family, service, application    | Catalog descriptions, not acceptance envelopes                                                  |
| H2S suitability, CO2 corrosion                                        | h2s, co2                        | Source claims, not quantitative thresholds                                                      |
| High collapse                                                         | collapseSource; collapse        | Preserve exact description; only `Enhanced` maps to `enhanced`, otherwise `not-stated`          |
| SMYS ksi                                                              | yieldMinKsi; yieldMinMPa        | Copy explicit numeric cell only; MPa = ksi × 6.894757293168361, rounded to 6 decimals           |
| UNS, 5CRA Group, 5CRA Category                                        | uns, craGroup, craCategory      | Exact identifiers if present; otherwise null                                                    |
| Relative cost tier                                                    | costTier                        | Original qualitative A–I label; no numeric price ratio                                          |
| Price low USD/t, Price high USD/t, Vendor quote USD/t, Price evidence | pricing                         | Historical ranges distinguished from supplier quotations by evidence and per-record limitations |
| Source URL, Source status, Reviewed                                   | source                          | Original context, separate unverified status, CSV file and row                                  |
| Technical notes                                                       | notes                           | Exact source text, including empty text                                                         |
| All original columns                                                  | raw                             | Lossless audit cells                                                                            |

`properties.yieldMaxMPa`, `tensileMinMPa`, `elongationPercent`, `hardness`, `heatTreatment` and `environmentalEnvelope` are explicitly null in this snapshot. `properties.chemistry` is `{}` because no element evidence exists. Missing numeric values are never zero. Missing optional identifiers, URLs and dates are null. Required descriptive strings preserve the original cells; an empty technical note is an empty string, retained verbatim in `notes` and `raw`.

Every material carries human-readable `limitations`: unverified evidence and absent property/envelope evidence; numeric-yield or missing-yield status; and applicable reference, family, CRA option, historical, price or edition caveats. These are import provenance constraints, not new source claims.

## Auxiliary references and market observations

`data/processed/reference-data.json` and its public mirror preserve 36 source references and 17 price benchmark observations from the dashboard workbook. Each item has `sourceRow` and the exact cell-string `raw` map, with dataset version, original workbook path/SHA-256 and `unverified` status. Benchmark observation labels such as `2026`, `2026 Q1` and `July 2026` are retained; no exact observation date is invented. USD/foot observations retain that unit. Six material price ranges share five generic China FOB grade observations and do not create vendor quote records. The audit retains full WELL INPUTS, estimator, methodology and READ ME source cells as supporting evidence.

## Scenario and assessment boundaries

`WellScenario` is a separate versioned engineering input object. Temperatures use °C; depths/dimensions use m/mm; chloride uses mg/L; pressures and required yield use MPa. Legacy example partial pressures were in bar and must be converted explicitly (1 bar = 0.1 MPa). Null pressure, pH, water and strength inputs remain unknown, separate from measured zero. Free water and sulfur have explicit yes/no/unknown choices. Illustrative scenarios are labelled with `illustrative: true`.

`Assessment` combines a material and scenario with explicit reasons, cautions, completeness and transparent preference factors. It does not mutate source data or create qualification certificates. A low SMYS comparison is a preliminary source-value mismatch, not a pipe-capacity calculation. Procurement costs and preference scores remain separate from technical eligibility.

`Quotation` is a separate versioned user-entered commercial object with material ID, supplier, currency, unit, price, date, basis, size, quantity, length, optional nominal weight and allowance. Historical dataset benchmarks are never silently promoted into dated quotations. Mass and length conversions require appropriate dimensions or nominal weight, not a grade-family assumption.

## Future enrichment

This snapshot schema deliberately rejects undocumented chemistry, environmental envelopes and mechanical properties. Additions require a reviewed schema/data version change with property-specific provenance, units, temperature, product form, dimensions, edition and evidence status. Preserve original IDs/raw cells and reference earlier snapshots. Allow multiple conditional facts rather than overwriting a record with a single universal material value. Revisioned environmental qualification records and manufacturer certificates can later be related to these stable listing IDs without turning generic references or family rows into qualified products.
