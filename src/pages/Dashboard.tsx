import WellSchematic from '../components/WellSchematic';
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
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApp } from '../app/context';
import { navigate } from '../hooks/useRoute';
import { Badge, PageTitle } from '../components/UI';
const palette = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
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
        description="A traceable workflow from well conditions to candidate review."
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
          <h2>
            Start with the
            <br />
            service conditions.
          </h2>
          <p>
            Set the design basis, screen grades and compare supporting evidence.
          </p>
          <div className="hero-actions">
            <button className="button mint" onClick={() => navigate('/selection')}>
              Screen materials
              <ArrowRight size={16} />
            </button>
            <a href="#/well" className="hero-link">
              Edit well basis
              <ChevronRight size={16} />
            </a>
          </div>
        </div>
        <div className="schematic-inset">
          <WellSchematic />
        </div>
      </section>
      <nav className="workflow-strip" aria-label="Material selection workflow">
        <a href="#/well">
          <span>01</span>
          <div>
            <strong>Define the well</strong>
            <small>Environment & design loads</small>
          </div>
          <ArrowRight size={16} />
        </a>
        <a href="#/selection">
          <span>02</span>
          <div>
            <strong>Screen materials</strong>
            <small>Suitability & qualification gaps</small>
          </div>
          <ArrowRight size={16} />
        </a>
        <a href="#/comparison">
          <span>03</span>
          <div>
            <strong>Compare candidates</strong>
            <small>Properties & source evidence</small>
          </div>
          <ArrowRight size={16} />
        </a>
      </nav>
      <div className="stats-grid">
        {[
          {
            icon: Database,
            value: materials.length,
            label: 'Material records',
            sub: 'Source catalogue',
          },
          {
            icon: Factory,
            value: manufacturers.length,
            label: 'Manufacturers',
            sub: 'Catalogue contributors',
          },
          {
            icon: Layers3,
            value: families.length,
            label: 'Material families',
            sub: 'Source classifications',
          },
          {
            icon: ShieldCheck,
            value: 0,
            label: 'Verified records',
            sub: 'Source review required',
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
              <h2>Manufacturer records</h2>
              <p>Largest catalogue contributors</p>
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
                  tick={{ fill: 'var(--muted)', fontSize: 'var(--type-caption)' }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={123}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--subtle)', fontSize: 'var(--type-caption)' }}
                />
                <Tooltip
                  cursor={{ fill: 'color-mix(in srgb, var(--teal) 8%, transparent)' }}
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-medium)',
                    color: 'var(--text)',
                  }}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey="value"
                  name="Records"
                  radius={[0, 4, 4, 0]}
                  onClick={(_, index) =>
                    navigate('/database?manufacturer=' + encodeURIComponent(suppliers[index].name))
                  }
                >
                  {suppliers.map((_, i) => (
                    <Cell key={i} fill={palette[i % palette.length]} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Material family mix</h2>
              <p>Catalogue classifications</p>
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
              <p>Source coverage and review status</p>
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
            Source links aid traceability. Review records for applicability before qualification.
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
    </>
  );
}
