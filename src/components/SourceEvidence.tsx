import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Badge, Notice, SourceLink } from './UI';

const evidenceRow = z.object({ sourceRow: z.number().int().positive(), raw: z.record(z.string()) });
const evidenceSchema = z.object({
  schemaVersion: z.literal(1),
  dataVersion: z.string(),
  sourceWorkbook: z.string(),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  verification: z.literal('unverified'),
  sources: z.array(evidenceRow),
  benchmarks: z.array(evidenceRow),
});
type Evidence = z.infer<typeof evidenceSchema>;
function useEvidence() {
  const [data, setData] = useState<Evidence | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/reference-data.json`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            `Supplementary source data could not be loaded (HTTP ${response.status}).`,
          );
        return evidenceSchema.parse(await response.json());
      })
      .then(setData)
      .catch((failure: unknown) => {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : 'Supplementary source data could not be validated.',
          );
      });
    return () => controller.abort();
  }, []);
  return { data, error };
}

export function BenchmarkEvidence() {
  const { data, error } = useEvidence();
  const [basis, setBasis] = useState('');
  return (
    <section className="panel spaced-title">
      <div className="section-heading">
        <div>
          <h2>Published market observations</h2>
          <p>
            All {data?.benchmarks.length ?? 17} observations preserved from the source workbook.
          </p>
        </div>
        <Badge tone="amber">Unverified benchmarks</Badge>
      </div>
      <Notice>
        These observations have different dates, products, sizes and commercial terms. USD/foot and
        USD/tonne values remain in their original units. They are not supplier quotations and do not
        feed project cost totals.
      </Notice>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && (
        <p className="muted" role="status">
          Loading source observations…
        </p>
      )}
      {data && (
        <>
          <label className="settings-field">
            Market / commercial basis
            <select
              aria-label="Filter market observations"
              value={basis}
              onChange={(event) => setBasis(event.target.value)}
            >
              <option value="">All source observations</option>
              {[...new Set(data.benchmarks.map((row) => row.raw['Market/Basis']))].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <div className="table-scroll">
            <table className="materials-table evidence-table">
              <thead>
                <tr>
                  {[
                    'Grade / product',
                    'Observation label',
                    'Market / basis',
                    'Range · original units',
                    'Source qualifications',
                    'Reference',
                  ].map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.benchmarks
                  .filter((row) => !basis || row.raw['Market/Basis'] === basis)
                  .map(({ sourceRow, raw }) => (
                    <tr key={sourceRow}>
                      <td>
                        <strong>{raw.Grade}</strong>
                        <div className="small muted">{raw.Product}</div>
                      </td>
                      <td>{raw.Observation || 'Unknown'}</td>
                      <td>{raw['Market/Basis']}</td>
                      <td className="mono">
                        {raw['Low price'] || 'Unknown'}–{raw['High price'] || 'Unknown'}
                        <div className="small">{raw['Price units']}</div>
                      </td>
                      <td>{raw['Important qualifications']}</td>
                      <td>
                        <SourceLink url={raw['Source URL']}>Source · row {sourceRow}</SourceLink>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="table-footnote">
            Source: {data.sourceWorkbook} · PRICE BENCHMARKS. Observation labels are retained
            verbatim; an exact quote date has not been inferred.
          </p>
        </>
      )}
    </section>
  );
}

export function SourceRegister() {
  const { data, error } = useEvidence();
  return (
    <section className="panel spaced-title">
      <div className="section-heading">
        <div>
          <h2>Original source register</h2>
          <p>
            All {data?.sources.length ?? 36} references from the supplied workbook, including
            auxiliary market evidence.
          </p>
        </div>
        <Badge>Source compilation</Badge>
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && (
        <p className="muted" role="status">
          Loading source register…
        </p>
      )}
      {data && (
        <>
          <div className="reference-suppliers">
            {data.sources.map(({ sourceRow, raw }) => (
              <article className="reference-supplier" key={sourceRow}>
                <div>
                  <SourceLink url={raw['Full URL']}>{raw.Reference}</SourceLink>
                  <span className="small muted">
                    {raw['Evidence type']} · workbook row {sourceRow}
                  </span>
                </div>
                <span className="small muted">
                  Source access date: {raw['Access date'] || 'Unknown'}
                </span>
              </article>
            ))}
          </div>
          <p className="table-footnote">
            Evidence-type and access-date labels are original source claims. They do not establish
            current accessibility, verification or applicability.
          </p>
        </>
      )}
    </section>
  );
}
