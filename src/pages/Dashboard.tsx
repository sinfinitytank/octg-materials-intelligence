import {
  ArrowRight,
  ArrowUpRight,
  Database,
  Factory,
  ShieldCheck,
  Layers3,
  Search,
  ChevronRight,
  FileCheck2,
  CircleDot,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '../app/context';
import { navigate } from '../hooks/useRoute';
import { Badge, PageTitle } from '../components/UI';
const palette = [
  '#117f79',
  '#278f88',
  '#45a39a',
  '#70b7ac',
  '#a2cdc0',
  '#bbc3af',
  '#b9b09a',
  '#928f86',
];
export default function Dashboard() {
  const { dataset } = useApp();
  const materials = dataset.materials;
  const manufacturers = [
    ...new Set(materials.map((m) => m.manufacturer).filter((name) => name !== 'API reference')),
  ];
  const families = Object.entries(
    materials.reduce<Record<string, number>>((a, m) => {
      a[m.family] = (a[m.family] || 0) + 1;
      return a;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const suppliers = manufacturers
    .map((name) => ({ name, value: materials.filter((m) => m.manufacturer === name).length }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
  const sourceLinked = materials.filter((m) => m.source.url).length;
  const api5ct = materials.filter((m) => /5ct/i.test(m.specification)).length;
  const api5cra = materials.filter((m) => /5cra|13680/i.test(m.specification)).length;
  const proprietary = materials.filter((m) => /proprietary/i.test(m.listingType)).length;
  const strengths = [
    { name: '< 80 ksi', min: 0, max: 80 },
    { name: '80–109 ksi', min: 80, max: 110 },
    { name: '110–124 ksi', min: 110, max: 125 },
    { name: '≥ 125 ksi', min: 125, max: Infinity },
  ].map((b) => ({
    ...b,
    value: materials.filter(
      (m) => m.yieldMinKsi !== null && m.yieldMinKsi >= b.min && m.yieldMinKsi < b.max,
    ).length,
  }));
  const unknownStrength = materials.filter((m) => m.yieldMinKsi === null).length;
  return (
    <>
      <PageTitle
        eyebrow="WORKSPACE / OVERVIEW"
        title="Materials intelligence"
        description="A clearer view of your OCTG materials, evidence, and engineering decisions."
        actions={
          <button className="button secondary" onClick={() => navigate('/database')}>
            <Search size={16} />
            Explore database
            <ArrowUpRight size={15} />
          </button>
        }
      />
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="live-dot" />
            OCTG MATERIALS / VERSION 1.0
          </div>
          <h2>
            Better decisions.
            <br />
            <span>Grounded in evidence.</span>
          </h2>
          <p>
            Explore the global grade library. Define your well.
            <br className="desktop-break" /> Build a transparent, traceable material shortlist.
          </p>
          <div className="hero-actions">
            <button className="button mint" onClick={() => navigate('/selection')}>
              Start material screening
              <ArrowRight size={16} />
            </button>
            <a href="#/well" className="hero-link">
              Define well conditions
              <ChevronRight size={16} />
            </a>
          </div>
        </div>
        <div className="pipe-illustration" aria-hidden="true">
          <svg viewBox="0 0 460 270">
            <defs>
              <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#607679" />
                <stop offset=".35" stopColor="#253e46" />
                <stop offset=".72" stopColor="#112b35" />
                <stop offset="1" stopColor="#456267" />
              </linearGradient>
              <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
                <path d="M26 0H0V26" fill="none" stroke="#7babad" strokeWidth=".4" />
              </pattern>
            </defs>
            <path d="M0 0H460V270H0Z" fill="url(#grid)" opacity=".2" />
            <path
              d="M80 155L265 48Q310 20 344 40L410 79Q440 99 416 122L229 231Q194 251 163 232L91 191Q64 176 80 155Z"
              fill="url(#metal)"
              stroke="#658b8b"
            />
            <path
              d="M251 57L78 158M270 68L95 170M294 82L118 184M319 97L143 198M343 112L166 212"
              stroke="#adc8c1"
              opacity=".2"
            />
            <ellipse
              cx="375"
              cy="87"
              rx="61"
              ry="39"
              transform="rotate(30 375 87)"
              fill="#4c696a"
              stroke="#95b2a9"
            />
            <ellipse
              cx="375"
              cy="87"
              rx="47"
              ry="27"
              transform="rotate(30 375 87)"
              fill="#102932"
              stroke="#829e96"
            />
            <ellipse
              cx="375"
              cy="87"
              rx="37"
              ry="20"
              transform="rotate(30 375 87)"
              fill="#061923"
            />
            <path
              d="M83 155L49 132M226 237L244 258M49 132L244 258M46 131L38 126M243 258L251 263"
              stroke="#82b3aa"
              strokeWidth=".8"
              fill="none"
            />
            <path
              d="M310 29L325 9H423M411 132L432 147V197"
              stroke="#82b3aa"
              strokeWidth=".8"
              fill="none"
            />
            <circle cx="310" cy="29" r="2" fill="#b8e0ca" />
            <circle cx="411" cy="132" r="2" fill="#b8e0ca" />
            <text x="337" y="22" fill="#a0c1b7" fontSize="9" fontFamily="monospace">
              OCTG / SECTION 01
            </text>
            <text x="252" y="251" fill="#a0c1b7" fontSize="9" fontFamily="monospace">
              CASING + TUBING
            </text>
            <text x="418" y="217" fill="#a0c1b7" fontSize="9" fontFamily="monospace">
              OD
            </text>
          </svg>
          <span className="drawing-caption">ENGINEERING STARTS WITH THE RIGHT MATERIAL.</span>
        </div>
      </section>
      <div className="stats-grid">
        {[
          {
            icon: Database,
            value: materials.length,
            label: 'Material records',
            sub: 'Preserved from your source library',
          },
          {
            icon: Factory,
            value: manufacturers.length,
            label: 'Manufacturer labels',
            sub: 'Plus standardized API references',
          },
          {
            icon: Layers3,
            value: families.length,
            label: 'Material families',
            sub: 'Carbon steel through nickel alloys',
          },
          {
            icon: ShieldCheck,
            value: 0,
            label: 'Independently verified',
            sub: `${materials.length} records need verification`,
            warning: true,
          },
        ].map(({ icon: Icon, ...stat }) => (
          <button
            className={`stat-card ${stat.warning ? 'stat-warning' : ''}`}
            key={stat.label}
            onClick={() =>
              navigate(stat.warning ? '/database?verification=unverified' : '/database')
            }
          >
            <div className="stat-label">
              <span>{stat.label}</span>
              <Icon size={17} />
            </div>
            <div className="stat-value">
              {stat.value}
              <span>{stat.warning ? ' / ' + materials.length : ''}</span>
            </div>
            <div className="stat-sub">
              {stat.warning && <span className="amber-dot" />}
              {stat.sub}
            </div>
          </button>
        ))}
      </div>
      <div className="dashboard-charts">
        <section className="panel supplier-panel">
          <div className="section-heading">
            <div>
              <h2>Global supplier coverage</h2>
              <p>Leading manufacturers by source record count</p>
            </div>
            <Badge>{manufacturers.length} labels</Badge>
          </div>
          <div className="supplier-chart">
            <ResponsiveContainer width="100%" height={258}>
              <BarChart
                data={suppliers}
                layout="vertical"
                margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
                barSize={15}
              >
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8b9698', fontSize: 11 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={123}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6d7c80', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(17,127,121,.06)' }}
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    color: 'var(--text)',
                  }}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey="value"
                  name="Records"
                  radius={[0, 3, 3, 0]}
                  onClick={(_, index) =>
                    navigate('/database?manufacturer=' + encodeURIComponent(suppliers[index].name))
                  }
                >
                  {suppliers.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#117f79' : '#a8cec4'} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="panel-footer">
            Select a supplier to explore its records
            <ArrowUpRight size={14} />
          </div>
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Material family mix</h2>
              <p>Alloy coverage across the complete library</p>
            </div>
            <Layers3 size={17} className="muted" />
          </div>
          <div className="family-segment-bar">
            {families.map(([name, count], i) => (
              <button
                key={name}
                title={`${name}: ${count}`}
                aria-label={`Explore ${name}: ${count} records`}
                style={{
                  width: `${(count / materials.length) * 100}%`,
                  background: palette[i % palette.length],
                }}
                onClick={() => navigate('/database?family=' + encodeURIComponent(name))}
              />
            ))}
          </div>
          <div className="family-list">
            {families.map(([name, count], i) => (
              <button
                key={name}
                onClick={() => navigate('/database?family=' + encodeURIComponent(name))}
              >
                <span className="family-label">
                  <i style={{ background: palette[i % palette.length] }} />
                  {name}
                </span>
                <span className="mono">
                  {count}
                  <span className="family-percent">
                    {((count / materials.length) * 100).toFixed(0)}%
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="panel-footer">
            Source classifications; no inferred alloy chemistry
            <CircleDot size={14} />
          </div>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Strength distribution</h2>
              <p>Source minimum yield strength · ksi</p>
            </div>
            <span className="small muted">{unknownStrength} unknown</span>
          </div>
          <div className="strength-bars">
            {strengths.map((s, i) => (
              <button
                key={s.name}
                onClick={() =>
                  navigate(
                    `/database?yieldMin=${s.min}&yieldMax=${s.max === Infinity ? '' : s.max - 0.001}`,
                  )
                }
              >
                <span>{s.value}</span>
                <div className="strength-bar-track">
                  <i
                    style={{
                      height: `${Math.max(5, (s.value / Math.max(...strengths.map((b) => b.value))) * 90)}px`,
                      background: palette[i],
                    }}
                  />
                </div>
                <small>{s.name}</small>
              </button>
            ))}
          </div>
        </section>
        <section className="panel evidence-panel">
          <div className="section-heading">
            <div>
              <h2>Evidence & traceability</h2>
              <p>Know what the source can support</p>
            </div>
            <FileCheck2 size={19} />
          </div>
          <div className="evidence-row">
            <span>Records with source links</span>
            <strong>
              {sourceLinked}
              <span> / {materials.length}</span>
            </strong>
          </div>
          <div className="progress-track">
            <i style={{ width: `${(sourceLinked / materials.length) * 100}%` }} />
          </div>
          <p className="evidence-note">
            A source link is a starting point. All imported records remain{' '}
            <strong>unverified</strong> until documentation and applicability are reviewed.
          </p>
          <div className="catalog-counts">
            <span>
              <strong>{api5ct}</strong> 5CT context
            </span>
            <span>
              <strong>{api5cra}</strong> 5CRA / ISO context
            </span>
            <span>
              <strong>{proprietary}</strong> proprietary listings
            </span>
          </div>
          <a href="#/references" className="text-link">
            Review engineering references
            <ArrowRight size={15} />
          </a>
        </section>
      </div>
      <div className="workspace-footer">
        <span>Source-linked catalogue. Engineering qualification requires separate review.</span>
        <span className="mono">DATA / {dataset.dataVersion}</span>
      </div>
    </>
  );
}
