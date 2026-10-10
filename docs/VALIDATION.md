# Version 1.0 validation record

Release date: 10 October 2026. Application version: `1.0.0`. Data version: `2026-10-10.1`.

## Source fidelity

All 450 CSV records retain their stable IDs and exact original cells. Both Excel master sheets and the embedded HTML material array agree with the CSV. All four originals are preserved unchanged under `data/source/`; the importer and validator check SHA-256 hashes against `data/source-manifest.json`. Generated public and processed datasets agree. The auxiliary migration retains 36 reference entries and 17 market observations with original price units and commercial context.

The validator checks schema versions, record counts, unique IDs, raw-cell fidelity, canonical strength conversions, nullable unknown properties, reference linkage and generated mirrors. Ten Python regression tests deliberately corrupt these boundaries and verify rejection.

## Automated release checks

Run `npm run check` from the repository root. It executes source validation, Python corruption regressions, Vitest/React Testing Library, the strict TypeScript production build and Playwright against the production bundle under the GitHub repository base path.

Unit and integration coverage includes loading/schema failures; combined text, manufacturer, family and numeric filters; physical unit conversions; finite/invalid inputs; yield-boundary precision; mechanical exclusions; all seven illustrative environmental scenarios; eligibility before preferences; explicit unknowns and qualification holds; four-material comparison; dimensional quotation totals and incompatible commercial bases; versioned/corrupt/future local storage; scenario round trips; CSV injection protection; report metadata; and recovery from invalid form text.

The browser suite runs 13 workflows on desktop Chromium and emulated mobile Chromium. It checks all eight routes and refreshes, horizontal layout containment, chart navigation, filters, detail-dialog keyboard behavior, comparison limits and exports, pagination/columns/multiple sorting, unit switching and invalid-input blocking, scenario persistence/import/export, qualification gaps, quotation comparison, source registers, persistent dark mode, responsive navigation and recoverable dataset failures.

Local release results: **450 records validated, 10 Python regressions passed, 122 Vitest/React integration tests passed, 26 Playwright workflows passed, and strict TypeScript/production build passed**. `npm audit` reports zero known dependency vulnerabilities in the locked dependency snapshot. No test is disabled to permit release.

## Published-site verification

The [gated GitHub Actions run](https://github.com/sinfinitytank/octg-materials-intelligence/actions/runs/38029129096) completed successfully for application commit `049850f24080a0fecab2c86923fb124c4676f8e1`. Its Ubuntu runner independently passed source validation, all 10 Python regressions, all 122 Vitest/integration tests, the production build and all 26 browser workflows before deployment.

The actual [GitHub Pages website](https://sinfinitytank.github.io/octg-materials-intelligence/) was then tested on 10 October 2026:

- **26 of 26 live desktop/mobile browser workflows passed**, including all eight refreshed routes, interactive controls, downloads, local storage and error recovery. No browser page errors or viewport-wide horizontal overflow were found by the route checks.
- Both hosted JSON endpoints returned HTTP 200 and were byte-identical to the validated release files. The live material dataset contains all 450 records and data version `2026-10-10.1`.
- Live `materials.json` SHA-256: `781690688b350706c446b7dbcf3895b7f9a4e7cde8dd5b414e414030f77891ff`.
- Live `reference-data.json` SHA-256: `2e34c4a1c027aa2ffc4ec7e80b12101dce48e519f93f3443a389d8922d7b8526`.

The live check used `PLAYWRIGHT_BASE_URL=https://sinfinitytank.github.io/octg-materials-intelligence/ npm run test:e2e -- --timeout=60000`. The larger per-test timeout accommodates network access; the complete live suite finished in 12 seconds. Subsequent documentation-only commits do not alter the tested application or datasets.

## Visual evidence

`scripts/capture_screenshots.mjs` captures the working production browser, without fabricated content. The dashboard, database and mobile images under `docs/screenshots/` are inspected for layout, table legibility, chart rendering and responsive behavior. Automated mobile checks supplement these images by opening all eight modules and exercising their controls.

## Verification boundaries

Tests establish software behavior and migration fidelity. They do not establish the accuracy of manufacturer claims, current availability, environmental qualification, controlled-standard compliance or pipe design capacity. All 450 imported records remain independently unverified. The application calculates unit conversions, source-yield comparisons, disclosed preference points and user-quotation totals only. It does not calculate corrosion rates, temperature derating, pitting limits, collapse, burst or combined-load resistance.

Chromium desktop and mobile emulation are covered. Native iOS Safari, Firefox, Edge, assistive-technology audits and independent engineering acceptance remain outside this release's verification evidence.
