# Supplied-file audit — 10 October 2026

The four supplied originals were inspected before migration. The CSV is the record authority; both workbook `MASTER GRADES` sheets and the HTML's embedded `DATA` agree with it across all **450 records and 25 columns**, after representing spreadsheet/JSON numbers and missing cells as CSV strings. There are **zero differing fields**, missing IDs, extra IDs, duplicate IDs, or duplicate supplier/grade pairs. All nine sheets shared by the two workbooks have identical cell content and formulas. All four files under `data/source/` were checked byte-for-byte against the workspace originals at import; their SHA-256 hashes are frozen in [`data/source-manifest.json`](../data/source-manifest.json).

This audit verifies migration fidelity. It does not verify source webpages, current availability, specification editions, material properties, compliance or service suitability. No new online research was needed for migration.

## Record inventory

| Item                                                                                                                           | Count / finding |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------: |
| Material records / stable original IDs                                                                                         |       450 / 450 |
| Actual manufacturer labels                                                                                                     |              15 |
| API reference records, additional to manufacturer offerings                                                                    |              64 |
| Proprietary-grade listings                                                                                                     |             329 |
| Supplier-listed API grades                                                                                                     |              27 |
| API baseline / API CRA category-grade listings                                                                                 |         15 / 49 |
| Manufacturer CRA alloy-strength options                                                                                        |              13 |
| Supplier-named family/series listings                                                                                          |              11 |
| Other supplier-listed grades                                                                                                   |               6 |
| Material families / source URLs attached to records                                                                            |          9 / 27 |
| Known catalog SMYS / missing SMYS                                                                                              |        440 / 10 |
| UNS missing / CRA group missing / CRA category missing                                                                         | 399 / 401 / 388 |
| Rows with historical indicative price ranges / absent ranges                                                                   |         6 / 444 |
| Supplier vendor quotations                                                                                                     |               0 |
| Documented chemistry, environmental acceptance envelopes, yield maxima, tensile minima, elongation, hardness or heat treatment |               0 |
| Independently qualified or verified records                                                                                    |               0 |

There are 419 distinct grade strings; repeated strings such as J55 occur under different suppliers and must remain separate records. All 450 `Reviewed` cells say `2026-10-10`; this is retained as source metadata and never converted into verification. Phrases including “Verified family” or “Grade code verified” remain verbatim source claims while the normalized verification field remains `unverified`.

## Workbook structures and auxiliary evidence

Counts below are nonempty rows, including headers/title rows. Exact XML row counts, maximum column counts, formula counts/caches and formula samples are stored in [`data/processed/source-audit.json`](../data/processed/source-audit.json).

| Sheet                 | Nonempty rows | Formulas | In both workbooks?      |
| --------------------- | ------------: | -------: | ----------------------- |
| MASTER GRADES         |           451 |        0 | Yes                     |
| API 5CT               |            16 |        0 | Yes                     |
| API 5CRA              |            50 |        0 | Yes                     |
| PRICE BENCHMARKS      |            18 |        0 | Yes                     |
| SUPPLIER COVERAGE     |            16 |        0 | Yes                     |
| SOURCES               |            37 |        0 | Yes                     |
| COST ESTIMATOR        |            17 |        7 | Yes                     |
| READ ME               |            19 |        0 | Yes                     |
| DASHBOARD             |            20 |        3 | Yes                     |
| WELL INPUTS           |            27 |       15 | Dashboard workbook only |
| SCREENING             |           451 |    3,600 | Dashboard workbook only |
| SELECTION METHODOLOGY |            22 |        0 | Dashboard workbook only |

The master workbook contains 10 formulas; the selection dashboard contains 3,625. All have supplied cached values. We read XML and cached values without saving, executing or recalculating either workbook. A separate read-only `openpyxl` inspection corroborated sheet/formula structures; its extension-support warnings did not cause file writes.

`SOURCES` holds **36 distinct references**. All 27 record URLs occur in that list; nine additional references cover updates, ISO scope, supplementary supplier pages and market evidence. `PRICE BENCHMARKS` has **17 observations plus a header**, rather than 18 priced material records:

- Five generic China FOB grade benchmarks carry the observation label `2026`. These map to six CSV baseline rows because N80 Type 1 and N80 Type Q share the N80 benchmark. Source rows OCTG-0004 through OCTG-0009 retain their original numeric ranges. Their exact observation day, offer validity, supplier and size are unspecified.
- One association P110 casing observation carries `2026 Q1` and a different product/market basis.
- Eleven US distributor spot observations carry `July 2026`, pipe sizes and **USD/foot** units. They are retained separately and never treated as USD/tonne or attached to individual manufacturer grades.

All 17 benchmark observations and 36 source references are preserved with original labels, units, URLs and workbook row numbers in [`data/processed/reference-data.json`](../data/processed/reference-data.json), mirrored under `public/data/`. The full auxiliary WELL INPUTS, READ ME, COST ESTIMATOR and SELECTION METHODOLOGY cells remain in the machine audit and original workbook. Legacy estimator values (23 lb/ft, 12.2 m/joint, 100 joints, USD 1,800/t, 12% threading/testing and USD 200/t freight) are **illustrations**, not supplier quotations or application defaults for real procurement.

## Existing selection methods and differences

