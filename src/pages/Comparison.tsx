import { APP_VERSION } from '../config';
import { Download, Plus, X, GitCompareArrows, ArrowUpRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useApp } from '../app/context';
import type { Material } from '../types';
import { comparisonCSV, downloadCSV } from '../reporting';
import { navigate } from '../hooks/useRoute';
import { Badge, EmptyState, Notice, PageTitle, SourceLink, Value } from '../components/UI';
import { MaterialDetail } from '../components/MaterialDetail';
interface Row {
  label: string;
  value: (m: Material) => ReactNode;
  raw: (m: Material) => unknown;
}
export default function Comparison() {
  const { dataset, comparison, toggleComparison, clearComparison } = useApp();
  const [selected, setSelected] = useState<Material | null>(null);
  const rows: Row[] = [
    { label: 'Manufacturer', value: (m) => m.manufacturer, raw: (m) => m.manufacturer },
    { label: 'Country / region', value: (m) => m.region, raw: (m) => m.region },
    { label: 'Material family', value: (m) => <Badge>{m.family}</Badge>, raw: (m) => m.family },
    { label: 'Specification', value: (m) => m.specification, raw: (m) => m.specification },
    { label: 'Listing type', value: (m) => m.listingType, raw: (m) => m.listingType },
    {
      label: 'Minimum yield · source, ksi',
      value: (m) => <Value value={m.yieldMinKsi} unit="ksi" />,
      raw: (m) => m.yieldMinKsi,
    },
    {
      label: 'Minimum yield · converted, MPa',
      value: (m) => <Value value={m.yieldMinMPa} unit="MPa" />,
      raw: (m) => m.yieldMinMPa,
    },
    {
      label: 'Maximum yield',
      value: (m) => <Value value={m.properties.yieldMaxMPa} unit="MPa" />,
      raw: (m) => m.properties.yieldMaxMPa,
    },
    {
      label: 'Minimum tensile strength',
      value: (m) => <Value value={m.properties.tensileMinMPa} unit="MPa" />,
      raw: (m) => m.properties.tensileMinMPa,
    },
    {
      label: 'Elongation',
      value: (m) => <Value value={m.properties.elongationPercent} unit="%" />,
      raw: (m) => m.properties.elongationPercent,
    },
    {
      label: 'Hardness / heat treatment',
      value: (m) => (
        <Value
          value={[m.properties.hardness, m.properties.heatTreatment].filter(Boolean).join(' / ')}
        />
      ),
      raw: (m) => m.properties.heatTreatment,
    },
    { label: 'UNS designation', value: (m) => <Value value={m.uns} />, raw: (m) => m.uns },
    {
      label: 'Chemical composition',
      value: (m) =>
        Object.keys(m.properties.chemistry).length ? (
          Object.entries(m.properties.chemistry)
            .map(([k, v]) => `${k}: ${v ?? 'Unknown'}`)
            .join('; ')
        ) : (
          <span className="unknown">Not reported</span>
        ),
      raw: (m) => JSON.stringify(m.properties.chemistry),
    },
    { label: 'H₂S source designation', value: (m) => <Value value={m.h2s} />, raw: (m) => m.h2s },
    { label: 'CO₂ source designation', value: (m) => <Value value={m.co2} />, raw: (m) => m.co2 },
    {
      label: 'Temperature / chloride limits',
      value: () => <span className="unknown">Not reported</span>,
      raw: () => null,
    },
    {
      label: 'Environmental qualification',
      value: () => <Badge tone="amber">No verified envelope</Badge>,
      raw: () => null,
    },
    {
      label: 'Collapse designation',
      value: (m) =>
        m.collapse === 'enhanced' ? (
          'Enhanced · source designation'
        ) : (
          <span className="unknown">Not stated</span>
        ),
      raw: (m) => m.collapse,
    },
    {
      label: 'Relative cost tier',
      value: (m) => <Value value={m.costTier} />,
      raw: (m) => m.costTier,
    },
    {
      label: 'Manufacturer price',
      value: () => 'Manufacturer quotation required',
      raw: () => null,
    },
    {
      label: 'Data verification',
      value: () => <Badge tone="amber">Unverified source record</Badge>,
      raw: () => null,
    },
    {
      label: 'Source reference',
      value: (m) => <SourceLink url={m.source.url} />,
      raw: (m) => m.source.url,
    },
    {
      label: 'CSV provenance',
      value: (m) => `${m.source.file} · row ${m.source.row}`,
      raw: (m) => m.source.row,
    },
  ];
  return (
    <>
      <PageTitle
        eyebrow="MATERIALS / SIDE-BY-SIDE REVIEW"
        title="Material comparison"
        description="Review up to four grades side by side with missing values and source evidence."
        actions={
          <>
            {comparison.length > 0 && (
              <>
                <button className="button secondary" onClick={clearComparison}>
                  Clear comparison
                </button>
                <button
                  className="button primary"
                  onClick={() =>
                    downloadCSV(
                      'octg-material-comparison.csv',
                      comparisonCSV(comparison, {
                        appVersion: APP_VERSION,
                        dataVersion: dataset.dataVersion,
                      }),
                    )
                  }
                >
                  <Download size={15} />
                  Export comparison
                </button>
              </>
            )}
          </>
        }
      />
      {comparison.length === 0 ? (
        <section className="panel">
          <EmptyState
            title="Build your material comparison"
            action={
              <button className="button primary" onClick={() => navigate('/database')}>
                <Plus size={16} />
                Choose materials
              </button>
            }
          >
            Add records from the materials database or screening results. Compare source properties,
            service designations, and evidence side by side.
          </EmptyState>
          <div className="comparison-empty-steps">
            <span>
              <strong>01</strong>Find a grade
            </span>
            <span>
              <strong>02</strong>Add to comparison
            </span>
            <span>
              <strong>03</strong>Review evidence
            </span>
          </div>
        </section>
      ) : (
        <>
          <Notice>
            Displayed source properties are unverified; converted MPa values are derived from source
            ksi. Missing values remain unknown and are never scored as zero. Highlighted rows
            contain different reported values.
          </Notice>
          <div className="comparison-count">
            <GitCompareArrows size={17} />
            <strong>{comparison.length} / 4</strong> materials selected
            {comparison.length < 4 && (
              <button className="text-link" onClick={() => navigate('/database')}>
                Add another material
                <Plus size={14} />
              </button>
            )}
          </div>
          <section className="panel comparison-panel">
            <div className="table-scroll">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Material properties</th>
                    {comparison.map((m) => (
                      <th key={m.id}>
                        <button
                          className="remove-comparison"
                          aria-label={`Remove ${m.grade} from comparison`}
                          onClick={() => toggleComparison(m)}
                        >
                          <X size={14} />
                        </button>
                        <span>{m.manufacturer}</span>
                        <button className="comparison-grade" onClick={() => setSelected(m)}>
                          {m.grade}
                          <ArrowUpRight size={14} />
                        </button>
                        <small>{m.family}</small>
                      </th>
                    ))}
                    {comparison.length < 4 && (
                      <th className="add-comparison">
                        <button onClick={() => navigate('/database')}>
                          <Plus size={22} />
                          <span>Add material</span>
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const reported = comparison
                      .map(row.raw)
                      .filter((v) => v !== null && v !== undefined && v !== '');
                    const differs = new Set(reported).size > 1;
                    return (
                      <tr key={row.label} className={differs ? 'difference-row' : ''}>
                        <th>
                          {differs && <span className="difference-dot" />}
                          {row.label}
                        </th>
                        {comparison.map((m) => (
                          <td key={m.id}>{row.value(m)}</td>
                        ))}
                        {comparison.length < 4 && <td />}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <p className="table-footnote">
            Source values ≠ verified properties. Qualification and size-specific design checks must
            be completed for the actual product and service.
          </p>
        </>
      )}
      {selected && <MaterialDetail material={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
