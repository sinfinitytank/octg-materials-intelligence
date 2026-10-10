import {
  Database,
  Download,
  HardDrive,
  Monitor,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../app/context';
import { APP_VERSION } from '../config';
import { downloadFile } from '../reporting';
import { Badge, Notice, PageTitle } from '../components/UI';

export default function Settings() {
  const { dataset, theme, setTheme, units, setUnits, notify } = useApp();
  let storageAvailable = false;
  try {
    window.localStorage.getItem('octg.theme');
    storageAvailable = true;
  } catch {
    /* Storage restrictions are shown below. */
  }
  return (
    <>
      <PageTitle
        eyebrow="WORKSPACE / PREFERENCES"
        title="Settings"
        description="Set your working environment and inspect the data behind this workspace."
        actions={
          <Badge>
            <SlidersHorizontal size={13} />
            Application {APP_VERSION}
          </Badge>
        }
      />
      <div className="detail-grid settings-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Display & engineering units</h2>
              <p>Preferences are saved on this browser.</p>
            </div>
            <Monitor size={19} />
          </div>
          <label className="settings-field">
            Appearance
            <select
              aria-label="Appearance"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="settings-field">
            Well input unit system
            <select
              aria-label="Well input unit system"
              value={units}
              onChange={(event) => setUnits(event.target.value as 'metric' | 'field')}
            >
              <option value="metric">Metric · MPa, °C, mm, m</option>
              <option value="field">Field · psi, °F, inches, ft</option>
            </select>
          </label>
          <p className="small muted">
            Changing units converts the displayed well inputs. Canonical values remain MPa, °C, mm
            and m. The material catalogue retains source yield in ksi and shows the converted MPa
            value in details. Chloride uses mg/L; ppm by mass requires a solution density.
          </p>
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Local workspace</h2>
              <p>Your saved scenarios and supplier quotations.</p>
            </div>
            <HardDrive size={19} />
          </div>
          <dl className="property-list">
            <div>
              <dt>Browser storage</dt>
              <dd>
                <Badge tone={storageAvailable ? 'teal' : 'amber'}>
                  {storageAvailable ? 'Available' : 'Unavailable or restricted'}
                </Badge>
              </dd>
            </div>
            <div>
              <dt>Scenario schema</dt>
              <dd className="mono">1</dd>
            </div>
            <div>
              <dt>Quotation schema</dt>
              <dd className="mono">1</dd>
            </div>
            <div>
              <dt>Comparison capacity</dt>
              <dd>Four records per comparison</dd>
            </div>
            <div>
              <dt>Data destination</dt>
              <dd>This browser only; no application backend</dd>
            </div>
          </dl>
          <p className="small muted">
            Browser storage is specific to this site and browser profile. Export important scenarios
            before clearing browser data. The application fetches its bundled catalogue and loads no
            third-party manufacturer content until you open a source link.
          </p>
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Dataset identity</h2>
              <p>Versioned provenance for reproducible reports.</p>
            </div>
            <Database size={19} />
          </div>
          <dl className="property-list">
            <div>
              <dt>Data version</dt>
              <dd className="mono">{dataset.dataVersion}</dd>
            </div>
            <div>
              <dt>Schema version</dt>
              <dd>{dataset.schemaVersion}</dd>
            </div>
            <div>
              <dt>Source records</dt>
              <dd>{dataset.materials.length}</dd>
            </div>
            <div>
              <dt>Authoritative source</dt>
              <dd>octg_master_grades.csv</dd>
            </div>
            <div>
              <dt>Source SHA-256</dt>
              <dd className="mono small" style={{ overflowWrap: 'anywhere' }}>
                {dataset.sourceSha256}
              </dd>
            </div>
          </dl>
          <button
            className="button secondary"
            onClick={() => {
              downloadFile(
                `octg-dataset-${dataset.dataVersion}.json`,
                JSON.stringify(dataset, null, 2),
                'application/json',
              );
              notify('Source-preserving dataset exported.');
            }}
          >
            <Download size={15} />
            Export application dataset
          </button>
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Engineering evidence</h2>
              <p>Imported catalogue statements remain unverified.</p>
            </div>
            <ShieldCheck size={19} />
          </div>
          <dl className="property-list">
            <div>
              <dt>Independently verified records</dt>
              <dd>0</dd>
            </div>
            <div>
              <dt>Records requiring verification</dt>
              <dd>{dataset.materials.length}</dd>
            </div>
            <div>
              <dt>Environmental envelopes</dt>
              <dd>Not supplied</dd>
            </div>
            <div>
              <dt>Advanced design models</dt>
              <dd>Not implemented in version 1.0</dd>
            </div>
          </dl>
          <Notice tone="warning">
            A review date, source link, sour-service label or preference point total does not
            establish standards compliance or material qualification.
          </Notice>
          <a
            className="source-link"
            href="https://github.com/sinfinitytank/octg-materials-intelligence/blob/main/docs/PROJECT_CONTEXT.md"
            target="_blank"
            rel="noreferrer"
          >
            Project methodology & continuity documentation
          </a>
        </section>
      </div>
    </>
  );
}
