# OCTG Materials Intelligence

A source-linked engineering workspace for exploring, screening and comparing oil-country tubular goods. Built for a maintainable, browser-only workflow on GitHub Pages.

[Open the application](https://sinfinitytank.github.io/octg-materials-intelligence/) · [Engineering methodology](docs/ENGINEERING_ASSUMPTIONS.md) · [Source audit](docs/SOURCE_AUDIT.md) · [Roadmap](docs/ROADMAP.md)

![Actual application dashboard](docs/screenshots/dashboard.png)

[View the materials table](docs/screenshots/database.png) · [View the mobile layout](docs/screenshots/mobile.png)

## What you can do

- Explore actual manufacturer, family and source-strength distributions; select chart categories to open matching records.
- Search 450 records by grade, manufacturer, UNS or specification. Combine categorical and strength filters, sort multiple columns, resize/hide columns and paginate results.
- Inspect material properties, original source cells, catalogue limitations and source links.
- Define well conditions in metric or field units, validate inputs, load seven illustrative scenarios and save/import/export multiple versioned scenarios locally.
- Run reproducible screening with explicit exclusions, data gaps, qualification requirements and transparent preference factors.
- Compare up to four materials, highlighting differences and keeping missing values visible.
- Review 17 historical market observations in their original units, and calculate indicative costs from locally entered, dated supplier quotations with explicit nominal weight and commercial terms.
- Export materials, comparisons, well scenarios and ranked results. Print an engineering summary with conditions, explanations, limitations, sources and software/data versions.
- Use light/dark appearance and a responsive desktop/mobile layout.

## Engineering scope

This is **preliminary source-data screening**. No material is declared qualified, safe or compliant. Source links, grade names, sour-service statements and source review dates are not independently verified qualification evidence. The source data contains no environmental acceptance envelopes, chemistry, heat treatment, hardness or size-specific performance ratings.

The engine compares supplied minimum yield to an entered requirement and identifies environmental/design investigations. It keeps engineering eligibility separate from preference ranking. Budget, manufacturer or family preferences cannot override a mechanical source-value exclusion. Points are ordering factors, not performance or safety probabilities.

API 5CT, API 5CRA, ISO 13680, ISO 15156/NACE MR0175 and API TR 5C3/ISO/TR 10400 are referenced with official catalogue links. Controlled editions, product scope, procurement requirements and actual service conditions must be reviewed independently. No copyrighted standards tables are bundled. No corrosion-rate, pitting, collapse, burst, combined-load or life-cycle model is fabricated.

## Database coverage

The supplied CSV is authoritative. All 450 stable IDs and exact raw cells are preserved; both workbook master sheets and the HTML catalogue agree with it. Originals are copied unchanged under `data/source/` and checked with an immutable SHA-256 manifest.

| Coverage                                                | Source snapshot |
| ------------------------------------------------------- | --------------: |
| Manufacturer labels, excluding generic API references   |              15 |
| Generic API reference rows                              |              64 |
| Proprietary-grade listings                              |             329 |
| Supplier family/series listings                         |              11 |
| Material families                                       |               9 |
| Records with numerical source SMYS                      |             440 |
| Records with independent qualification / verification   |               0 |
| Record-linked indicative benchmark ranges               |               6 |
| Actual supplier quotations in supplied CSV              |               0 |
| Auxiliary market observations / source register entries |         17 / 36 |

Families include carbon/low-alloy, low-Cr, 9Cr, martensitic 13Cr, modified/super 13Cr, duplex 22Cr, superduplex 25Cr, Fe-base austenitic CRA and Ni-base CRA. Source classifications are preserved; they are not inferred chemistry. Supplier labels include Tenaris, Vallourec, Nippon Steel, JFE, voestalpine, U.S. Steel, TMK, TPCO, ArcelorMittal, Jindal, Borusan, Interpipe, SeAH and Tianjin Huajin. Distinct Jindal labels remain separate.

The six CSV price ranges represent historical China FOB benchmarks. Auxiliary observations use different dates, products and USD/foot or USD/tonne units. None is silently converted into a supplier quote. Proprietary records without prices require a manufacturer quotation.

## Run locally

Requirements: Node.js 24, npm and Python 3.12+.

```sh
npm ci
npx playwright install chromium
npm run data:validate
npm run dev
```

Open the Vite URL including `/octg-materials-intelligence/`. To serve at the host root, use `VITE_BASE_PATH=/ npm run dev`.

```sh
npm run check       # source validation + corruption regressions + unit/integration + build + browser tests
npm run preview     # local production preview after build
```

The browser tests use the production build at the actual repository base path. `npm run test:watch` supports focused development. All dependencies are lockfile-pinned; spreadsheets are converted offline at build/development time and never parsed in the browser.

## Typical workflow

1. Inspect the database and source limitations. Add relevant records to comparison.
2. Enter well conditions or load an explicitly illustrative scenario. Blank numeric values remain unknown; invalid entries block screening and saving.
3. Review candidate, qualification-needed, insufficient-data and mechanical-exclusion groups. Open **Why this result?** for evidence and preference factors.
4. Compare individual records and request current manufacturer information. Add user quotations in Cost Analysis when available.
5. Save/export the scenario and export the current shortlist or print its summary. Complete qualification and pipe design independently using applicable evidence.

## Data updates and extensions

```sh
npm run data:import
npm run data:validate
npm run data:test
```

The importer is deterministic, offline and uses Python's standard library. It never modifies sources. It checks the frozen source manifest and reconciles record identity, original cells, nullable fields, conversions and generated mirrors. A deliberate new source snapshot requires a reviewed manifest/data-version/schema change; see [data model](docs/DATA_MODEL.md) and [contribution guide](CONTRIBUTING.md).

Presentation, application state, data loading, input validation, commercial calculations, engineering rules and reporting have separate modules. See [architecture](docs/ARCHITECTURE.md) and [project context](docs/PROJECT_CONTEXT.md) before extending the app. Future qualification envelopes and validated models must retain conditional evidence rather than assign universal properties to grade families.

## Deployment

Pushes to `main` run validation, tests and the production build before official GitHub Pages deployment actions. Hash routes are refresh-safe and data/assets use the repository base. Pull requests validate without deployment permissions. See [deployment instructions](docs/DEPLOYMENT.md) and [validation record](docs/VALIDATION.md).

## Licensing and privacy

Original software is [MIT licensed](LICENSE). Source workbooks, HTML/CSV, manufacturer documentation, compiled material data and standards retain their applicable rights; no open data license is implied. See [data attribution and rights](DATA_LICENSE.md). Local quotations and scenarios remain in browser storage. The application has no backend, authentication, analytics or paid API.

## Remaining limits

All 450 catalogue records require independent review. A numerical source SMYS may itself need certificate/datasheet confirmation. Family-level and generic listings remain identifiable. There is no multi-user synchronization, authenticated evidence review, production calculation module, built-in PDF generator or automatic live market feed. Browser storage is local and should be backed up through exports. Advanced modules remain outside production navigation until implemented and validated.
