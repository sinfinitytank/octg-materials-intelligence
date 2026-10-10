import '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from '../../src/app/context';
import Database from '../../src/pages/Database';
import Well from '../../src/pages/Well';
import Cost from '../../src/pages/Cost';
import { parseDataset } from '../../src/data/schema';
import { loadScenarios } from '../../src/services/storage';
import { DEFAULT_SCENARIO } from '../../src/services/scenarios';
import { scenarioJSON } from '../../src/reporting';
import { QUOTATIONS_STORAGE_KEY } from '../../src/services/quotations';

const dataset = parseDataset(
  JSON.parse(readFileSync(resolve(process.cwd(), 'public/data/materials.json'), 'utf8')),
);
const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function StateSummary() {
  const { comparison, notice, well } = useApp();
  return (
    <aside>
      <output aria-label="Comparison count">{comparison.length}</output>
      <output aria-label="Application notification">{notice}</output>
      <output aria-label="Canonical operating pressure">
        {well.operatingPressureMPa ?? 'unknown'}
      </output>
      <output aria-label="Canonical well name">{well.name}</output>
    </aside>
  );
}
function renderDatabase() {
  return render(
    <AppProvider dataset={dataset}>
      <Database />
      <StateSummary />
    </AppProvider>,
  );
}
function renderWell() {
  return render(
    <AppProvider dataset={dataset}>
      <Well />
      <StateSummary />
    </AppProvider>,
  );
}

beforeAll(() => {
  // jsdom does not implement modal activation; keep browser dialog behavior in this test boundary.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      this.removeAttribute('open');
    },
  });
});
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '#/database');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

