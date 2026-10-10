import { APP_VERSION } from '../config';
import { useRef, useState } from 'react';
import {
  CircleDollarSign,
  Download,
  Plus,
  Save,
  Trash2,
  Scale,
  ArrowUpRight,
  Search,
} from 'lucide-react';
import { useApp } from '../app/context';
import type { Quotation } from '../types';
import { calculateQuotation, compareQuotations, validateQuotation } from '../services/costs';
import { loadQuotations, saveQuotations } from '../services/quotations';
import { downloadCSV } from '../reporting';
import { PageTitle, Badge, Notice, Value } from '../components/UI';
import { BenchmarkEvidence } from '../components/SourceEvidence';
function formatAmount(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}
const freshQuote = (): Quotation => ({
  schemaVersion: 1,
  id: `quote-${crypto.randomUUID()}`,
  materialId: '',
  supplier: '',
  currency: 'USD',
  unit: 'tonne',
  unitPrice: 0,
  date: new Date().toLocaleDateString('en-CA'),
  commercialBasis: '',
  size: '',
  quantity: 1,
  lengthM: 0,
  nominalWeightKgM: null,
  allowancePercent: 0,
});
export default function Cost() {
  const { dataset, notify } = useApp();
  const materialIds = dataset.materials.map((material) => material.id);
  const [stored, setStored] = useState(() => loadQuotations(materialIds));
  const [quote, setQuote] = useState<Quotation>(freshQuote);
  const [priceEntered, setPriceEntered] = useState(false);
  const [filter, setFilter] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const errors = [
    ...validateQuotation(quote),
    ...Object.values(inputErrors),
    ...(!priceEntered ? ['Enter a quoted unit price.'] : []),
  ];
  let calculation: ReturnType<typeof calculateQuotation> | null = null;
  let calculationError = '';
  if (errors.length === 0) {
    try {
      calculation = calculateQuotation(quote);
    } catch (error) {
      calculationError =
        error instanceof Error ? error.message : 'Unable to calculate this quotation.';
    }
  }
  const update = <K extends keyof Quotation>(key: K, value: Quotation[K]) =>
    setQuote((q) => ({ ...q, [key]: value }));
  const materials = dataset.materials.filter((m) =>
    `${m.grade} ${m.manufacturer}`.toLowerCase().includes(filter.toLowerCase()),
  );
  const selected = selectedIds
    .map((id) => stored.quotes.find((q) => q.id === id))
    .filter((q): q is Quotation => !!q);
  const compared = selected.length === 2 ? compareQuotations(selected[0], selected[1]) : null;
  const numberInput = (
    key: 'unitPrice' | 'quantity' | 'lengthM' | 'nominalWeightKgM' | 'allowancePercent',
    label: string,
    unit: string,
  ) => (
    <label className="form-field">
      <span>{label}</span>
      <div className="number-field">
        <input
          type="text"
          inputMode="decimal"
          aria-label={label}
          key={quote.id}
          defaultValue={
            key === 'unitPrice' && !priceEntered
              ? ''
              : quote[key] === null || (quote[key] === 0 && key === 'lengthM')
                ? ''
                : String(quote[key])
          }
          placeholder={key === 'nominalWeightKgM' ? 'Unknown' : 'Enter value'}
          onChange={(e) => {
            const raw = e.target.value;
            const n = Number(raw);
            if (key === 'unitPrice') setPriceEntered(raw.trim() !== '');
            if (raw.trim() === '' && key === 'nominalWeightKgM') {
              update(key, null);
              setInputErrors((current) => {
                const next = { ...current };
                delete next[key];
                return next;
              });
              return;
            }
            if (
              raw.trim() === '' ||
              !Number.isFinite(n) ||
              !/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(raw.trim())
            ) {
              setInputErrors((current) => ({
                ...current,
                [key]: `${label} must be a finite number.`,
              }));
              return;
            }
            update(key, n);
            setInputErrors((current) => {
              const next = { ...current };
              delete next[key];
              return next;
            });
          }}
        />
        <span>{unit}</span>
      </div>
    </label>
  );
  const save = () => {
    setAttempted(true);
    if (errors.length || !calculation || stored.error) return;
    const next = [...stored.quotes.filter((q) => q.id !== quote.id), quote];
    const result = saveQuotations(next, materialIds);
    if (result.ok) {
      setStored({ quotes: next, error: '' });
      notify('User-entered quotation saved on this device.');
      setQuote(freshQuote());
      setPriceEntered(false);
      setAttempted(false);
      setInputErrors({});
    } else notify(result.error);
  };
  const exportQuotes = () =>
    downloadCSV('octg-user-quotations.csv', [
      ['Application version', APP_VERSION],
      ['Data version', dataset.dataVersion],
      ['Exported at', new Date().toISOString()],
      [
        'Evidence',
        'User-entered supplier quotations; no independent price verification or FX conversion.',
      ],
      [],
      [
        'Material ID',
        'Supplier',
        'Currency',
        'Price unit',
        'Unit price',
        'Quote date',
        'Commercial basis',
        'Size',
        'Pipe quantity',
        'Length per pipe m',
        'Nominal weight kg/m',
        'Allowance %',
        'Indicative total',
        'Mass tonnes',
      ],
      ...stored.quotes.map((q) => {
        const c = calculateQuotation(q);
        return [
          q.materialId,
          q.supplier,
          q.currency,
          q.unit,
          q.unitPrice,
          q.date,
          q.commercialBasis,
          q.size,
          q.quantity,
          q.lengthM,
          q.nominalWeightKgM,
          q.allowancePercent,
          c.total,
          c.massTonnes,
        ];
      }),
    ]);
  return (
    <>
      <PageTitle
        eyebrow="COMMERCIAL / EXPLICIT COST BASIS"
        title="Cost analysis"
        description="Evaluate supplier quotations on a consistent basis, with assumptions kept in view."
        actions={
          <button
            className="button secondary"
            disabled={!stored.quotes.length}
            onClick={exportQuotes}
          >
            <Download size={15} />
            Export quotations
          </button>
        }
      />
      <Notice>
        <strong>Source cost tiers are relative categories, not manufacturer prices.</strong>{' '}
        Proprietary materials require a supplier quotation. Historical benchmark observations below
        are contextual and are never used as a material quotation.
      </Notice>
      {stored.error && <Notice tone="danger">{stored.error}</Notice>}
      <div className="cost-layout">
        <section className="panel quote-form">
          <div className="section-heading">
            <div>
              <h2>Add a supplier quotation</h2>
              <p>All values below are user-entered; no inferred price or pipe weight</p>
            </div>
            <Badge tone="teal">Local to this device</Badge>
          </div>
          <form
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            noValidate
          >
            <div className="form-grid">
              <label className="form-field full-span">
                <span>Find a material</span>
                <div className="search-field">
                  <Search size={15} />
                  <input
                    aria-label="Search quotation materials"
                    placeholder="Search grade or manufacturer…"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
                <select
                  aria-label="Quotation material"
                  value={quote.materialId}
                  onChange={(e) => update('materialId', e.target.value)}
                >
                  <option value="">Select material record</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.manufacturer} · {m.grade}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Supplier / quotation issuer</span>
                <input
                  aria-label="Supplier / quotation issuer"
                  value={quote.supplier}
                  onChange={(e) => update('supplier', e.target.value)}
                  placeholder="Supplier name"
                />
              </label>
              <label className="form-field">
                <span>Quotation date</span>
                <input
                  aria-label="Quotation date"
                  type="date"
                  value={quote.date}
                  onChange={(e) => update('date', e.target.value)}
                />
              </label>
              <label className="form-field">
                <span>Currency · ISO code</span>
                <input
                  aria-label="Quotation currency"
                  value={quote.currency}
                  onChange={(e) => update('currency', e.target.value.toUpperCase())}
                  placeholder="USD"
                  maxLength={3}
                />
              </label>
              <label className="form-field">
                <span>Price unit</span>
                <select
                  aria-label="Quotation price unit"
                  value={quote.unit}
                  onChange={(e) => update('unit', e.target.value as Quotation['unit'])}
                >
                  <option value="tonne">Per metric tonne</option>
                  <option value="kg">Per kilogram</option>
                  <option value="m">Per metre</option>
                  <option value="ft">Per foot</option>
                </select>
              </label>
              {numberInput('unitPrice', 'Quoted unit price', `${quote.currency}/${quote.unit}`)}
              <label className="form-field">
                <span>Commercial basis / terms</span>
                <input
                  aria-label="Commercial basis / terms"
                  value={quote.commercialBasis}
                  onChange={(e) => update('commercialBasis', e.target.value)}
                  placeholder="e.g. FOB named port; taxes excluded"
                />
              </label>
              <label className="form-field">
                <span>Size / connection / product basis</span>
                <input
                  aria-label="Size / connection / product basis"
                  value={quote.size}
                  onChange={(e) => update('size', e.target.value)}
                  placeholder="Confirm size, wall and connection"
                />
              </label>
              {numberInput('quantity', 'Quantity · pipe lengths', 'pipes')}
              {numberInput('lengthM', 'Length per pipe', 'm')}
              {numberInput('nominalWeightKgM', 'Nominal pipe weight', 'kg/m')}
              {numberInput('allowancePercent', 'Commercial allowance', '%')}
            </div>
            <p className="small muted">
              Mass-priced totals require nominal weight. Allowance is applied once; include freight,
              taxes, or connections only if covered by your stated terms.
            </p>
            {attempted && errors.length > 0 && (
              <div className="validation-errors" role="alert">
                <strong>Complete or correct the quotation</strong>
                <ul>
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {calculationError && (
              <div role="alert" className="validation-errors">
                {calculationError}
              </div>
            )}
            <button className="button primary" disabled={!!stored.error} type="submit">
              <Save size={15} />
              Save quotation
            </button>
          </form>
        </section>
        <aside className="panel cost-summary">
          <div className="eyebrow">INDICATIVE QUOTATION TOTAL</div>
          <CircleDollarSign size={25} className="teal-text" />
          <div className={`cost-total ${!calculation ? 'unknown' : ''}`}>
            {calculation ? formatAmount(calculation.total, quote.currency) : 'Awaiting inputs'}
          </div>
          <p>Based on the entered quotation and quantities</p>
          <dl className="property-list">
            <div>
              <dt>Pipe quantity</dt>
              <dd>
                <Value value={quote.quantity} />
              </dd>
            </div>
            <div>
              <dt>Total length</dt>
              <dd>
                {quote.lengthM > 0 ? (
                  <Value value={quote.quantity * quote.lengthM} unit="m" />
                ) : (
                  <Value value={null} />
                )}
              </dd>
            </div>
            <div>
              <dt>Calculated mass</dt>
              <dd>
                <Value value={calculation?.massTonnes} unit="tonnes" />
              </dd>
            </div>
            <div>
              <dt>Allowance</dt>
              <dd>{quote.allowancePercent}%</dd>
            </div>
            <div>
              <dt>Evidence</dt>
              <dd>
                <Badge>User-entered</Badge>
              </dd>
            </div>
          </dl>
          {calculation ? (
            <div className="calculation-assumptions">
              <h3>Calculation assumptions</h3>
              <ul>
                {calculation.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="small muted">
              Enter the material, supplier, price, date, terms, size and pipe quantities to
              calculate. Unknown weight can be retained for a length-based quotation.
            </p>
          )}
        </aside>
      </div>
      <section className="panel saved-quotes">
        <div className="section-heading">
          <div>
            <h2>Quotation comparison</h2>
            <p>Select two saved quotations to check commercial compatibility</p>
          </div>
          <Badge>{stored.quotes.length} saved</Badge>
        </div>
        {stored.quotes.length === 0 ? (
          <div className="cost-empty">
            <Scale size={25} />
            <p>No saved quotations. Add a supplier quotation above to compare costs.</p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="quote-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Material / supplier</th>
                    <th>Quoted unit price</th>
                    <th>Date / terms</th>
                    <th>Quantity / size</th>
                    <th>Indicative total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {stored.quotes.map((q) => {
                    const m = dataset.materials.find((m) => m.id === q.materialId);
                    const c = calculateQuotation(q);
                    return (
                      <tr key={q.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Compare quote from ${q.supplier}`}
                            checked={selectedIds.includes(q.id)}
                            onChange={() =>
                              setSelectedIds((current) =>
                                current.includes(q.id)
                                  ? current.filter((id) => id !== q.id)
                                  : current.length < 2
                                    ? [...current, q.id]
                                    : [current[1], q.id],
                              )
                            }
                          />
                        </td>
                        <td>
                          <strong>{m?.grade || q.materialId}</strong>
                          <span>{q.supplier}</span>
                        </td>
                        <td className="mono">
                          {formatAmount(q.unitPrice, q.currency)} / {q.unit}
                        </td>
                        <td>
                          {q.date}
                          <span>{q.commercialBasis}</span>
                        </td>
                        <td>
                          {q.quantity} × {q.lengthM} m<span>{q.size}</span>
                        </td>
                        <td className="mono">{formatAmount(c.total, q.currency)}</td>
                        <td>
                          <button
                            className="icon-button"
                            aria-label={`Delete quotation from ${q.supplier}`}
                            onClick={() => {
                              const next = stored.quotes.filter((item) => item.id !== q.id);
                              const result = saveQuotations(next, materialIds);
                              if (result.ok) {
                                setStored({ quotes: next, error: '' });
                                setSelectedIds((ids) => ids.filter((id) => id !== q.id));
                                notify('Quotation removed.');
                              } else notify(result.error);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {compared && (
              <div className={`quote-compatibility ${compared.comparable ? 'compatible' : ''}`}>
                <Scale size={19} />
                <div>
                  <strong>
                    {compared.comparable
                      ? 'Commercial bases match for indicative total comparison'
                      : 'Commercial bases differ; direct total comparison is withheld'}
                  </strong>
                  {compared.comparable ? (
                    <p>
                      {selected
                        .map(
                          (q) =>
                            `${q.supplier}: ${formatAmount(calculateQuotation(q).total, q.currency)}`,
                        )
                        .join(' · ')}
                      . Material technical eligibility must still be reviewed separately.
                    </p>
                  ) : (
                    <ul>
                      {compared.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>
      <BenchmarkEvidence />
      <div className="cost-categories panel">
        <div className="section-heading">
          <div>
            <h2>Relative library cost categories</h2>
            <p>Ordinal source labels; no price is inferred</p>
          </div>
          <ArrowUpRight size={17} />
        </div>
        <div className="cost-tier-list">
          {[...new Set(dataset.materials.map((m) => m.costTier))]
            .sort((a, b) => (a || '').localeCompare(b || ''))
            .map((tier) => (
              <div key={tier || 'unknown'}>
                <span>{tier || 'Not reported'}</span>
                <strong>
                  {dataset.materials.filter((m) => m.costTier === tier).length}
                  <small> records</small>
                </strong>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
