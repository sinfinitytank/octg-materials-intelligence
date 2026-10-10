import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Dataset } from '../../src/types';

const dataset: Dataset = JSON.parse(readFileSync('public/data/materials.json', 'utf8'));
async function go(page: Page, path = '/') {
  await page.goto(`./#${path}`);
}
async function route(page: Page, path: string) {
  await page.evaluate((value) => {
    window.location.hash = value;
  }, path);
}

test('all eight modules render and refresh under the GitHub repository base', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  for (const [path, title] of [
    ['/', 'Materials intelligence'],
    ['/database', 'Materials database'],
    ['/well', 'Well conditions'],
    ['/selection', 'Material selection'],
    ['/comparison', 'Material comparison'],
    ['/cost', 'Cost analysis'],
    ['/references', 'Engineering references'],
    ['/settings', 'Settings'],
  ]) {
    await go(page, path);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
  }
  expect(failures).toEqual([]);
});

test('dashboard chart category opens the exact source family', async ({ page }) => {
  await go(page);
  await page.getByRole('button', { name: 'Explore Carbon / low alloy: 303 records' }).click();
  await expect(
    page.getByRole('heading', { name: 'Materials database', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Filter material family', { exact: true })).toHaveValue(
    'Carbon / low alloy',
  );
  await expect(page.getByRole('button', { name: 'Export 303 records', exact: true })).toBeVisible();
});

test('database search combines filters, preserves exact yield boundary and exports results', async ({
  page,
}) => {
  await go(page, '/database');
  await page.getByLabel('Filter manufacturer', { exact: true }).selectOption('Tenaris');
  await page.getByLabel('Minimum yield lower bound in ksi').fill('110');
  const expected = dataset.materials.filter(
    (m) => m.manufacturer === 'Tenaris' && m.yieldMinKsi !== null && m.yieldMinKsi >= 110,
  );
  await expect(
    page.getByRole('button', { name: `Export ${expected.length} records`, exact: true }),
  ).toBeVisible();
  await page.getByLabel('Search materials', { exact: true }).fill(expected[0].id);
  await expect(page.locator('.materials-table tbody tr')).toHaveCount(1);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export 1 records', exact: true }).click();
  const downloaded = await downloadPromise;
  const content = readFileSync((await downloaded.path())!, 'utf8');
  expect(content).toContain(expected[0].id);
  expect(content).toContain(dataset.dataVersion);
  expect(content).toContain('unverified');
  expect(content).toContain(expected[0].source.url!);
});

test('material detail keeps missing properties and source review status explicit', async ({
  page,
}) => {
  await go(page, '/database');
  await page.getByLabel('Search materials', { exact: true }).fill('OCTG-0001');
  await page.locator('.grade-link').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Unverified source record', { exact: true })).toBeVisible();
  await expect(dialog.getByText(/Source review/)).toBeVisible();
  await expect(dialog.getByText('Verified on', { exact: true })).toHaveCount(0);
  await expect(dialog.getByText(/Chemical composition was not provided/)).toBeVisible();
  await expect(
    dialog.getByRole('link', { name: /Manufacturer \/ source reference/ }),
  ).toHaveAttribute('href', dataset.materials[0].source.url!);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.grade-link')).toBeFocused();
});

test('comparison supports four records, highlights source differences and exports all categories', async ({
  page,
}) => {
  await go(page, '/database');
  for (let i = 0; i < 4; i++) await page.locator('.compare-toggle:not(.active)').first().click();
  await page.locator('.compare-toggle:not(.active)').first().click();
  await expect(page.getByRole('status')).toContainText('Compare up to four materials');
  await page.getByRole('button', { name: 'View comparison', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Material comparison', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.comparison-table thead th')).toHaveCount(5);
  await expect(page.getByText('No verified envelope', { exact: true })).toHaveCount(4);
  await expect(page.locator('.difference-row').first()).toBeVisible();
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export comparison', exact: true }).click();
  const content = readFileSync((await (await promise).path())!, 'utf8');
  expect(content).toContain('Chemical composition');
  expect(content).toContain('Unknown');
  expect(content.toLowerCase()).toContain('environmental qualification');
});

test('table pagination, column visibility and multi-column sorting work', async ({ page }) => {
  await go(page, '/database');
  await expect(page.locator('.materials-table tbody tr')).toHaveCount(20);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.getByText('Page 2 of 23', { exact: true })).toBeVisible();
  await page.getByLabel('Rows per page').selectOption('10');
  await expect(page.locator('.materials-table tbody tr')).toHaveCount(10);
  await page.getByRole('button', { name: 'Columns', exact: true }).click();
  await page.locator('.popover').getByLabel('UNS', { exact: true }).check();
  await expect(page.getByRole('columnheader', { name: /^UNS/ })).toBeVisible();
  await page.getByRole('button', { name: 'Manufacturer', exact: true }).click();
  await page
    .getByRole('button', { name: 'Min yield · ksi', exact: true })
    .click({ modifiers: ['Shift'] });
  await expect(page.getByRole('columnheader', { name: /^Manufacturer/ })).toHaveAttribute(
    'aria-sort',
    'ascending',
  );
  await expect(page.getByRole('columnheader', { name: /^Min yield/ })).toHaveAttribute(
    'aria-sort',
    'descending',
  );
});

test('unit switching preserves physical inputs and invalid text blocks screening', async ({
  page,
}) => {
  await go(page, '/well');
  await page.getByRole('button', { name: 'Field', exact: true }).click();
  await expect
    .poll(async () =>
      Number(await page.getByLabel('Operating pressure', { exact: true }).inputValue()),
    )
    .toBeCloseTo(2900.7547546, 4);
  await page.getByRole('button', { name: 'Metric', exact: true }).click();
  await expect(page.getByLabel('Operating pressure', { exact: true })).toHaveValue('20');
  await page.getByLabel('Operating pressure', { exact: true }).fill('invalid');
  await expect(page.getByRole('button', { name: 'Save scenario', exact: true })).toBeDisabled();
  await route(page, '/selection');
  await expect(
    page.getByRole('heading', { name: 'Correct the well inputs before screening', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.assessment')).toHaveCount(0);
});

test('scenario export round-trips with metadata and persists locally', async ({ page }) => {
  await go(page, '/well');
  await page.getByLabel('Well name / identifier', { exact: true }).fill('E2E well A');
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const path = (await (await promise).path())!;
  const exported = JSON.parse(readFileSync(path, 'utf8'));
  expect(exported.scenario.name).toBe('E2E well A');
  expect(JSON.stringify(exported)).toContain(dataset.dataVersion);
  await page.getByLabel('Well name / identifier', { exact: true }).fill('Temporary edit');
  await page.locator('input[type=file]').setInputFiles(path);
  await expect(page.getByLabel('Well name / identifier', { exact: true })).toHaveValue(
    'E2E well A',
  );
  await page.getByRole('button', { name: 'Save scenario', exact: true }).click();
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('octg.scenarios.v1')!));
  await page.getByLabel('Load well scenario', { exact: true }).selectOption(saved.scenarios[0].id);
  await expect(page.getByLabel('Well name / identifier', { exact: true })).toHaveValue(
    'E2E well A',
  );
});

test('sour and unknown scenarios retain qualification gaps and separate exclusions', async ({
  page,
}) => {
  await go(page, '/well');
  await page.getByLabel('Load well scenario', { exact: true }).selectOption('illustrative-sour');
  await page.getByRole('button', { name: 'Screen materials', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Material selection', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.eligibility-card').first()).toContainText('0');
  await expect(page.locator('.assessment').first()).toContainText('Further qualification required');
  await page.locator('.assessment-explanation summary').first().click();
  await expect(page.locator('.assessment-explanation').first()).toContainText(
    'No applicable, verified environmental qualification envelope',
  );
  await page.getByRole('button', { name: 'Exclusions', exact: true }).click();
  await expect(page.locator('.assessment').first()).toContainText('Mechanical incompatibility');
  await route(page, '/well');
  await page.getByLabel('Load well scenario', { exact: true }).selectOption('illustrative-unknown');
  await page.getByRole('button', { name: 'Screen materials', exact: true }).click();
  await expect(page.locator('.assessment').first()).toContainText('Insufficient information');
});

test('user quotations calculate dimensional totals and reject incompatible comparison', async ({
  page,
}) => {
  await go(page, '/cost');
  const enterQuote = async (supplier: string, currency: string) => {
    await page.getByLabel('Quotation material', { exact: true }).selectOption('OCTG-0001');
    await page.getByLabel('Supplier / quotation issuer', { exact: true }).fill(supplier);
    await page.getByLabel('Quotation date', { exact: true }).fill('2026-10-10');
    await page.getByLabel('Quotation currency', { exact: true }).fill(currency);
    await page.getByLabel('Quoted unit price', { exact: true }).fill('1000');
    await page.getByLabel('Commercial basis / terms', { exact: true }).fill('FOB named port');
    await page
      .getByLabel('Size / connection / product basis', { exact: true })
      .fill('7 in casing, specific connection');
    await page.getByLabel('Quantity · pipe lengths', { exact: true }).fill('10');
    await page.getByLabel('Length per pipe', { exact: true }).fill('12');
    await page.getByLabel('Nominal pipe weight', { exact: true }).fill('20');
    await page.getByLabel('Commercial allowance', { exact: true }).fill('10');
    await expect(page.locator('.cost-total')).toContainText('2,640');
    await page.getByRole('button', { name: 'Save quotation', exact: true }).click();
  };
  await enterQuote('Supplier A', 'USD');
  await enterQuote('Supplier B', 'EUR');
  await expect(page.locator('.quote-table tbody tr')).toHaveCount(2);
  await page.getByLabel('Compare quote from Supplier A', { exact: true }).check();
  await page.getByLabel('Compare quote from Supplier B', { exact: true }).check();
  await expect(page.locator('.quote-compatibility')).toContainText(
    'direct total comparison is withheld',
  );
  await expect(page.locator('.quote-compatibility')).toContainText('Currencies differ');
  await page.reload();
  await expect(page.locator('.quote-table tbody tr')).toHaveCount(2);
});

test('market evidence retains 17 observations and the reference register retains 36 sources', async ({
  page,
}) => {
  await go(page, '/cost');
  await expect(page.locator('.evidence-table tbody tr')).toHaveCount(17);
  await expect(page.locator('.evidence-table')).toContainText('USD/foot');
  await expect(page.locator('.evidence-table')).toContainText('USD/metric ton');
  await go(page, '/references');
  await expect(
    page.getByRole('heading', { name: 'Original source register', exact: true }),
  ).toBeVisible();
  const register = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Original source register', exact: true }) });
  await expect(register.locator('.reference-supplier')).toHaveCount(36);
});

test('dark mode persists and sidebar navigation remains accessible on the viewport', async ({
  page,
  isMobile,
}) => {
  await go(page, '/settings');
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  if (isMobile) await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  else {
    await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click();
    await page.getByRole('button', { name: 'Expand sidebar', exact: true }).click();
  }
  await page
    .locator('nav')
    .getByRole('link', { name: /Materials Database/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Materials database', exact: true }),
  ).toBeVisible();
});

test('invalid or unavailable dataset produces a recoverable visible error', async ({ page }) => {
  await page.route('**/data/materials.json', (intercepted) =>
    intercepted.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"schemaVersion":99,"materials":[]}',
    }),
  );
  await go(page);
  await expect(
    page.getByRole('heading', { name: 'The source library could not be loaded', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Material database validation failed. Please contact the project maintainer.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.unroute('**/data/materials.json');
  await page.getByRole('button', { name: 'Retry data loading', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Materials intelligence', exact: true }),
  ).toBeVisible();
});
