# Engineering assumptions and verification requirements

Application 1.0.0, material data 2026-10-10.1, schema 1. This is a preliminary catalogue-screening workflow. No supplied record has an independently verified environmental qualification envelope. The app cannot qualify a material for a well.

## Input basis

Pressures are absolute, in canonical MPa, including H₂S and CO₂ partial pressures. The input model checks nonnegative pressure and partial-pressure sums against the operating absolute pressure. Temperatures are canonical °C and bounded by absolute zero. Depth/length are m; diameters and wall thickness are mm; chloride is mg/L. pH is dimensionless; the initial UI supports 0–14. Geometry checks reject twice the wall thickness equal to or greater than outside diameter. Unknown is represented by null, separately from a real zero.

Field units convert at the presentation boundary: psi→MPa, ksi→MPa, °F↔°C and inches↔mm. ppm by mass needs solution density in kg/L to convert to mg/L; the application does not assume density for formation brine. No partial pressure is calculated from an assumed gas composition or gauge pressure.

The seven built-in scenarios are illustrative values for exercising workflows: sweet conventional, high CO₂, sour, high pressure/temperature, high collapse, high chloride and incomplete environment. Their names do not establish classification thresholds or design criteria.

## Eligibility

| Result                         | Meaning                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mechanical incompatibility     | The supplied numerical SMYS is below the entered minimum yield requirement. This is a preliminary source-value exclusion; actual product properties still require verification. |
| Potential technical candidate  | Entered dry-service screening inputs are complete and no source yield shortfall is found. This does not establish temperature, environmental or design suitability.             |
| Insufficient information       | Invalid/missing required inputs, missing yield data or a generic/family reference prevent a specific-product screening conclusion.                                              |
| Further qualification required | No numerical source yield shortfall is found, but the stated environmental exposure or collapse requirement requires additional evidence.                                       |

Invalid scenarios cannot generate candidates. Mechanical source-value exclusions are ordered after other results, regardless of commercial preference. Generic API references and family listings are retained in the database; they do not become qualified purchasable products.

## Mechanical scope

The source's SMYS ksi is preserved and converted using 1 ksi = 6.894757293168 MPa. It is not silently replaced with inferred values. Comparisons use a 0.000001 MPa numerical precision tolerance because generated MPa values are rounded to six decimals; this prevents an identical ksi input from becoming a floating-point shortfall and is not a design allowance. Source notes and limitations qualify every comparison. Actual yield ranges, hardness, tensile properties, heat treatment, product dimensions, temperature derating, manufacturing tolerances and load combinations are unavailable in the initial material data.

No collapse, burst, axial capacity, connection rating, fatigue or combined-load calculation is implemented. An enhanced-collapse catalogue designation is displayed for procurement investigation. Yield strength alone cannot establish collapse resistance.

## Environment

H₂S, CO₂, aqueous exposure, elemental sulfur, chloride, pH and temperature are displayed with transparent review reasons. No empirical corrosion rate, threshold H₂S pressure, pitting limit or assumed chloride/temperature acceptance boundary is implemented. Wet service and stated corrosive exposures require further qualification. Unknown environmental inputs remain unknown.

Manufacturer sour-service, CO₂-service and alloy-family text provides context only. It does not prove ISO 15156/NACE MR0175 compliance. High-Cr and nickel families receive no universal suitability claim. Environmental suitability needs the controlled standard, applicable part, full service chemistry, material condition, hardness, product/process applicability, specific qualification limits and approved evidence.

## Preference ordering

Eligibility is determined before preference points. The preference function exposes each contribution: information availability, preferred manufacturer/family, explicit application-text matches and compliance with the user's ordinal budget preference. Information availability counts populated fields; it is not data confidence. All imported data remains unverified, irrespective of completeness or review date. Cost tiers A–I are ordinal categories supplied in the CSV, not numerical cost multipliers.

Preference points are not probability, engineering performance, standards compliance or safety. A budget preference cannot override a mechanical exclusion or remove an unresolved qualification requirement.

## Commercial scope

The six supplied USD/t ranges are indicative China FOB benchmarks, not manufacturer quotations. They lack complete quotation metadata and are excluded from automatic project costing. Proprietary materials without a supplied quote display that a manufacturer quotation is required.

For a user quotation: total length = pipe count × length per pipe. Mass tonnes = total length m × supplied nominal weight kg/m ÷ 1000. Base total uses the entered unit price and its explicit unit. The entered percentage allowance is applied once. Length-priced quotations can calculate totals without inventing nominal mass. Mass-priced quotations require nominal weight. There is no density assumption, currency conversion or life-cycle cost model.

Comparisons require consistent currency, size, commercial terms, date, quantity, length and allowance basis. Mass/length normalization requires actual nominal weight. The user must establish commercial and technical comparability; normalization alone does not make different products equivalent.

## Evidence and reports

Every report identifies analysis date, application/data version, scenario inputs, limitations and source references where applicable. Source review dates reflect the supplied dataset only. No source, property, qualification or price is promoted to verified merely because it was imported or displayed.

Official reference catalogue links live in `src/data/references.ts`. The supplied API 5CRA mapping references a 2023 licensing form and needs review against the applicable controlled edition. Standards text and paywalled tables are not reproduced. See `SOURCE_AUDIT.md` for discrepancies between legacy HTML and Excel scoring.