describe('source database workflow', () => {
  it('combines real manufacturer and yield filters, then searches within those results', async () => {
    const user = userEvent.setup();
    renderDatabase();
    const maker = 'Tenaris';
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter manufacturer' }), maker);
    await user.type(
      screen.getByRole('textbox', { name: 'Minimum yield lower bound in ksi' }),
      '110',
    );
    const expected = dataset.materials.filter(
      (m) => m.manufacturer === maker && m.yieldMinKsi !== null && m.yieldMinKsi >= 110,
    );
    expect(expected.length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: `Export ${expected.length} records` }),
    ).toBeInTheDocument();
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    for (const row of rows)
      expect(within(row).getByText(maker, { exact: true })).toBeInTheDocument();
    const record = expected[0];
    await user.type(screen.getByRole('textbox', { name: 'Search materials' }), record.id);
    expect(screen.getByRole('button', { name: 'Export 1 records' })).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: new RegExp(`^${escaped(record.grade)}`) }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Clear filters/ }));
    expect(
      screen.getByRole('button', { name: `Export ${dataset.materials.length} records` }),
    ).toBeInTheDocument();
  });
  it('opens a source record with provenance, unknown properties and reviewed-not-verified status', async () => {
    const user = userEvent.setup();
    renderDatabase();
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockClear();
    const record = dataset.materials.find((m) => m.source.reviewedAt && m.source.url)!;
    await user.type(screen.getByRole('textbox', { name: 'Search materials' }), record.id);
    await user.click(screen.getByRole('button', { name: new RegExp(`^${escaped(record.grade)}`) }));
    const detail = screen.getByRole('dialog', { name: `${record.manufacturer} ${record.grade}` });
    expect(within(detail).getByText('Unverified source record')).toBeInTheDocument();
    expect(
      within(detail).getByText(/no verified environmental operating envelope/),
    ).toBeInTheDocument();
    expect(
      within(detail).getByRole('link', { name: /Manufacturer \/ source reference/ }),
    ).toHaveAttribute('href', record.source.url);
    expect(within(detail).getByText(/Source review/)).toBeInTheDocument();
    expect(within(detail).queryByText('Verified on')).not.toBeInTheDocument();
    expect(
      within(detail).getByText(
        'Chemical composition was not provided by the source dataset. No nominal chemistry has been assigned.',
      ),
    ).toBeInTheDocument();
    await user.click(within(detail).getByRole('button', { name: 'Add to comparison' }));
    expect(screen.getByLabelText('Comparison count')).toHaveTextContent('1');
    expect(showModal).toHaveBeenCalledTimes(1);
    await user.click(within(detail).getByRole('button', { name: 'Close details' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('adds four actual table records, blocks a fifth and supports removing one', async () => {
    const user = userEvent.setup();
    renderDatabase();
    for (let i = 0; i < 4; i++)
      await user.click(screen.getAllByRole('button', { name: /^Add .+ to comparison$/ })[0]);
    expect(screen.getByLabelText('Comparison count')).toHaveTextContent('4');
    const fifth = screen.getAllByRole('button', { name: /^Add .+ to comparison$/ })[0];
    const fifthName = fifth.getAttribute('aria-label')!;
    await user.click(screen.getByRole('button', { name: fifthName }));
    expect(screen.getByLabelText('Comparison count')).toHaveTextContent('4');
    expect(screen.getByLabelText('Application notification')).toHaveTextContent(
      'Compare up to four materials.',
    );
    expect(fifth).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getAllByRole('button', { name: /^Remove .+ from comparison$/ })[0]);
    expect(screen.getByLabelText('Comparison count')).toHaveTextContent('3');
    await user.click(screen.getByRole('button', { name: fifthName }));
    expect(screen.getByLabelText('Comparison count')).toHaveTextContent('4');
  });
  it('returns a clear empty result and can reset it without losing database records', async () => {
    const user = userEvent.setup();
    renderDatabase();
    await user.type(
      screen.getByRole('textbox', { name: 'Search materials' }),
      'NO_SUCH_SOURCE_RECORD_5279',
    );
    expect(screen.getByText('No materials match these filters.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(
      screen.getByRole('button', { name: `Export ${dataset.materials.length} records` }),
    ).toBeInTheDocument();
  });
});

describe('well design basis workflow', () => {
  it('preserves the physical pressure through unit changes and rejects invalid inputs before saving', async () => {
    const user = userEvent.setup();
    renderWell();
    await user.click(screen.getByRole('button', { name: 'Field' }));
    expect(
      Number(
        (screen.getByRole('textbox', { name: 'Operating pressure' }) as HTMLInputElement).value,
      ),
    ).toBeCloseTo(2900.7547546, 4);
    expect(screen.getByLabelText('Canonical operating pressure')).toHaveTextContent('20');
    await user.click(screen.getByRole('button', { name: 'Metric' }));
    const pressure = screen.getByRole('textbox', { name: 'Operating pressure' });
    expect(pressure).toHaveValue('20');
    await user.clear(pressure);
    await user.type(pressure, '-1');
    expect(screen.getByRole('button', { name: 'Save scenario' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Screen materials' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('outside its physical range');
    await user.clear(pressure);
    await user.type(pressure, '20');
    expect(screen.getByRole('button', { name: 'Save scenario' })).toBeEnabled();
  });
  it('preserves invalid numeric text and blocks screening through both unit system and pressure-unit changes', async () => {
    const user = userEvent.setup();
    renderWell();
    const pressure = screen.getByRole('textbox', { name: 'Operating pressure' });
    await user.tripleClick(pressure);
    await user.keyboard('abc');
    for (const changeUnit of [
      () => user.click(screen.getByRole('button', { name: 'Field' })),
      () =>
        user.selectOptions(screen.getByRole('combobox', { name: 'Pressure display unit' }), 'bar'),
      () => user.click(screen.getByRole('button', { name: 'Metric' })),
    ]) {
      await changeUnit();
      expect(pressure).toHaveValue('abc');
      expect(pressure).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Canonical operating pressure')).toHaveTextContent('20');
      expect(screen.getByRole('button', { name: 'Save scenario' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Screen materials' })).toBeDisabled();
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Operating pressure: enter a valid number.',
      );
    }
    await user.clear(pressure);
    await user.type(pressure, '20');
    expect(pressure).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('button', { name: 'Save scenario' })).toBeEnabled();
  });
  it('preserves an overflowing converted input as an error without changing the canonical engineering value', async () => {
    const user = userEvent.setup();
    renderWell();
    await user.click(screen.getByRole('button', { name: 'Field' }));
    const yieldInput = screen.getByRole('textbox', { name: 'Required minimum yield' });
    await user.tripleClick(yieldInput);
    await user.keyboard('1e308');
    expect(yieldInput).toHaveValue('1e308');
    expect(yieldInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'value exceeds the supported conversion range.',
    );
    expect(screen.getByRole('button', { name: 'Save scenario' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Metric' }));
    expect(yieldInput).toHaveValue('1e308');
    expect(yieldInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Screen materials' })).toBeDisabled();
    await user.clear(yieldInput);
    await user.type(yieldInput, '550');
    expect(screen.getByRole('button', { name: 'Save scenario' })).toBeEnabled();
  });
  it('saves a named scenario through the UI and restores its exact conditions', async () => {
    const user = userEvent.setup();
    renderWell();
    const name = screen.getByRole('textbox', { name: 'Well name / identifier' });
    await user.clear(name);
    await user.type(name, 'Integration well A');
    await user.click(screen.getByRole('button', { name: 'Save scenario' }));
    const saved = loadScenarios();
    expect(saved.errors).toEqual([]);
    expect(saved.scenarios).toHaveLength(1);
    expect(saved.scenarios[0].name).toBe('Integration well A');
    expect(saved.scenarios[0].schemaVersion).toBe(1);
    await user.clear(name);
    await user.type(name, 'Unsaved changes');
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Load well scenario' }),
      saved.scenarios[0].id,
    );
    expect(screen.getByRole('textbox', { name: 'Well name / identifier' })).toHaveValue(
      'Integration well A',
    );
    expect(screen.getByLabelText('Canonical operating pressure')).toHaveTextContent(
      String(saved.scenarios[0].operatingPressureMPa),
    );
  });
  it('explicitly loading a demo or the same saved scenario resets invalid text even when physical values match', async () => {
    const user = userEvent.setup();
    renderWell();
    const invalidatePressure = async () => {
      const pressure = screen.getByRole('textbox', { name: 'Operating pressure' });
      await user.tripleClick(pressure);
      await user.keyboard('abc');
      expect(pressure).toHaveValue('abc');
      expect(pressure).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Canonical operating pressure')).toHaveTextContent('20');
      expect(screen.getByRole('button', { name: 'Save scenario' })).toBeDisabled();
    };
    const expectRestored = () => {
      expect(screen.getByRole('textbox', { name: 'Operating pressure' })).toHaveValue('20');
      expect(screen.getByRole('textbox', { name: 'Operating pressure' })).toHaveAttribute(
        'aria-invalid',
        'false',
      );
      expect(screen.getByRole('button', { name: 'Save scenario' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Screen materials' })).toBeEnabled();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    };
    await invalidatePressure();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Load well scenario' }),
      'illustrative-sour',
    );
    expectRestored();
    await user.click(screen.getByRole('button', { name: 'Save scenario' }));
    const saved = loadScenarios().scenarios[0];
    await invalidatePressure();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Load well scenario' }),
      saved.id,
    );
    expectRestored();
    expect(loadScenarios().scenarios).toEqual([saved]);
  });
  it('imports the versioned exported document and resets invalid text with unchanged physical values', async () => {
    const user = userEvent.setup();
    const view = renderWell();
    const pressure = screen.getByRole('textbox', { name: 'Operating pressure' });
    await user.tripleClick(pressure);
    await user.keyboard('abc');
    expect(pressure).toHaveValue('abc');
    expect(screen.getByLabelText('Canonical operating pressure')).toHaveTextContent('20');
    const document = scenarioJSON(
      {
        ...DEFAULT_SCENARIO,
        id: 'imported-well',
        name: 'Imported design basis',
        operatingPressureMPa: 20,
      },
      { appVersion: '1.0.0', dataVersion: dataset.dataVersion },
    );
    const file = new File([document], 'well.json', { type: 'application/json' });
    // File.text is missing from jsdom's File implementation in this test runtime.
    Object.defineProperty(file, 'text', { value: async () => document });
    const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Well name / identifier' })).toHaveValue(
        'Imported design basis',
      ),
    );
    expect(screen.getByLabelText('Canonical operating pressure')).toHaveTextContent('20');
    expect(screen.getByRole('textbox', { name: 'Operating pressure' })).toHaveValue('20');
    expect(screen.getByRole('textbox', { name: 'Operating pressure' })).toHaveAttribute(
      'aria-invalid',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Save scenario' })).toBeEnabled();
    expect(loadScenarios().scenarios).toHaveLength(0);
  });
});

describe('stored quotation recovery boundary', () => {
  it('renders an unsafe saved calculation as preserved data, withholding save and export', async () => {
    const unsafe = {
      schemaVersion: 1,
      id: 'unsafe-quote',
      materialId: dataset.materials[0].id,
      supplier: 'Test supplier',
      currency: 'USD',
      unit: 'tonne',
      unitPrice: Number.MAX_VALUE,
      date: '2026-10-10',
      commercialBasis: 'EXW supplier',
      size: '88.9 × 6.45 mm',
      quantity: 10,
      lengthM: 12,
      nominalWeightKgM: 15,
      allowancePercent: 10,
    };
    const raw = JSON.stringify([unsafe]);
    localStorage.setItem(QUOTATIONS_STORAGE_KEY, raw);
    const evidence = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/data/reference-data.json'), 'utf8'),
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => evidence,
    } as Response);
    render(
      <AppProvider dataset={dataset}>
        <Cost />
      </AppProvider>,
    );
    expect(screen.getByRole('button', { name: 'Save quotation' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Export quotations' })).toBeDisabled();
    expect(screen.getByText(/Existing quotation storage has been preserved/)).toBeInTheDocument();
    expect(screen.getByText(/calculation exceeds the supported numeric range/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText('Loading source observations…')).not.toBeInTheDocument(),
    );
    expect(localStorage.getItem(QUOTATIONS_STORAGE_KEY)).toBe(raw);
  });
});
