import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Download,
  FolderOpen,
  Save,
  Upload,
  Trash2,
  FlaskConical,
  Check,
} from 'lucide-react';
import { useApp } from '../app/context';
import { APP_VERSION } from '../config';
import type { WellScenario } from '../types';
import { DEMO_SCENARIOS, validateScenario } from '../services/scenarios';
import { fromCanonical, toCanonical, type Unit } from '../services/units';
import { loadScenarios, saveScenarios } from '../services/storage';
import { exportScenario } from '../reporting';
import { navigate } from '../hooks/useRoute';
import { Badge, Notice, PageTitle, Value } from '../components/UI';
function Field({ label, children, help }: { label: string; children: ReactNode; help?: string }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {help && <small>{help}</small>}
    </label>
  );
}
function NumberField({
  name,
  label,
  unit,
  help,
}: {
  name: keyof WellScenario;
  label: string;
  unit: Unit | '';
  help?: string;
}) {
  const { well, setWell, setNumericError } = useApp();
  const value = well[name] as number | null;
  const renderValue = () =>
    value === null ? '' : String(Number((unit ? fromCanonical(value, unit) : value).toFixed(6)));
  const [raw, setRaw] = useState(renderValue);
  const [error, setError] = useState('');
  const emitted = useRef<number | null>(value);
  const lastUnit = useRef(unit);
  useEffect(() => {
    setNumericError(String(name), '');
  }, []);
  useEffect(() => {
    if (error && value === emitted.current && unit !== lastUnit.current) {
      // A display-unit change must not discard invalid text or restore a stale valid value.
      lastUnit.current = unit;
      return;
    }
    if (value !== emitted.current || unit !== lastUnit.current) {
      setRaw(renderValue());
      setError('');
      setNumericError(String(name), '');
      emitted.current = value;
      lastUnit.current = unit;
    }
  }, [value, unit, well.id]);
  const change = (text: string) => {
    setRaw(text);
    if (text.trim() === '') {
      emitted.current = null;
      setWell((w) => ({ ...w, [name]: null }));
      setError('');
      setNumericError(String(name), '');
      return;
    }
    const n = Number(text);
    if (!Number.isFinite(n) || !/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(text.trim())) {
      setError('Enter a finite number or leave unknown.');
      setNumericError(String(name), `${label}: enter a valid number.`);
      return;
    }
    const canonical = unit ? toCanonical(n, unit) : n;
    if (!Number.isFinite(canonical)) {
      setError('Value exceeds the supported conversion range.');
      setNumericError(String(name), `${label}: value exceeds the supported conversion range.`);
      return;
    }
    emitted.current = canonical;
    setError('');
    setNumericError(String(name), '');
    setWell((w) => ({ ...w, [name]: canonical }));
  };
  return (
    <Field label={label} help={help}>
      <div className={`number-field ${error ? 'has-error' : ''}`}>
        <input
          aria-label={label}
          aria-invalid={!!error}
          inputMode="decimal"
          type="text"
          value={raw}
          placeholder="Unknown"
          onChange={(e) => change(e.target.value)}
        />
        {unit && <span>{unit}</span>}
      </div>
      {error && <small className="inline-error">{error}</small>}
    </Field>
  );
}
export default function Well() {
  const { dataset, well, setWell, units, setUnits, numericErrors, notify } = useApp();
  const [stored, setStored] = useState(loadScenarios);
  const [pressureUnit, setPressureUnit] = useState<Unit>(units === 'metric' ? 'MPa' : 'psi');
  const [importError, setImportError] = useState('');
  const [editorRevision, setEditorRevision] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const errors = [...validateScenario(well), ...Object.values(numericErrors)];
  const change = <K extends keyof WellScenario>(key: K, value: WellScenario[K]) =>
    setWell((w) => ({ ...w, [key]: value }));
  const select = (
    name: keyof WellScenario,
    label: string,
    options: { label: string; value: string }[],
  ) => (
    <Field label={label}>
      <select
        aria-label={label}
        value={String(well[name])}
        onChange={(e) => change(name, e.target.value as never)}
      >
        {options.map((o) => (
          <option value={o.value} key={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
  const choices = (values: string[]) =>
    values.map((v) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v }));
  const save = () => {
    if (errors.length || stored.errors.length) return;
    const scenario = {
      ...well,
      id: well.id.startsWith('illustrative-') ? `well-${crypto.randomUUID()}` : well.id,
    };
    const next = [...stored.scenarios.filter((s) => s.id !== scenario.id), scenario];
    const result = saveScenarios(next);
    if (!result.ok) {
      setImportError(result.errors.join(' '));
      return;
    }
    setStored({ scenarios: next, errors: [] });
    setWell(scenario);
    notify('Well scenario saved on this device.');
  };
  const load = (value: string) => {
    const scenario = [...DEMO_SCENARIOS, ...stored.scenarios].find((s) => s.id === value);
    if (scenario) {
      setWell({ ...scenario });
      setEditorRevision((r) => r + 1);
      setImportError('');
      notify(`${scenario.name} loaded.`);
    }
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 100000) throw new Error('Scenario file must be smaller than 100 kB.');
      const value: unknown = JSON.parse(await file.text());
      let candidate = value;
      if (value && typeof value === 'object' && 'scenario' in value) {
        if (!('schemaVersion' in value) || value.schemaVersion !== 1)
          throw new Error('Unsupported scenario document schema version.');
        candidate = value.scenario;
      }
      const issues = validateScenario(candidate);
      if (issues.length) throw new Error(issues.join(' '));
      setWell(candidate as WellScenario);
      setEditorRevision((r) => r + 1);
      setImportError('');
      notify('Scenario imported. Save it to retain on this device.');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unable to import scenario.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };
  const manufacturers = [
    ...new Set(dataset.materials.map((m) => m.manufacturer).filter((v) => v !== 'API reference')),
  ].sort();
  const families = [...new Set(dataset.materials.map((m) => m.family))].sort();
  const tiers = [
    ...new Set(dataset.materials.map((m) => m.costTier).filter((v): v is string => !!v)),
  ].sort();
  return (
    <>
      <PageTitle
        eyebrow="ENGINEERING / DESIGN BASIS"
        title="Well conditions"
        description="Define the conditions and preferences behind every screening decision."
        actions={
          <>
            <button className="button secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={15} />
              Import
            </button>
            <button
              className="button secondary"
              disabled={errors.length > 0}
              onClick={() =>
                exportScenario(well, { appVersion: APP_VERSION, dataVersion: dataset.dataVersion })
              }
            >
              <Download size={15} />
              Export
            </button>
            <button
              className="button primary"
              disabled={errors.length > 0 || stored.errors.length > 0}
              onClick={save}
            >
              <Save size={15} />
              Save scenario
            </button>
          </>
        }
      />
      <input
        type="file"
        accept=".json,application/json"
        hidden
        ref={fileRef}
        onChange={(e) => void importFile(e.target.files?.[0])}
      />
      <div className="scenario-toolbar">
        <div>
          <FolderOpen size={17} />
          <label>
            Load scenario
            <select aria-label="Load well scenario" value="" onChange={(e) => load(e.target.value)}>
              <option value="">Choose saved or demonstration scenario</option>
              <optgroup label="Illustrative demonstrations">
                {DEMO_SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
              {stored.scenarios.length > 0 && (
                <optgroup label="Saved on this device">
                  {stored.scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
        </div>
        <div className="unit-control">
          <span>Display units</span>
          <div className="segmented">
            <button
              className={units === 'metric' ? 'active' : ''}
              onClick={() => {
                setUnits('metric');
                setPressureUnit('MPa');
              }}
            >
              Metric
            </button>
            <button
              className={units === 'field' ? 'active' : ''}
              onClick={() => {
                setUnits('field');
                setPressureUnit('psi');
              }}
            >
              Field
            </button>
          </div>
        </div>
      </div>
      {(importError || stored.errors.length > 0) && (
        <Notice tone="danger">
          {importError || stored.errors.join(' ')}
          {stored.errors.length > 0 &&
            ' Existing stored data is preserved. Saving and deletion are disabled; the current scenario can still be exported.'}
        </Notice>
      )}
      {well.illustrative && (
        <Notice>
          <FlaskConical size={16} />
          This scenario contains illustrative values for demonstrating the workflow. Confirm every
          input against your approved well design basis.
        </Notice>
      )}
      <div className="well-layout">
        <div className="well-form" key={editorRevision}>
          <section className="panel form-section">
            <div className="form-section-heading">
              <span>01</span>
              <div>
                <h2>General information</h2>
                <p>Well identity, application, and service life</p>
              </div>
            </div>
            <div className="form-grid">
              <Field label="Well name / identifier">
                <input
                  value={well.name}
                  onChange={(e) => change('name', e.target.value)}
                  aria-label="Well name / identifier"
                />
              </Field>
              {select(
                'application',
                'Application',
                choices(['production', 'injection', 'exploration']),
              )}
              {select('product', 'Product', choices(['tubing', 'casing']))}
              {select('location', 'Location', choices(['onshore', 'offshore']))}
              <NumberField
                name="depthM"
                label="Well depth"
                unit={units === 'metric' ? 'm' : 'ft'}
              />
              <NumberField name="designLifeYears" label="Design life · years" unit="" />
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={well.illustrative}
                onChange={(e) => change('illustrative', e.target.checked)}
              />
              Mark as illustrative demonstration data
            </label>
          </section>
          <section className="panel form-section">
            <div className="form-section-heading">
              <span>02</span>
              <div>
                <h2>Pressure & temperature</h2>
                <p>Pressure inputs use an absolute-pressure basis</p>
              </div>
              <select
                aria-label="Pressure display unit"
                className="compact-select"
                value={pressureUnit}
                onChange={(e) => setPressureUnit(e.target.value as Unit)}
              >
                <option>MPa</option>
                <option>bar</option>
                <option>psi</option>
              </select>
            </div>
            <div className="form-grid">
              <NumberField
                name="operatingPressureMPa"
                label="Operating pressure"
                unit={pressureUnit}
              />
              <NumberField name="designPressureMPa" label="Design pressure" unit={pressureUnit} />
              <NumberField
                name="internalPressureMPa"
                label="Internal pressure"
                unit={pressureUnit}
              />
              <NumberField
                name="externalPressureMPa"
                label="External pressure"
                unit={pressureUnit}
              />
              <NumberField
                name="operatingTemperatureC"
                label="Operating temperature"
                unit={units === 'metric' ? '°C' : '°F'}
              />
              <NumberField
                name="maxTemperatureC"
                label="Maximum temperature"
                unit={units === 'metric' ? '°C' : '°F'}
              />
              <NumberField
                name="minTemperatureC"
                label="Minimum temperature"
                unit={units === 'metric' ? '°C' : '°F'}
              />
            </div>
          </section>
          <section className="panel form-section">
            <div className="form-section-heading">
              <span>03</span>
              <div>
                <h2>Corrosive environment</h2>
                <p>Unknown inputs remain explicit throughout screening</p>
              </div>
            </div>
            <div className="form-grid">
              <NumberField name="h2sMPa" label="H₂S partial pressure" unit={pressureUnit} />
              <NumberField name="co2MPa" label="CO₂ partial pressure" unit={pressureUnit} />
              <NumberField
                name="chlorideMgL"
                label="Chloride concentration"
                unit="mg/L"
                help="Mass per solution volume; ppm needs solution density."
              />
              <NumberField name="pH" label="Formation-water pH" unit="" />
              {select('freeWater', 'Free water present', choices(['yes', 'no', 'unknown']))}
              {select(
                'elementalSulfur',
                'Elemental sulfur present',
                choices(['yes', 'no', 'unknown']),
              )}
              <Field label="Environmental notes">
                <textarea
                  value={well.environmentNotes}
                  rows={3}
                  onChange={(e) => change('environmentNotes', e.target.value)}
                />
              </Field>
            </div>
          </section>
          <section className="panel form-section">
            <div className="form-section-heading">
              <span>04</span>
              <div>
                <h2>Mechanical requirements</h2>
                <p>Source strength and collapse designations are screening inputs</p>
              </div>
            </div>
            <div className="form-grid">
              <NumberField
                name="requiredYieldMPa"
                label="Required minimum yield"
                unit={units === 'metric' ? 'MPa' : 'ksi'}
              />
              <Field label="Nominal tubing / casing size">
                <input
                  value={well.nominalSize}
                  onChange={(e) => change('nominalSize', e.target.value)}
                />
              </Field>
              <NumberField
                name="outsideDiameterMm"
                label="Outside diameter"
                unit={units === 'metric' ? 'mm' : 'in'}
              />
              <NumberField
                name="wallThicknessMm"
                label="Wall thickness"
                unit={units === 'metric' ? 'mm' : 'in'}
              />
              <Field label="Other mechanical loads">
                <textarea
                  value={well.otherLoads}
                  rows={2}
                  onChange={(e) => change('otherLoads', e.target.value)}
                />
              </Field>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={well.collapseRequired}
                onChange={(e) => change('collapseRequired', e.target.checked)}
              />
              Enhanced / high-collapse service required
            </label>
          </section>
          <section className="panel form-section">
            <div className="form-section-heading">
              <span>05</span>
              <div>
                <h2>Commercial preferences</h2>
                <p>Preferences rank candidates; they do not establish eligibility</p>
              </div>
            </div>
            <div className="form-grid">
              {select('preferredManufacturer', 'Preferred manufacturer', [
                { label: 'No preference', value: '' },
                ...manufacturers.map((v) => ({ label: v, value: v })),
              ])}
              {select('preferredFamily', 'Preferred material family', [
                { label: 'No preference', value: '' },
                ...families.map((v) => ({ label: v, value: v })),
              ])}
              {select('maxCostTier', 'Preferred relative budget', [
                { label: 'No preference', value: '' },
                ...tiers.map((v) => ({ label: v, value: v })),
              ])}
              {select('costPriority', 'Cost priority', choices(['low', 'balanced', 'high']))}
            </div>
          </section>
        </div>
        <aside className="well-summary panel">
          <div className="eyebrow">CURRENT DESIGN BASIS</div>
          <h2>{well.name || 'Unnamed well'}</h2>
          <Badge tone={well.illustrative ? 'amber' : 'teal'}>
            {well.illustrative ? 'Illustrative scenario' : 'User-entered scenario'}
          </Badge>
          <dl className="property-list">
            <div>
              <dt>Application</dt>
              <dd>
                {well.application} · {well.product}
              </dd>
            </div>
            <div>
              <dt>Depth</dt>
              <dd>
                <Value value={well.depthM} unit="m" />
              </dd>
            </div>
            <div>
              <dt>Design pressure</dt>
              <dd>
                <Value value={well.designPressureMPa} unit="MPa" />
              </dd>
            </div>
            <div>
              <dt>Maximum temperature</dt>
              <dd>
                <Value value={well.maxTemperatureC} unit="°C" />
              </dd>
            </div>
            <div>
              <dt>Required yield</dt>
              <dd>
                <Value value={well.requiredYieldMPa} unit="MPa" />
              </dd>
            </div>
            <div>
              <dt>Schema version</dt>
              <dd className="mono">1</dd>
            </div>
          </dl>
          <p className="small muted">
            Summary uses canonical units. Changing display units preserves the underlying physical
            quantities.
          </p>
          {errors.length > 0 ? (
            <div className="validation-errors" role="alert">
              <strong>
                Resolve {errors.length} input issue{errors.length !== 1 ? 's' : ''}
              </strong>
              <ul>
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="validation-ok">
              <Check size={15} />
              Inputs pass schema and range validation
            </div>
          )}
          <button
            className="button primary full-width"
            disabled={errors.length > 0}
            onClick={() => navigate('/selection')}
          >
            Screen materials
            <ArrowRight size={15} />
          </button>
          <p className="small muted">
            Validation checks input consistency. It does not validate well design or material
            qualification.
          </p>
          {stored.scenarios.length > 0 && (
            <div className="saved-list">
              <h3>
                Saved scenarios <span>{stored.scenarios.length}</span>
              </h3>
              {stored.scenarios.map((s) => (
                <div key={s.id}>
                  <button onClick={() => load(s.id)}>{s.name}</button>
                  <button
                    className="icon-button"
                    aria-label={`Delete saved scenario ${s.name}`}
                    disabled={stored.errors.length > 0}
                    onClick={() => {
                      const next = stored.scenarios.filter((item) => item.id !== s.id);
                      const result = saveScenarios(next);
                      if (result.ok) {
                        setStored({ scenarios: next, errors: [] });
                        notify('Saved scenario removed.');
                      } else setImportError(result.errors.join(' '));
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
