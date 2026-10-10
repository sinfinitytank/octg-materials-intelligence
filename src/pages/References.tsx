import { ArrowUpRight, BookOpen, FileText, Link2 } from 'lucide-react';
import { REFERENCES } from '../data/references';
import { useApp } from '../app/context';
import { Badge, Notice, PageTitle, SourceLink } from '../components/UI';
import { navigate } from '../hooks/useRoute';
import { SourceRegister } from '../components/SourceEvidence';

export default function References() {
  const { dataset } = useApp();
  const manufacturers = [...new Set(dataset.materials.map((m) => m.manufacturer))].sort();
  return (
    <>
      <PageTitle
        eyebrow="KNOWLEDGE / STANDARDS & SOURCES"
        title="Engineering references"
        description="Follow the evidence from a catalogue record to its applicable technical requirements."
        actions={
          <Badge>
            <BookOpen size={13} />
            Official catalogue links
          </Badge>
        }
      />
      <Notice>
        Use the controlled standard and applicable product specification for a qualification
        decision. These summaries identify scope; they do not reproduce or replace the standards.
      </Notice>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Standards register</h2>
            <p>
              Catalogue metadata reviewed 10 October 2026. Editions and amendments need
              project-specific confirmation.
            </p>
          </div>
          <FileText size={20} />
        </div>
        <div className="reference-list">
          {REFERENCES.map((reference) => (
            <article className="reference-entry" key={reference.designation}>
              <div className="reference-entry-top">
                <h3>{reference.designation}</h3>
                <SourceLink url={reference.url}>Official source</SourceLink>
              </div>
              <p className="reference-title">{reference.title}</p>
              <dl className="property-list">
                <div>
                  <dt>Application</dt>
                  <dd>{reference.application}</dd>
                </div>
                <div>
                  <dt>Material scope</dt>
                  <dd>{reference.families}</dd>
                </div>
                <div>
                  <dt>Catalogue edition</dt>
                  <dd>{reference.edition || 'Controlled edition to be confirmed'}</dd>
                </div>
              </dl>
              <p className="small muted">{reference.notes}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="panel spaced-title">
        <div className="section-heading">
          <div>
            <h2>Manufacturer & catalogue sources</h2>
            <p>
              Source labels retained exactly. Links provide traceability, not independent
              verification.
            </p>
          </div>
          <Link2 size={18} />
        </div>
        <div className="reference-suppliers">
          {manufacturers.map((manufacturer) => {
            const records = dataset.materials.filter(
              (material) => material.manufacturer === manufacturer,
            );
            const sources = [
              ...new Set(
                records
                  .map((material) => material.source.url)
                  .filter((url): url is string => !!url),
              ),
            ];
            return (
              <article className="reference-supplier" key={manufacturer}>
                <div>
                  <button
                    className="text-link"
                    onClick={() =>
                      navigate(`/database?manufacturer=${encodeURIComponent(manufacturer)}`)
                    }
                  >
                    {manufacturer}
                    <ArrowUpRight size={13} />
                  </button>
                  <span className="small muted">{records.length} source records</span>
                </div>
                <div>
                  {sources.map((url, index) => (
                    <SourceLink key={url} url={url}>
                      Source {index + 1}
                    </SourceLink>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <SourceRegister />
      <p className="table-footnote">
        Third-party standards, manufacturer documents and trademarks retain their applicable rights.
        The software license does not grant redistribution rights to the source compilation.
      </p>
    </>
  );
}
