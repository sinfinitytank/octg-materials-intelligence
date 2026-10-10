import { GitCompareArrows, ExternalLink } from 'lucide-react';
import type { Material } from '../types';
import { useApp } from '../app/context';
import { Badge, Modal, Notice, SourceLink, Value, Unknown } from './UI';
export function MaterialDetail({
  material: m,
  onClose,
}: {
  material: Material;
  onClose: () => void;
}) {
  const { comparison, toggleComparison } = useApp();
  const details: [string, React.ReactNode][] = [
    ['Manufacturer', m.manufacturer],
    ['Country / region', m.region],
    ['Material family', m.family],
    ['Specification', m.specification],
    ['Listing type', m.listingType],
    ['UNS designation', <Value value={m.uns} />],
    ['Application', m.application],
    [
      'CRA group / category',
      <Value value={[m.craGroup, m.craCategory].filter(Boolean).join(' / ')} />,
    ],
  ];
  return (
    <Modal title={`${m.manufacturer} ${m.grade}`} onClose={onClose}>
      <div className="record-heading">
        <div>
          <h2>{m.grade}</h2>
          <p>
            {m.manufacturer} <span>·</span> {m.family}
          </p>
        </div>
        <Badge tone="amber">Unverified source record</Badge>
      </div>
      <button className="button secondary" onClick={() => toggleComparison(m)}>
        <GitCompareArrows size={16} />
        {comparison.some((c) => c.id === m.id) ? 'Remove from comparison' : 'Add to comparison'}
      </button>
      <Notice>
        Source designations support preliminary screening. This record has no verified environmental
        operating envelope or documented standards qualification.
      </Notice>
      <div className="detail-grid">
        <section>
          <h3>Identification</h3>
          <dl className="property-list">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || <Unknown />}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section>
          <h3>Mechanical properties</h3>
          <dl className="property-list">
            <div>
              <dt>Minimum yield · source</dt>
              <dd>
                <Value value={m.yieldMinKsi} unit="ksi" />
              </dd>
            </div>
            <div>
              <dt>Minimum yield · converted</dt>
              <dd>
                <Value value={m.yieldMinMPa} unit="MPa" />
              </dd>
            </div>
            <div>
              <dt>Maximum yield</dt>
              <dd>
                <Value value={m.properties.yieldMaxMPa} unit="MPa" />
              </dd>
            </div>
            <div>
              <dt>Minimum tensile</dt>
              <dd>
                <Value value={m.properties.tensileMinMPa} unit="MPa" />
              </dd>
            </div>
            <div>
              <dt>Elongation</dt>
              <dd>
                <Value value={m.properties.elongationPercent} unit="%" />
              </dd>
            </div>
            <div>
              <dt>Hardness</dt>
              <dd>
                <Value value={m.properties.hardness} />
              </dd>
            </div>
            <div>
              <dt>Heat treatment</dt>
              <dd>
                <Value value={m.properties.heatTreatment} />
              </dd>
            </div>
            <div>
              <dt>Collapse designation</dt>
              <dd>{m.collapse === 'enhanced' ? 'Enhanced · source designation' : <Unknown />}</dd>
            </div>
          </dl>
        </section>
        <section>
          <h3>Corrosion & service</h3>
          <dl className="property-list">
            <div>
              <dt>Service listing</dt>
              <dd>
                <Value value={m.service} />
              </dd>
            </div>
            <div>
              <dt>H₂S designation</dt>
              <dd>
                <Value value={m.h2s} />
              </dd>
            </div>
            <div>
              <dt>CO₂ designation</dt>
              <dd>
                <Value value={m.co2} />
              </dd>
            </div>
            <div>
              <dt>Temperature envelope</dt>
              <dd>
                <Unknown />
              </dd>
            </div>
            <div>
              <dt>Chloride limits</dt>
              <dd>
                <Unknown />
              </dd>
            </div>
            <div>
              <dt>Qualification envelope</dt>
              <dd>
                <Unknown />
              </dd>
            </div>
          </dl>
        </section>
        <section>
          <h3>Chemical composition</h3>
          {Object.keys(m.properties.chemistry).length ? (
            <dl className="property-list">
              {Object.entries(m.properties.chemistry).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>
                    <Value value={value} />
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="muted">
              Chemical composition was not provided by the source dataset. No nominal chemistry has
              been assigned.
            </p>
          )}
          <h3 className="spaced-title">Commercial information</h3>
          <dl className="property-list">
            <div>
              <dt>Relative tier</dt>
              <dd>
                <Value value={m.costTier} />
              </dd>
            </div>
            <div>
              <dt>Manufacturer price</dt>
              <dd>Quotation required</dd>
            </div>
          </dl>
          <p className="small muted">{m.pricing.evidence}</p>
        </section>
      </div>
      <section className="detail-source">
        <h3>Source & traceability</h3>
        <SourceLink url={m.source.url}>
          <ExternalLink size={14} />
          Manufacturer / source reference
        </SourceLink>
        <dl className="property-list">
          <div>
            <dt>Source file / CSV row</dt>
            <dd>
              {m.source.file} · {m.source.row}
            </dd>
          </div>
          <div>
            <dt>Original source status</dt>
            <dd>{m.source.status}</dd>
          </div>
          <div>
            <dt>Source review date · unverified</dt>
            <dd>
              <Value value={m.source.reviewedAt} />
            </dd>
          </div>
          <div>
            <dt>Record ID</dt>
            <dd className="mono small">{m.id}</dd>
          </div>
        </dl>
        {m.notes && <p>{m.notes}</p>}
        <ul className="limitations">
          {m.limitations.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </section>
      <details className="raw-record">
        <summary>Inspect original source fields</summary>
        <dl className="property-list">
          {Object.entries(m.raw).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value || <Unknown />}</dd>
            </div>
          ))}
        </dl>
      </details>
    </Modal>
  );
}
