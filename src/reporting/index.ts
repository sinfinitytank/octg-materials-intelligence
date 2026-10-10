import type { Assessment, Material, WellScenario } from '../types';
import { APP_VERSION } from '../config';
export interface ReportMetadata {
  appVersion: string;
  dataVersion: string;
  analysisDate?: string;
}
export type CSVCell = string | number | boolean | null | undefined;
export const REPORT_LIMITATION =
  'Preliminary source-data screening only. No material is declared qualified or compliant. Imported values and manufacturer statements require verification; environmental envelopes and size-specific design checks are not supplied.';
/** Quoted text plus an apostrophe blocks spreadsheet formula injection, including leading whitespace. */
export function csvCell(value: CSVCell): string {
  let text = value == null ? '' : String(value);
  if (/^[\s\uFEFF]*[=+\-@]/u.test(text) || /^[\t\r\n]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function toCSV(rows: CSVCell[][]): string {
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
function metadataRows(meta: ReportMetadata): CSVCell[][] {
  return [
    ['Application version', meta.appVersion],
    ['Data version', meta.dataVersion],
    ['Analysis date (ISO)', meta.analysisDate ?? new Date().toISOString()],
    ['Limitations', REPORT_LIMITATION],
    [],
  ];
}
export function materialsCSV(materials: Material[], meta: ReportMetadata): string {
  return toCSV([
    ...metadataRows(meta),
    [
      'Record ID',
      'Manufacturer',
      'Grade',
      'Listing type',
      'Family',
      'Specification',
      'Minimum yield MPa (source; unverified)',
      'UNS',
      'H2S source designation',
      'CO2 source designation',
      'Collapse designation',
      'Cost tier (ordinal)',
      'Source',
      'Verification',
      'Source file',
      'Source row',
      'Limitations',
    ],
    ...materials.map((m) => [
      m.id,
      m.manufacturer,
      m.grade,
      m.listingType,
      m.family,
      m.specification,
      m.yieldMinMPa,
      m.uns,
      m.h2s,
      m.co2,
      m.collapse,
      m.costTier,
      m.source.url,
      m.source.verification,
      m.source.file,
      m.source.row,
      m.limitations.join(' | '),
    ]),
  ]);
}
export function comparisonCSV(materials: Material[], meta: ReportMetadata): string {
  const fields: [string, (m: Material) => CSVCell][] = [
    ['Manufacturer · source', (m) => m.manufacturer],
    ['Grade · source', (m) => m.grade],
    ['Listing type · source', (m) => m.listingType],
    ['Material family · source', (m) => m.family],
    ['Specification · source', (m) => m.specification],
    ['Application · source', (m) => m.application],
    ['Minimum yield ksi · source, unverified', (m) => m.yieldMinKsi],
    ['Minimum yield MPa · converted from source ksi, unverified', (m) => m.yieldMinMPa],
    ['Maximum yield MPa · source, unverified', (m) => m.properties.yieldMaxMPa],
    ['Minimum tensile MPa · source, unverified', (m) => m.properties.tensileMinMPa],
    ['Elongation % · source, unverified', (m) => m.properties.elongationPercent],
    ['Hardness · source, unverified', (m) => m.properties.hardness],
    ['Heat treatment · source, unverified', (m) => m.properties.heatTreatment],
    [
      'Chemical composition · source, unverified',
      (m) =>
        Object.keys(m.properties.chemistry).length ? JSON.stringify(m.properties.chemistry) : null,
    ],
    ['UNS · source', (m) => m.uns],
    ['H2S designation · source, not qualification', (m) => m.h2s],
    ['CO2 designation · source, not qualification', (m) => m.co2],
    ['Collapse designation · source, not a rating', (m) => m.collapse],
    ['Temperature envelope · unavailable', () => null],
    ['Chloride limits · unavailable', () => null],
    ['Verified environmental qualification envelope · unavailable', () => null],
    ['Relative cost tier · source ordinal category, not price', (m) => m.costTier],
    ['Manufacturer price', (m) => m.pricing.vendorUSDPerTonne ?? 'Manufacturer quotation required'],
    ['Source data confidence', (m) => m.source.verification],
    ['Original source status', (m) => m.source.status],
    ['Source reviewed on · not a verification date', (m) => m.source.reviewedAt],
    ['Source URL', (m) => m.source.url],
    ['Source file', (m) => m.source.file],
    ['Source row', (m) => m.source.row],
    ['Limitations', (m) => m.limitations.join(' | ')],
  ];
  return toCSV([
    ...metadataRows(meta),
    ['Comparison field', ...materials.map((m) => m.id)],
    ...fields.map(([label, get]) => [
      label,
      ...materials.map((m) => {
        const value = get(m);
        return value == null || value === '' ? 'Unknown' : value;
      }),
    ]),
  ]);
}
export function shortlistCSV(
  assessments: Assessment[],
  well: WellScenario,
  meta: ReportMetadata,
): string {
  return toCSV([
    ...metadataRows(meta),
    ['Well conditions (canonical units)', JSON.stringify(well)],
    [
      'Ranking interpretation',
      'Preference points are not engineering performance or compliance scores. Relative tiers are not prices.',
    ],
    [],
    [
      'Record ID',
      'Manufacturer',
      'Grade',
      'Eligibility',
      'Preference points',
      'Ranking explanation',
      'Information availability %',
      'Reasons',
      'Cautions',
      'Source',
    ],
    ...assessments.map((a) => [
      a.material.id,
      a.material.manufacturer,
      a.material.grade,
      a.eligibility,
      a.ranking.score,
      a.ranking.factors.map((f) => `${f.label}: ${f.points}`).join(' | '),
      a.completeness,
      a.reasons.join(' | '),
      a.cautions.join(' | '),
      a.material.source.url,
    ]),
  ]);
}
export const CANONICAL_UNITS = {
  pressure: 'MPa absolute',
  temperature: '°C',
  depth: 'm',
  outsideDiameter: 'mm',
  wallThickness: 'mm',
  chloride: 'mg/L',
  yieldStrength: 'MPa',
  designLife: 'years',
  pH: 'dimensionless',
} as const;
export function scenarioJSON(
  well: WellScenario,
  meta: ReportMetadata = { appVersion: APP_VERSION, dataVersion: 'unknown' },
): string {
  return JSON.stringify(
    {
      schemaVersion: 1,
      exportedAt: meta.analysisDate ?? new Date().toISOString(),
      appVersion: meta.appVersion,
      dataVersion: meta.dataVersion,
      canonicalUnits: CANONICAL_UNITS,
      limitations: REPORT_LIMITATION,
      scenario: well,
    },
    null,
    2,
  );
}
export function downloadFile(
  filename: string,
  content: string,
  type = 'text/plain;charset=utf-8',
): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadCSV(filename: string, content: string | CSVCell[][]): void {
  downloadFile(
    filename,
    typeof content === 'string' ? content : toCSV(content),
    'text/csv;charset=utf-8',
  );
}
export function exportScenario(well: WellScenario, meta?: ReportMetadata): void {
  downloadFile(
    `well-${well.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`,
    scenarioJSON(well, meta),
    'application/json',
  );
}
function escapeHTML(value: unknown): string {
  return String(value ?? 'Unknown').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
}
export function engineeringSummaryHTML(
  well: WellScenario,
  assessments: Assessment[],
  meta: ReportMetadata,
): string {
  const candidates = assessments
    .map(
      (a) =>
        `<section><h3>${escapeHTML(a.material.manufacturer)} · ${escapeHTML(a.material.grade)}</h3><p>${escapeHTML(a.eligibility)} · preference points ${a.ranking.score}</p><p>${escapeHTML(a.reasons.join(' '))}</p><p>${escapeHTML(a.cautions.join(' '))}</p><p>Ranking: ${escapeHTML(a.ranking.factors.map((f) => `${f.label} (${f.points})`).join('; '))}</p><p>Source: ${escapeHTML(a.material.source.url)} · ${escapeHTML(a.material.source.file)}, row ${a.material.source.row}</p></section>`,
    )
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>OCTG engineering screening summary</title><style>body{font:12px/1.5 system-ui,sans-serif;max-width:1000px;margin:32px auto;color:#142230}h1{font-size:25px}h2{margin-top:26px}section{break-inside:avoid;border-top:1px solid #ccc;margin-top:20px}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:5px;border-bottom:1px solid #ddd;overflow-wrap:anywhere}p{overflow-wrap:anywhere}@media print{body{margin:0}button{display:none}}</style></head><body><h1>OCTG engineering screening summary</h1><p>Application ${escapeHTML(meta.appVersion)} · Data ${escapeHTML(meta.dataVersion)} · ${escapeHTML(meta.analysisDate ?? new Date().toISOString())}</p><p>${escapeHTML(REPORT_LIMITATION)}</p><h2>${escapeHTML(well.name)}</h2><p>${well.illustrative ? 'Illustrative scenario; demonstration values.' : 'User-entered scenario.'} Pressures are absolute MPa, temperatures °C, diameters and wall thickness mm, depth m, chloride mg/L, yield MPa.</p><table><tbody>${Object.entries(
    well,
  )
    .map(([key, value]) => `<tr><th>${escapeHTML(key)}</th><td>${escapeHTML(value)}</td></tr>`)
    .join(
      '',
    )}</tbody></table><h2>Material candidates and screening criteria</h2>${candidates || '<p>No material candidates selected.</p>'}<button onclick="window.print()">Print / save PDF</button></body></html>`;
}
export function printEngineeringSummary(
  well: WellScenario,
  assessments: Assessment[],
  meta: ReportMetadata,
): boolean {
  const report = window.open('', '_blank');
  if (!report) return false;
  report.document.open();
  report.document.write(engineeringSummaryHTML(well, assessments, meta));
  report.document.close();
  report.focus();
  report.print();
  return true;
}
