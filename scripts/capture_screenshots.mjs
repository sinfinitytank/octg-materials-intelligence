import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Run npm run preview first. These are actual production-browser screenshots.
const base =
  process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173/octg-materials-intelligence/';
const browser = await chromium.launch();
try {
  await mkdir('docs/screenshots', { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${base}#/`);
  await page.getByRole('heading', { name: 'Materials intelligence', exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: 'docs/screenshots/dashboard.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.goto(`${base}#/database`);
  await page.getByRole('heading', { name: 'Materials database', exact: true }).waitFor();
  await page.screenshot({ path: 'docs/screenshots/database.png', animations: 'disabled' });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`${base}#/`);
  await page.getByRole('heading', { name: 'Materials intelligence', exact: true }).waitFor();
  await page.screenshot({
    path: 'docs/screenshots/mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
  console.log('Saved actual desktop dashboard/database and mobile dashboard screenshots.');
} finally {
  await browser.close();
}
