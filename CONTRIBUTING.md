# Contributing

Use Node.js 24 and Python 3.12 or newer. Run `npm ci`, `npx playwright install chromium`, then `npm run check`. Keep changes focused and document engineering behavior, assumptions and verification scope.

Run `npm run format` for consistent source formatting and `npm run format:check` before committing. Generated datasets and preserved original files are excluded.

## Material data

1. Search existing IDs, manufacturer designations and source references before adding a record. Similar grade names are not duplicates across manufacturers, product forms or supply conditions.
2. Preserve source files; add a new version rather than editing a historical source. Update the authoritative CSV only through a documented source-version change.
3. Retain exact source links, document revision, scope and evidence. Missing data remains null. A review date is not verification. Do not infer strength, chemistry or environmental limits from a grade name.
4. Update importer/schema intentionally, run `npm run data:import`, `npm run data:validate`, and review the generated diff, audit and record reconciliation.
5. Update `docs/SOURCE_AUDIT.md`, `docs/DATA_MODEL.md` and data-version metadata. Never change counts to hide lost records or merge distinct vendor grades.

## Engineering modules

Keep computations pure and independent of React. Explain dimensions, applicability, invalid-input handling and source support. Add tests that challenge uncertainty and boundaries, including a case proving missing qualification cannot yield a compliance claim. Keep procurement preferences separate from eligibility. A new model needs a documented validation basis before it can assert engineering performance.

## Pull requests

Explain the concrete problem and resulting behavior, relevant checks, source changes and remaining limitations. Include actual screenshots for visual changes. Do not publish private quotations, credentials, controlled standards text or material data without appropriate rights. CI validates data, tests, production build and desktop/mobile browser workflows.

Update `docs/PROJECT_CONTEXT.md`, `docs/ROADMAP.md`, `docs/ENGINEERING_ASSUMPTIONS.md` and `CHANGELOG.md` when the change affects their content.