Both originals use a catalog-search heuristic: base 43; +14 when numeric SMYS meets the user's minimum; +24 for a text-derived sour claim, +14 for an alloy family in wet CO2, +17 for a named collapse variant; penalties for absent claims, generic references and sulfur. Both hard-exclude below-minimum SMYS and above-budget tiers. Those budget exclusions are procurement preferences, not mechanical incompatibility. Both expose environmental cautions but contain no grade-specific numeric allowable environmental envelopes, validated corrosion model, or pipe load rating calculation. The original partial-pressure inputs and preset values are **bar**, not MPa or mole percent.

The Excel SCREENING sheet's precomputed sour, alloy and collapse flags match the HTML text rules across all 450 rows: zero flag differences. Scores still differ:

| Same wet/unrestricted preset applied to all 450 source rows | Rows with different scores |
| ----------------------------------------------------------- | -------------------------: |
| Sweet, 55 ksi                                               |                         15 |
| Wet CO2, 80 ksi (the original default)                      |                         39 |
| Sour/collapse, 95 ksi                                       |                        269 |
| HPHT/sulfur/collapse, 110 ksi                               |                        219 |

These counts come from a documented static transcription of the original HTML `assess()` and Excel Q-column formula, with 0–100 clipping, not a fresh spreadsheet calculation. The transcribed default Excel scores match all 450 supplied Q-column caches. Original examples and exact inputs are retained in `legacyLogicComparison` in the audit inventory.

- Excel applies −20 for below-minimum **or unknown** SMYS. HTML adds no +14 for those rows but does not apply that −20. For wet CO2, OCTG-0406 (TP-2205 family, unknown SMYS) scores 57 in HTML versus 37 in Excel; OCTG-0003 (H40) scores 15 versus 0 after clipping.
- At chloride ≥20,000 mg/L, HTML applies −6 to 13Cr and +6 to duplex/Ni-base/austenitic families; Excel uses chloride as a caution only. In the sour preset, OCTG-0013 scores 72 versus 66.
- At temperature ≥120 °C, HTML applies an additional −6 to 13Cr; Excel flags caution without changing score. HTML also subtracts 15 for wet H2S in carbon/low-alloy material without its sour-text flag. These thresholds and weights are heuristic and provide no allowable material boundary.
- HTML adds a qualification hold for H2S when wet/dry exposure is not wet; Excel's sour gate only checks the wet branch. API rows are hidden by default in HTML, while Excel returns reference/exclusion labels. HTML's shortlist can include review rows scoring ≥54. These are workflow differences, not competing qualification results.
- Neither legacy method adequately prevents a family listing with a numeric lower bound, or a well populated marketing record lacking an environmental envelope, from appearing like a product-specific candidate. The migrated data explicitly identifies those gaps; the application assessment requires further qualification.

The useful migrated capabilities are catalog filters, original stable IDs, source-linked details, four-grade comparison, illustrative well scenarios, evidence-aware strength screening and unit-aware cost estimation. Legacy scores and labels are audited rather than presented as proof of suitability.

## Interpretation limits retained in the migration

All numeric SMYS values come directly from the CSV column. The source does not provide property-level derivation or certificate provenance; some values may have been inferred from designations when the original dataset was assembled. No additional yield, composition, hardness, heat treatment, strength range or acceptance limit is inferred during import. A per-record limitation marks every numeric yield as unverified and requiring confirmation for product form, size, temperature and heat treatment.

The 11 TPCO series/family rows are not discrete orderable grades. OCTG-0404 (`TP-SS series (80–125 ksi)`) contains source SMYS 80; we preserve it with an explicit range/lower-bound limitation rather than pretending that every member has identical properties. The other 10 family rows have null yields. The 13 Tenaris CRA rows are alloy/strength options, not unique trade names.

The source notes identify M65 as historical/withdrawn, but **no row has an M65 grade designation**. Generic note mentions are not treated as 15 actual M65 records. Seven TMK rows explicitly reference a historical catalog/investor presentation and need availability confirmation. The API CRA listings retain their 2023 licensing-matrix context and edition caveats. This audit has not independently established current edition applicability. The source includes a common modified/super 13Cr family label for specific JFE 15Cr/17Cr offerings; their exact designations and explanatory notes are preserved, and no 13Cr composition or acceptance envelope is assigned to those products.

No marketed “sour”, enhanced-collapse or CRA description establishes ISO 15156 acceptance, allowable H2S/CO2/chloride/pH/temperature, or actual burst/collapse/axial capacity. Record URLs identify the supplied source context, not property-by-property verified evidence. All unknown normalized numeric/property fields remain null; chemistry remains an empty mapping because no composition entries were supplied.

## Reproduction and integrity checks

Run from the repository root with Python 3; only the standard library is needed:

```sh
python3 scripts/import_data.py
python3 scripts/import_data.py --check
python3 scripts/validate_data.py
python3 scripts/test_data_validation.py
```

The validator enforces the four immutable original hashes, 450 IDs/order, checked-in schema, exact raw cells and source paths/rows, source claims versus verification, nullable missing data, numeric source equality, six-decimal ksi→MPa conversion, price bounds, absent unsupported properties and deterministic public/processed mirrors. Ten regression checks include rejection of inferred missing yields, invented chemistry, promoted verification, duplicate IDs, raw loss, invalid conversions, missing null fields and invented zero quotations.
