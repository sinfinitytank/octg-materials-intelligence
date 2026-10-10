# Project context

## Purpose and current foundation

OCTG Materials Intelligence & Selection Platform helps materials engineers explore catalogue records, define well conditions, produce an explainable preliminary shortlist, compare grades and evaluate explicit commercial quotations. Version 1.0 uses static GitHub Pages hosting and browser-side processing. It is designed for continued development rather than a standalone HTML prototype.

Repository: https://github.com/sinfinitytank/octg-materials-intelligence

Application: https://sinfinitytank.github.io/octg-materials-intelligence/

Status: Version 1.0 is published and verified. Local and Ubuntu CI checks passed 10 Python regressions, 122 unit/integration tests and 26 production-browser workflows. All 26 browser workflows also passed against the actual hosted site; both hosted datasets matched the validated release bytes. Evidence and verification boundaries are recorded in `VALIDATION.md`.

## Stack and boundaries

React 18, strict TypeScript, Vite 7, Tailwind CSS 4, TanStack Table 8, Recharts 3, Zod 3 and Lucide. Vitest 5, React Testing Library and Playwright test source, domain and production-browser behavior. Node.js 24 is used in CI; the ingestion pipeline needs only Python's standard library. No backend/authentication/paid service is required. Hash navigation supports refreshes under a repository URL base.

See `ARCHITECTURE.md` for module ownership. `src/types/index.ts` centralizes contracts. `src/data/schema.ts` validates runtime data. `src/engineering/` owns screening, `src/services/` owns units/scenarios/search/costs/storage, and `src/reporting/` owns exports. UI state is in `src/app/context.tsx`. Start future work with the relevant page/service and these documents, not the original conversation or generated dataset.

## Source migration

The four original XLSX/XLSX/HTML/CSV inputs are unchanged under `data/source/`. CSV is the material-record authority. All 450 IDs and source cells match both Excel master sheets and HTML embedded data. The dataset has 15 manufacturer labels plus API references, nine families, 329 proprietary listings, 11 family listings, 440 numerical SMYS values and 10 unknown SMYS values. All records remain unverified.

Version: data `2026-10-10.1`, material/scenario/quotation schema 1. Source hashes are frozen in `data/source-manifest.json`. `scripts/import_data.py` creates public/processed mirrors, an audit inventory, and auxiliary data with 36 references and 17 market observations. `scripts/validate_data.py` checks deterministic fidelity. `scripts/test_data_validation.py` challenges corruptions. See `SOURCE_AUDIT.md` and `DATA_MODEL.md` for exact structures and legacy scoring differences.

## Engineering decisions

Use four eligibility labels: mechanical incompatibility, potential technical candidate, insufficient information, further qualification required. Compare numerical source yield only with explicit unverified caveats. Unknowns remain null, never zero. Generic references and family-level listings are held for insufficient information. Wet/corrosive exposures without applicable verified envelopes require qualification. No grade name or marketing designation proves ISO 15156/NACE acceptance.

Determine eligibility before preference points; procurement cannot override exclusions. The exposed information-availability percentage measures populated fields only. Cost tiers A–I are source ordinal categories; price multipliers and material performance are not inferred. Temperature derating, corrosion rates, pitting limits, design life and collapse/burst/combined-load capacity are not calculated.

Canonical units: MPa absolute pressure/yield, °C, m depth/length, mm diameters/wall and mg/L chloride. ppm by mass needs density. User quotations retain date, currency, unit, supplier, basis, size and quantity. Benchmarks remain separately attributed historical observations and do not feed project cost calculations automatically.

## Working features

Eight modules: dashboard, searchable/filterable/resizable materials database and details, validated well inputs with seven illustrative scenarios and local persistence, transparent selection results, four-record comparison, user quotation costs and benchmark register, official technical references/source register, and theme/unit settings. Reporting supports CSV, scenario JSON and printable summaries with traceability and limitations. UI is responsive with a collapsible sidebar and light/dark themes.

## Verification and known limitations

The release verification record is in `VALIDATION.md`. Re-run `npm run check` before publication after changes. Source migration fidelity is verified; independent material qualification is not. Current documentation links confirm public catalogue metadata only, not controlled standards contents or vendor envelopes.

All imported environmental envelopes/chemistry/heat treatment/hardness/actual performance ratings are missing. Historical supplier and family listings need current availability/product review. Browser storage is local, versioned and not shared across profiles or machines. No live supplier feed, controlled evidence-review UI, automated PDF export or advanced engineering calculation has been implemented. See `ENGINEERING_ASSUMPTIONS.md` for exact rule boundaries and `ROADMAP.md` for future work.

## Continuity rules

Preserve source history, IDs, unrelated work and existing features. Search before adding grades; separate manufacturer/product form/condition/evidence. Do not regenerate ingestion unless sources or migration rules change. Add independently tested modules with explicit applicability and validation evidence. Update this file, roadmap, engineering assumptions, changelog and validation record when their content changes.
