import { APP_VERSION } from '../config';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Download,
  GitCompareArrows,
  SlidersHorizontal,
  Printer,
  Search,
  ShieldAlert,
  CircleHelp,
  XCircle,
  CheckCircle2,
  FileQuestion,
  ArrowUpRight,
} from 'lucide-react';
import type { Eligibility, Material } from '../types';
import { useApp } from '../app/context';
import { screenMaterials } from '../engineering/selection';
import { validateScenario } from '../services/scenarios';
import { shortlistCSV, downloadCSV, printEngineeringSummary } from '../reporting';
import { navigate } from '../hooks/useRoute';
import { Badge, Notice, PageTitle, Value } from '../components/UI';
import { MaterialDetail } from '../components/MaterialDetail';
const categories: { name: Eligibility; short: string; tone: string; icon: typeof ShieldAlert }[] = [
  {
    name: 'Potential technical candidate',
    short: 'Potential candidates',
    tone: 'teal',
    icon: CheckCircle2,
  },
  {
    name: 'Further qualification required',
    short: 'Qualification required',
    tone: 'amber',
    icon: ShieldAlert,
  },
  {
    name: 'Insufficient information',
    short: 'Insufficient information',
    tone: 'neutral',
    icon: FileQuestion,
  },
  {
    name: 'Mechanical incompatibility',
    short: 'Mechanical exclusions',
    tone: 'red',
    icon: XCircle,
  },
];
export default function Selection() {
  const { dataset, well, comparison, toggleComparison, numericErrors, notify } = useApp();
  const [status, setStatus] = useState('review');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<Material | null>(null);
  const errors = [...validateScenario(well), ...Object.values(numericErrors)];
  const valid = errors.length === 0;
  const results = useMemo(
    () => (valid ? screenMaterials(dataset.materials, well) : []),
    [dataset, well, valid],
  );
  const filtered = results.filter(
    (a) =>
      (status === 'all' ||
        (status === 'review'
          ? a.eligibility !== 'Mechanical incompatibility'
          : a.eligibility === status)) &&
      `${a.material.grade} ${a.material.manufacturer} ${a.material.family}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const metadata = { appVersion: APP_VERSION, dataVersion: dataset.dataVersion };
  return (
    <>
      <PageTitle
        eyebrow="ENGINEERING / TRANSPARENT SCREENING"
        title="Material selection"
        description="Apply the well basis, then review candidates, exclusions and open gaps."
        actions={
          <>
            <button className="button secondary" onClick={() => navigate('/well')}>
              <SlidersHorizontal size={15} />
              Edit conditions
            </button>
            <button
              className="button primary"
              disabled={!valid || !filtered.length}
              onClick={() =>
                downloadCSV('octg-ranked-shortlist.csv', shortlistCSV(filtered, well, metadata))
              }
            >
              <Download size={15} />
              Export shortlist
            </button>
          </>
        }
      />
      <div className="selection-basis">
        <div>
          <div className="eyebrow">ACTIVE WELL SCENARIO</div>
          <h2>{well.name}</h2>
          <div className="basis-tags">
            <span>
              {well.product} · {well.location}
            </span>
            <span>
              Yield ≥ <Value value={well.requiredYieldMPa} unit="MPa" />
            </span>
            <span>
              H₂S <Value value={well.h2sMPa} unit="MPa" />
            </span>
            <span>
              Max <Value value={well.maxTemperatureC} unit="°C" />
            </span>
            {well.illustrative && <Badge tone="amber">Illustrative</Badge>}
          </div>
        </div>
        <button className="text-link" onClick={() => navigate('/well')}>
          View full design basis
          <ArrowUpRight size={15} />
        </button>
      </div>
      <Notice>
        <strong>Preliminary screening only.</strong> Source labels do not establish ISO 15156 / NACE
        MR0175 qualification. Preference points never override an exclusion.
      </Notice>
      {!valid ? (
        <section className="panel validation-errors" role="alert">
          <h2>Correct the well inputs before screening</h2>
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
          <button className="button primary" onClick={() => navigate('/well')}>
            Return to well conditions
            <ArrowRight size={15} />
          </button>
        </section>
      ) : (
        <>
          <div className="eligibility-grid">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.name}
                  className={`eligibility-card ${status === c.name ? 'active' : ''} tone-${c.tone}`}
                  onClick={() => {
                    setStatus(c.name);
                    setLimit(20);
                  }}
                  aria-pressed={status === c.name}
                >
                  <div>
                    <Icon size={17} />
                    <span>{c.short}</span>
                  </div>
                  <strong>{results.filter((a) => a.eligibility === c.name).length}</strong>
                  <span className="small">
                    {c.name === 'Mechanical incompatibility'
                      ? 'Excluded from candidate list'
                      : 'Select to inspect records'}
                    <ArrowUpRight size={12} />
                  </span>
                </button>
              );
            })}
          </div>
          <section className="panel selection-results">
            <div className="selection-toolbar">
              <div className="segmented">
                <button
                  className={status === 'review' ? 'active' : ''}
                  onClick={() => {
                    setStatus('review');
                    setLimit(20);
                  }}
                >
                  Candidates & review
                </button>
                <button
                  className={status === 'Mechanical incompatibility' ? 'active' : ''}
                  onClick={() => {
                    setStatus('Mechanical incompatibility');
                    setLimit(20);
                  }}
                >
                  Exclusions
                </button>
                <button
                  className={status === 'all' ? 'active' : ''}
                  onClick={() => {
                    setStatus('all');
                    setLimit(20);
                  }}
                >
                  All records
                </button>
              </div>
              <div className="search-field compact">
                <Search size={15} />
                <input
                  placeholder="Find in results…"
                  aria-label="Search screening results"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setLimit(20);
                  }}
                />
              </div>
            </div>
            <div className="table-meta">
              <span>
                <strong>{filtered.length}</strong>{' '}
                {status === 'review'
                  ? 'records for engineering review'
                  : status === 'Mechanical incompatibility'
                    ? 'mechanical exclusions'
                    : status === 'all'
                      ? 'screened source records'
                      : status.toLowerCase()}
              </span>
              <span>Eligibility first · preference points second</span>
            </div>
            {filtered.length === 0 ? (
              <div className="table-empty">
                <h3>No records in this category</h3>
                <p>Try another eligibility category or search term.</p>
              </div>
            ) : (
              filtered.slice(0, limit).map((a, index) => {
                const checked = comparison.some((m) => m.id === a.material.id);
                const category = categories.find((c) => c.name === a.eligibility)!;
                return (
                  <article className="assessment" key={a.material.id}>
                    <div className="assessment-top">
                      <span className="assessment-index mono">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="assessment-name">
                        <button onClick={() => setSelected(a.material)}>
                          {a.material.grade}
                          <ArrowUpRight size={13} />
                        </button>
                        <p>
                          {a.material.manufacturer} <span>·</span> {a.material.family}
                        </p>
                      </div>
                      <Badge tone={category.tone}>{a.eligibility}</Badge>
                      <button
                        className={`button small-button ${checked ? 'selected' : 'secondary'}`}
                        onClick={() => toggleComparison(a.material)}
                        aria-pressed={checked}
                      >
                        <GitCompareArrows size={14} />
                        {checked ? 'Added' : 'Compare'}
                      </button>
                    </div>
                    <div className="assessment-metrics">
                      <div>
                        <span>Minimum yield</span>
                        <strong>
                          <Value value={a.material.yieldMinMPa} unit="MPa" />
                        </strong>
                      </div>
                      <div>
                        <span>Collapse designation</span>
                        <strong>
                          {a.material.collapse === 'enhanced'
                            ? 'Enhanced · unverified'
                            : 'Not stated'}
                        </strong>
                      </div>
                      <div>
                        <span>Relative cost tier</span>
                        <strong>
                          <Value value={a.material.costTier} />
                        </strong>
                      </div>
                      <div>
                        <span>Information availability</span>
                        <strong>
                          {a.completeness}%
                          <CircleHelp size={12}>
                            <title>
                              Availability of selected source fields; not confidence or
                              qualification
                            </title>
                          </CircleHelp>
                        </strong>
                      </div>
                      <div>
                        <span>Preference points</span>
                        <strong className="preference-value">
                          {a.ranking.score}
                          <small> points</small>
                        </strong>
                      </div>
                    </div>
                    <div className="assessment-reason">
                      <ShieldAlert size={15} />
                      <span>{a.reasons[0]}</span>
                    </div>
                    <details className="assessment-explanation">
                      <summary>
                        Why this result? <span>Screening evidence, gaps & ranking factors</span>
                        <ChevronDown size={14} />
                      </summary>
                      <div className="explanation-grid">
                        <section>
                          <h3>Engineering screening</h3>
                          <ul>
                            {a.reasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                          <h3>Required investigations</h3>
                          <ul>
                            {a.cautions.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </section>
                        <section>
                          <h3>Preference ranking</h3>
                          <dl className="ranking-factors">
                            {a.ranking.factors.map((f, i) => (
                              <div key={i}>
                                <dt>{f.label}</dt>
                                <dd>
                                  {f.points > 0 ? '+' : ''}
                                  {f.points}
                                </dd>
                              </div>
                            ))}
                          </dl>
                          <p className="small muted">
                            Points indicate stated preferences only. They are not a safety
                            probability, corrosion prediction, qualification score, or life
                            estimate.
                          </p>
                          <Badge tone="amber">All imported source fields are unverified</Badge>
                        </section>
                      </div>
                    </details>
                  </article>
                );
              })
            )}
            {filtered.length > limit && (
              <button className="load-more" onClick={() => setLimit(limit + 20)}>
                Show next {Math.min(20, filtered.length - limit)} records
                <ChevronDown size={15} />
              </button>
            )}
            <div className="selection-report">
              <div>
                <Printer size={18} />
                <span>
                  <strong>Engineering summary</strong>
                  <small>
                    Design basis, first {Math.min(20, filtered.length)} current results,
                    explanations, source references & versions
                  </small>
                </span>
              </div>
              <button
                className="button secondary"
                disabled={!filtered.length}
                onClick={() => {
                  if (!printEngineeringSummary(well, filtered.slice(0, 20), metadata))
                    notify(
                      'The report window was blocked. Allow popups for this site and try again.',
                    );
                }}
              >
                <Printer size={15} />
                Print summary
              </button>
            </div>
          </section>
        </>
      )}
      {selected && <MaterialDetail material={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
