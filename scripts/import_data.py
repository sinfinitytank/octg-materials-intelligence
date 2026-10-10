#!/usr/bin/env python3
"""Rebuild the versioned material catalog and audit from original files, offline.

Only the Python standard library is required. XLSX is read as ZIP/XML; nothing
ever saves a workbook. Source claims are retained, never upgraded to verification.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import posixpath
import re
import xml.etree.ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/source"
CSV_NAME = "octg_master_grades.csv"
VERSION = "2026-10-10.1"
KSI_TO_MPA = Decimal("6.894757293168361")
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
COLS = ['ID', 'Supplier', 'Region', 'Grade', 'Listing type', 'Standard context', 'Material family', 'Service / use', 'Typical application', 'H2S suitability', 'CO2 corrosion', 'High collapse', 'SMYS ksi', 'UNS', '5CRA Group', '5CRA Category', 'Relative cost tier', 'Price low USD/t', 'Price high USD/t', 'Price evidence', 'Vendor quote USD/t', 'Source URL', 'Source status', 'Technical notes', 'Reviewed']
DIRECT = {'id': 'ID', 'manufacturer': 'Supplier', 'region': 'Region', 'grade': 'Grade', 'listingType': 'Listing type', 'specification': 'Standard context', 'family': 'Material family', 'service': 'Service / use', 'application': 'Typical application', 'h2s': 'H2S suitability', 'co2': 'CO2 corrosion', 'collapseSource': 'High collapse', 'notes': 'Technical notes'}
NULLABLE = {'uns': 'UNS', 'craGroup': '5CRA Group', 'craCategory': '5CRA Category', 'costTier': 'Relative cost tier'}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def numeric(value: str):
    if value == "":
        return None
    n = Decimal(value)
    if not n.is_finite() or n < 0:
        raise ValueError(f"Invalid nonnegative source number: {value!r}")
    return int(n) if n == n.to_integral_value() else float(n)


def csv_rows():
    with (SOURCE / CSV_NAME).open(encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        if reader.fieldnames != COLS:
            raise ValueError("Unexpected CSV columns; update the reviewed mapping explicitly")
        rows = list(reader)
    if len(rows) != 450 or len({r['ID'] for r in rows}) != 450:
        raise ValueError("Expected all 450 unique original record IDs")
    if any(None in row or any(v is None for v in row.values()) for row in rows):
        raise ValueError("Malformed CSV row")
    return rows


def normalize(row: dict[str, str], line: int):
    item = {k: row[v] for k, v in DIRECT.items()}
    item.update({k: row[v] or None for k, v in NULLABLE.items()})
    y = numeric(row['SMYS ksi'])
    limits = ['Catalog claims are unverified; the recorded review date is not engineering qualification.',
              'No documented grade-specific environmental acceptance envelope, chemistry or complete mechanical property set is supplied.']
    if y is not None:
        limits.append('SMYS is copied from the supplied catalog; its derivation and applicable size, product form, temperature and heat treatment are unverified.')
    else:
        limits.append('Minimum yield strength is not documented; no value is inferred from the grade name.')
    if row['Supplier'] == 'API reference':
        limits.append('Generic API reference, not an identified manufacturer product or purchase qualification.')
    if row['Listing type'] == 'Supplier-named series/family':
        limits.append('Family-level listing, not a discrete orderable grade; any listed strength is a catalog range/lower bound requiring product confirmation.')
    if row['Listing type'] == 'Manufacturer CRA alloy/strength offering':
        limits.append('Alloy/strength option, not a unique supplier trade designation; confirm qualified supply.')
    if row['Price low USD/t']:
        limits.append('Historical indicative China FOB benchmark; observation day, quote validity, pipe size and supplier commercial basis are unavailable. Not a current quotation.')
    if '2023' in row['Source status']:
        limits.append('API CRA mapping refers to a 2023 licensing matrix; applicable contract edition and grade/category eligibility require confirmation.')
    if 'Historical' in row['Source status'] or re.search(r'\bM65\b', row['Grade']):
        limits.append('Historical or potentially withdrawn designation/availability requires confirmation before specification.')
    if 'M65' in row['Grade']:
        limits.append('Source identifies M65 as historical/withdrawn; no active qualification is implied.')
    item.update({
        'collapse': 'enhanced' if row['High collapse'] == 'Enhanced' else 'not-stated',
        'yieldMinKsi': y,
        'yieldMinMPa': None if y is None else round(float(Decimal(str(y)) * KSI_TO_MPA), 6),
        'pricing': {'lowUSDPerTonne': numeric(row['Price low USD/t']), 'highUSDPerTonne': numeric(row['Price high USD/t']), 'vendorUSDPerTonne': numeric(row['Vendor quote USD/t']), 'evidence': row['Price evidence']},
        'source': {'url': row['Source URL'] or None, 'status': row['Source status'], 'reviewedAt': row['Reviewed'] or None, 'verification': 'unverified', 'file': f'data/source/{CSV_NAME}', 'row': line},
        'properties': {'yieldMaxMPa': None, 'tensileMinMPa': None, 'elongationPercent': None, 'hardness': None, 'heatTreatment': None, 'chemistry': {}, 'environmentalEnvelope': None},
        'limitations': limits, 'raw': dict(row),
    })
    return item


def dataset(rows=None):
    rows = csv_rows() if rows is None else rows
    return {'schemaVersion': 1, 'dataVersion': VERSION, 'sourceSha256': sha256(SOURCE / CSV_NAME),
            'materials': [normalize(r, i) for i, r in enumerate(rows, 2)]}


def workbook(path: Path):
    """Read displayed text/numeric cells and formulas without spreadsheet execution."""
    with ZipFile(path) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            shared = [''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        rels = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        book = ET.fromstring(z.read('xl/workbook.xml'))
        result = {}
        for sheet in book.find('s:sheets', NS):
            rid = sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
            target = rels[rid]
            target = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
            tree = ET.fromstring(z.read(target))
            rows, formulas = [], []
            for node in tree.findall('s:sheetData/s:row', NS):
                vals = {}
                for cell in node.findall('s:c', NS):
                    address = cell.attrib['r']
                    letters = re.match('[A-Z]+', address)[0]
                    index = 0
                    for letter in letters:
                        index = index * 26 + ord(letter) - 64
                    form = cell.find('s:f', NS)
                    v = cell.find('s:v', NS)
                    value = '' if v is None or v.text is None else v.text
                    kind = cell.attrib.get('t')
                    if kind == 's':
                        value = shared[int(value)]
                    elif kind == 'inlineStr':
                        value = ''.join(cell.find('s:is', NS).itertext())
                    if form is not None:
                        formulas.append({'cell': address, 'formula': '=' + (form.text or ''), 'cachedValue': value or None})
                        value = '=' + (form.text or '')
                    vals[index] = value
                rows.append([vals.get(i, '') for i in range(1, max(vals, default=0) + 1)])
            result[sheet.attrib['name']] = {'rows': rows, 'formulas': formulas}
    return result


def canonical(value):
    if value is None or value == '':
        return ''
    if isinstance(value, (int, float)):
        return str(Decimal(str(value)).normalize()) if not float(value).is_integer() else str(int(value))
    return str(value)


def differences(rows, other):
    by_id = {r['ID']: r for r in other}
    changes = []
    for row in rows:
        dest = by_id.get(row['ID'])
        if dest is None:
            changes.append({'id': row['ID'], 'field': 'ID', 'csv': row['ID'], 'other': None})
            continue
        for col in COLS:
            if canonical(row[col]) != canonical(dest.get(col)):
                changes.append({'id': row['ID'], 'field': col, 'csv': row[col], 'other': dest.get(col)})
    return {'rowCount': len(other), 'distinctIDs': len(by_id), 'missingIDs': sorted(set(r['ID'] for r in rows) - set(by_id)), 'extraIDs': sorted(set(by_id) - set(r['ID'] for r in rows)), 'fieldDifferenceCount': len(changes), 'fieldDifferences': changes}


def legacy_logic_comparison(rows, dashboard):
    """Audit transcriptions only; never used for application engineering decisions."""
    presets = {
        'sweet': {'yield': 55, 'h2s': 0, 'co2': .1, 'cl': 5000, 'temp': 60, 'sulfur': False, 'collapse': False},
        'co2': {'yield': 80, 'h2s': 0, 'co2': 5, 'cl': 15000, 'temp': 85, 'sulfur': False, 'collapse': False},
        'sour': {'yield': 95, 'h2s': .1, 'co2': 7, 'cl': 25000, 'temp': 100, 'sulfur': False, 'collapse': True},
        'hpht': {'yield': 110, 'h2s': 2, 'co2': 30, 'cl': 80000, 'temp': 180, 'sulfur': True, 'collapse': True},
    }
    screening = dashboard['SCREENING']['rows'][1:]
    caches = {f['cell']: f['cachedValue'] for f in dashboard['SCREENING']['formulas']}
    results, flag_differences = {}, []
    for name, x in presets.items():
        diffs, cache_diffs = [], []
        for index, (r, s) in enumerate(zip(rows, screening), 2):
            mat, svc, h = r['Material family'], r['Service / use'].lower(), r['H2S suitability'].lower()
            ss = bool(re.search(r'\bsour\b|h2s|ssc', svc) or re.search(r'sour service:|qualification per iso|case-specific nace|mild/limited sour', h))
            alloy = bool(re.search(r'13Cr|9Cr|Low-Cr|Duplex|austenitic|CRA', mat, re.I))
            hc = bool(re.search(r'enhanced|high collapse', r['High collapse'], re.I) or 'collapse' in svc)
            if name == 'co2':
                for flag, actual, expected in [('sour', s[8] == 'Yes', ss), ('co2Alloy', s[9] == 'Yes', alloy), ('collapse', s[6] == 'Yes', hc)]:
                    if actual != expected:
                        flag_differences.append({'id': r['ID'], 'flag': flag, 'excel': actual, 'html': expected})
            known = r['SMYS ksi'] != ''
            meets = known and float(r['SMYS ksi']) >= x['yield']
            html_score = 43 + (14 if meets else 0)
            excel_score = 43 + (14 if meets else -20)
            common = (-15 if r['Supplier'] == 'API reference' else 0)
            common += (24 if ss else -18) if x['h2s'] > 0 else 0
            common += (14 if alloy else -13) if x['co2'] > 0 else 0
            common += (17 if hc else -14) if x['collapse'] else 0
            common += -17 if x['sulfur'] else 0
            html_score += common
            excel_score += common
            if x['cl'] >= 20000:
                html_score += -6 if re.search('13Cr', mat) else 6 if re.search('Duplex|Ni-base|austenitic', mat) else 0
            if x['temp'] >= 120 and re.search('13Cr', mat):
                html_score -= 6
            if x['h2s'] > 0 and re.search('carbon|low alloy', mat, re.I) and not ss:
                html_score -= 15
            html_score, excel_score = max(0, min(100, html_score)), max(0, min(100, excel_score))
            if html_score != excel_score:
                diffs.append({'id': r['ID'], 'grade': r['Grade'], 'htmlScore': html_score, 'excelScore': excel_score})
            if name == 'co2' and numeric(caches[f'Q{index}']) != excel_score:
                cache_diffs.append({'id': r['ID'], 'transcribedExcelScore': excel_score, 'cachedExcelScore': caches[f'Q{index}']})
        results[name] = {'inputs': x, 'scoreDifferenceCount': len(diffs), 'examples': diffs[:12]}
        if name == 'co2':
            results[name]['cachedScoreMismatchCount'] = len(cache_diffs)
            results[name]['cachedScoreMismatchExamples'] = cache_diffs[:12]
    return {'method': 'Static transcription of supplied HTML assess() and SCREENING Q-column formulas. All presets use wet water and unrestricted cost. Not a spreadsheet recalculation or qualification.',
            'flagDifferenceCount': len(flag_differences), 'flagDifferences': flag_differences, 'presets': results}


def audit(rows=None):
    rows = csv_rows() if rows is None else rows
    result = {'schemaVersion': 1, 'dataVersion': VERSION, 'sources': {}, 'csv': {}, 'workbooks': {}, 'html': {}}
    for path in sorted(SOURCE.iterdir()):
        if not path.is_file():
            continue
        result['sources'][path.name] = {'sha256': sha256(path), 'bytes': path.stat().st_size}
    identities = defaultdict(list)
    for r in rows:
        identities[(r['Supplier'], r['Grade'])].append(r['ID'])
    result['csv'] = {'rows': len(rows), 'columns': COLS, 'uniqueIDs': len({r['ID'] for r in rows}),
        'duplicateSupplierGrade': [{'supplier': k[0], 'grade': k[1], 'ids': v} for k, v in identities.items() if len(v) > 1],
        'repeatedGradeNames': {k: v for k, v in sorted(Counter(r['Grade'] for r in rows).items()) if v > 1},
        'missingByColumn': {k: sum(r[k] == '' for r in rows) for k in COLS},
        'supplierCounts': dict(sorted(Counter(r['Supplier'] for r in rows).items())),
        'familyCounts': dict(sorted(Counter(r['Material family'] for r in rows).items())),
        'listingTypeCounts': dict(sorted(Counter(r['Listing type'] for r in rows).items())),
        'knownYieldCount': sum(bool(r['SMYS ksi']) for r in rows),
        'pricedIDs': [r['ID'] for r in rows if r['Price low USD/t']],
        'familyListingIDs': [r['ID'] for r in rows if r['Listing type'] == 'Supplier-named series/family'],
        'exactM65GradeIDs': [r['ID'] for r in rows if re.search(r'\bM65\b', r['Grade'])]}
    books = {}
    for path in sorted(SOURCE.glob('*.xlsx')):
        book = workbook(path)
        books[path.name] = book
        summary = {}
        for name, sheet in book.items():
            cells = sheet['rows']
            summary[name] = {'xmlRowCount': len(cells), 'nonemptyRows': sum(any(v for v in r) for r in cells),
                'maxColumns': max(map(len, cells), default=0), 'formulaCount': len(sheet['formulas']),
                'formulaCachePresentCount': sum(f['cachedValue'] is not None for f in sheet['formulas']),
                'formulaSamples': sheet['formulas'][:10]}
        master = book['MASTER GRADES']['rows']
        summary['MASTER GRADES']['csvComparison'] = differences(rows, [dict(zip(master[0], r + [''] * (len(master[0])-len(r)))) for r in master[1:] if r and r[0]])
        result['workbooks'][path.name] = summary
    html_path = SOURCE / 'OCTG_Well_Material_Selector_Interactive.html'
    html = html_path.read_text(encoding='utf-8')
    start = html.index('const DATA=') + len('const DATA=')
    embedded, _ = json.JSONDecoder().raw_decode(html[start:])
    result['html'] = {'csvComparison': differences(rows, embedded), 'embeddedRecords': len(embedded)}
    dashboard = books['OCTG_Well_Material_Selection_Excel_Dashboard.xlsx']
    main = books['OCTG_API5CT_5CRA_Global_Grade_Master_2026.xlsx']
    result['sharedWorkbookSheetComparison'] = {name: dashboard[name]['rows'] == main[name]['rows'] for name in main if name in dashboard}
    result['legacyLogicComparison'] = legacy_logic_comparison(rows, dashboard)
    for name in ['PRICE BENCHMARKS', 'SOURCES', 'SELECTION METHODOLOGY', 'WELL INPUTS', 'COST ESTIMATOR', 'READ ME']:
        sheet = dashboard[name]['rows']
        result.setdefault('supportingSheets', {})[name] = sheet
    source_rows = dashboard['SOURCES']['rows'][1:]
    master_urls = {r['Source URL'] for r in rows}
    result['auxiliaryEvidence'] = {
        'sourceReferenceCount': len(source_rows),
        'masterRecordUniqueURLCount': len(master_urls),
        'auxiliaryOnlySources': [{'reference': r[0], 'url': r[1]} for r in source_rows if r[1] not in master_urls],
        'benchmarkObservationCount': len(dashboard['PRICE BENCHMARKS']['rows']) - 1,
        'recordLinkedRangeCount': sum(bool(r['Price low USD/t']) for r in rows),
        'distinctRecordLinkedBenchmarkGradeCount': 5,
        'recordLinkedRangeNote': 'Six API baseline rows share five generic China FOB observations: N80 Type 1 and N80 Type Q share the N80 range. Other workbook benchmarks remain auxiliary observations in their original units/basis.',
        'legacyEstimatorInputsAreIllustrative': True,
    }
    return result


def serialized(value):
    return json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n'


def outputs():
    rows = csv_rows()
    inventory = audit(rows)
    ref_book = 'OCTG_Well_Material_Selection_Excel_Dashboard.xlsx'
    reference = {'schemaVersion': 1, 'dataVersion': VERSION, 'sourceWorkbook': f'data/source/{ref_book}',
                 'sourceSha256': sha256(SOURCE/ref_book), 'verification': 'unverified'}
    for sheet, key in [('SOURCES', 'sources'), ('PRICE BENCHMARKS', 'benchmarks')]:
        values = inventory['supportingSheets'][sheet]
        reference[key] = [{'sourceRow': i, 'raw': dict(zip(values[0], r + [''] * (len(values[0])-len(r))))} for i, r in enumerate(values[1:], 2)]
    return {ROOT/'data/processed/materials.json': serialized(dataset(rows)),
            ROOT/'public/data/materials.json': serialized(dataset(rows)),
            ROOT/'data/processed/source-audit.json': serialized(inventory),
            ROOT/'data/processed/reference-data.json': serialized(reference),
            ROOT/'public/data/reference-data.json': serialized(reference)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if any generated artifact differs; write nothing')
    args = parser.parse_args()
    for path, value in outputs().items():
        if args.check:
            if not path.exists() or path.read_text(encoding='utf-8') != value:
                raise SystemExit(f'Stale generated artifact: {path.relative_to(ROOT)}')
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(value, encoding='utf-8')
    print('Catalog import verified: 450 records; all source claims remain unverified.' if args.check else 'Imported 450 records and audited four originals.')


if __name__ == '__main__':
    main()
