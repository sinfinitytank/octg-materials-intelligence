# Architecture

OCTG Intelligence is a static, browser-only React/TypeScript application built by Vite. No backend, account or paid API is required. Hash navigation supports refreshing any page on GitHub Pages. Asset and data URLs use Vite's repository base path.

## Responsibilities

| Module                                | Responsibility                                                              |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `data/source/`                        | Immutable copies of the four supplied inputs                                |
| `scripts/`                            | Deterministic standard-library Python import and validation                 |
| `data/processed/`, `public/data/`     | Separately generated, versioned material JSON                               |
| `data/schemas/`, `src/data/schema.ts` | Build-time contract and runtime Zod validation                              |
| `src/types/`                          | Centralized domain interfaces                                               |
| `src/data/load.ts`                    | Fetch and validate data before presenting it                                |
| `src/app/`                            | Application state and composition                                           |
| `src/pages/`, `src/components/`       | Presentation, tables, charts, forms and accessible details                  |
| `src/services/`                       | Canonical units, scenarios, local storage, search and commercial arithmetic |
| `src/engineering/`                    | Independent mechanical, environmental and preference screening rules        |
| `src/reporting/`                      | CSV, scenario, comparison and print report output                           |
| `tests/`                              | Unit, React integration and production-browser regression tests             |
| `.github/workflows/`                  | CI and gated Pages publication                                              |

React Context owns the small cross-page workflow state. TanStack Table handles table sorting, visibility, resizing and pagination. Recharts renders database aggregates. Lucide supplies consistent icons. Tailwind CSS and shared custom styles define presentation. Spreadsheet libraries are absent from the browser bundle.

## Data boundaries

The CSV supplies individual record values; Excel and HTML support the audit and methodology comparison. Each material retains its raw source row, CSV line number, source URL, source status and review date. Unknown mechanical/chemical/environmental values are explicit nulls. Catalogue source statements remain unverified. The data version is independent of application version and scenario schema version.

The client validates IDs, object shapes, numeric ranges, canonical unit consistency and source links before loading records. Missing or invalid data produces a visible load error. No fallback catalogue is synthesized.

## Engineering boundaries

Screening produces four explicitly named states: mechanical incompatibility, potential technical candidate, insufficient information and further qualification required. Catalogue yield comparisons are preliminary and do not establish purchased-product properties. Environmental qualification is unavailable in the initial data. Numeric preference points express ordering only; they are not a safety probability. Confirmed source-strength exclusions remain separate from procurement ordering.

Well inputs use MPa, °C, mm, m and mg/L internally. Conversion belongs at the input/display boundary. Local scenarios and quotations are versioned and validated on read. Invalid stored records are surfaced rather than silently converted or discarded. User-entered quotations remain distinct from supplied market benchmarks.

## Extension strategy

Add validated engineering models as pure modules that return evidence, applicability, warnings and results. Extend versioned schemas and provide explicit migrations when semantics change. Introduce a backend only when an actual workflow requires shared or authenticated data. Keep future modules out of navigation until they work.

For very large catalogues, build server/search indexing or worker-based filtering only when measurement warrants it. The initial table paginates results so hundreds of off-screen rows are not mounted.
