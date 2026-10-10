#!/usr/bin/env python3
"""Validate catalog schema, original provenance, exact migration and domain gaps."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
import json
import math
import re
import sys
from urllib.parse import urlparse

from import_data import ROOT, SOURCE, CSV_NAME, COLS, DIRECT, NULLABLE, csv_rows, sha256, outputs


def check_schema(value, schema, path='$'):
    """Apply the checked-in schema subset without a third-party runtime dependency."""
    errors = []
    kinds = schema.get('type')
    kinds = kinds if isinstance(kinds, list) else [kinds] if kinds else []
    matches = {'null': value is None, 'string': isinstance(value, str),
        'number': isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value),
        'integer': isinstance(value, int) and not isinstance(value, bool),
        'object': isinstance(value, dict), 'array': isinstance(value, list), 'boolean': isinstance(value, bool)}
    if kinds and not any(matches.get(k, False) for k in kinds):
        return [f'{path}: expected {kinds}, got {type(value).__name__}']
    if 'const' in schema and value != schema['const']:
        errors.append(f"{path}: expected constant {schema['const']!r}")
    if 'enum' in schema and value not in schema['enum']:
        errors.append(f'{path}: value outside enum')
    if isinstance(value, str):
        if len(value) < schema.get('minLength', 0):
            errors.append(f'{path}: missing required text')
        if 'pattern' in schema and not re.search(schema['pattern'], value):
            errors.append(f'{path}: invalid format')
    if isinstance(value, (int, float)) and not isinstance(value, bool) and value < schema.get('minimum', -math.inf):
        errors.append(f'{path}: below minimum')
    if isinstance(value, list):
        if len(value) < schema.get('minItems', 0) or len(value) > schema.get('maxItems', math.inf):
            errors.append(f'{path}: invalid item count')
        for i, item in enumerate(value):
            errors.extend(check_schema(item, schema.get('items', {}), f'{path}[{i}]'))
    if isinstance(value, dict):
        props = schema.get('properties', {})
        for key in schema.get('required', []):
            if key not in value:
                errors.append(f'{path}.{key}: required field omitted (unknown values must be explicit null)')
        if 'maxProperties' in schema and len(value) > schema['maxProperties']:
            errors.append(f'{path}: undocumented properties supplied')
        for key, item in value.items():
            if key in props:
                errors.extend(check_schema(item, props[key], f'{path}.{key}'))
            elif schema.get('additionalProperties') is False:
                errors.append(f'{path}.{key}: unexpected field')
            elif isinstance(schema.get('additionalProperties'), dict):
                errors.extend(check_schema(item, schema['additionalProperties'], f'{path}.{key}'))
    return errors


def validate_catalog(catalog, rows, schema):
    errors = check_schema(catalog, schema)
    if errors:
        return errors
    if catalog['sourceSha256'] != sha256(SOURCE / CSV_NAME):
        errors.append('Dataset SHA-256 does not match the original CSV')
    materials = catalog['materials']
    ids = [m['id'] for m in materials]
    if ids != [r['ID'] for r in rows] or len(set(ids)) != len(rows):
        errors.append('Stable record IDs, row count or source ordering changed')
    for index, (m, row) in enumerate(zip(materials, rows), 2):
        prefix = f"{m['id']} (CSV row {index})"
        if m['raw'] != row:
            errors.append(f'{prefix}: raw cells differ from original CSV')
        for key, col in {**DIRECT, **NULLABLE}.items():
            expected = row[col] or None if key in NULLABLE else row[col]
            if m[key] != expected:
                errors.append(f'{prefix}: {key} differs from source')
        for field, col in [('yieldMinKsi', 'SMYS ksi')]:
            expected = None if row[col] == '' else float(Decimal(row[col]))
            if m[field] != expected:
                errors.append(f'{prefix}: {field} is missing, invented or altered')
        expected_mpa = None if row['SMYS ksi'] == '' else round(float(Decimal(row['SMYS ksi']) * Decimal('6.894757293168361')), 6)
        if m['yieldMinMPa'] != expected_mpa:
            errors.append(f'{prefix}: ksi to MPa conversion inconsistent')
        if m['collapse'] != ('enhanced' if row['High collapse'] == 'Enhanced' else 'not-stated'):
            errors.append(f'{prefix}: collapse catalog flag altered')
        for field, col in [('lowUSDPerTonne', 'Price low USD/t'), ('highUSDPerTonne', 'Price high USD/t'), ('vendorUSDPerTonne', 'Vendor quote USD/t')]:
            expected = None if row[col] == '' else float(Decimal(row[col]))
            if m['pricing'][field] != expected:
                errors.append(f'{prefix}: price differs from source or unknown converted to zero')
        low, high = m['pricing']['lowUSDPerTonne'], m['pricing']['highUSDPerTonne']
        if (low is None) != (high is None) or low is not None and low > high:
            errors.append(f'{prefix}: inconsistent price range')
        if m['pricing']['evidence'] != row['Price evidence']:
            errors.append(f'{prefix}: price evidence lost')
        src = m['source']
        if src != {'url': row['Source URL'] or None, 'status': row['Source status'], 'reviewedAt': row['Reviewed'] or None,
            'verification': 'unverified', 'file': f'data/source/{CSV_NAME}', 'row': index}:
            errors.append(f'{prefix}: provenance changed or review promoted to verification')
        if src['url'] is not None:
            u = urlparse(src['url'])
            if u.scheme not in ('https', 'http') or not u.hostname or u.username or u.password:
                errors.append(f'{prefix}: invalid source URL')
        if src['reviewedAt'] is not None:
            try:
                date.fromisoformat(src['reviewedAt'])
            except ValueError:
                errors.append(f'{prefix}: invalid reviewed date')
        if any(v is not None for k, v in m['properties'].items() if k != 'chemistry') or m['properties']['chemistry']:
            errors.append(f'{prefix}: unsupported property, chemistry or environment envelope invented')
        if m['listingType'] == 'Supplier-named series/family' and not any('Family-level' in s for s in m['limitations']):
            errors.append(f'{prefix}: family-level limitation omitted')
        if low is not None and not any('Historical indicative' in s for s in m['limitations']):
            errors.append(f'{prefix}: historical benchmark limitation omitted')
    return errors


def main():
    manifest = json.loads((ROOT/'data/source-manifest.json').read_text())
    errors = []
    actual_files = {p.name for p in SOURCE.iterdir() if p.is_file()}
    if actual_files != set(manifest['sha256']):
        errors.append('Original source file set changed')
    for name, expected in manifest['sha256'].items():
        path = SOURCE/name
        if not path.is_file() or sha256(path) != expected:
            errors.append(f'Original source changed: {name}')
    rows = csv_rows()
    schema = json.loads((ROOT/'data/schemas/materials.schema.json').read_text())
    for name in ['data/processed/materials.json', 'public/data/materials.json']:
        path = ROOT/name
        try:
            data = json.loads(path.read_text(), parse_constant=lambda c: (_ for _ in ()).throw(ValueError(f'Nonfinite JSON {c}')))
            errors.extend(f'{name}: {e}' for e in validate_catalog(data, rows, schema))
        except (OSError, ValueError, KeyError, TypeError) as exc:
            errors.append(f'{name}: {exc}')
    for path, expected in outputs().items():
        if not path.is_file() or path.read_text(encoding='utf-8') != expected:
            errors.append(f'Generated artifact is stale or nondeterministic: {path.relative_to(ROOT)}')
    inventory = json.loads((ROOT/'data/processed/source-audit.json').read_text())
    comparisons = [inventory['html']['csvComparison']] + [book['MASTER GRADES']['csvComparison'] for book in inventory['workbooks'].values()]
    if any(c['fieldDifferenceCount'] or c['missingIDs'] or c['extraIDs'] or c['rowCount'] != 450 for c in comparisons):
        errors.append('Original catalog representations disagree; review source audit')
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        raise SystemExit(1)
    print('PASS: 450 stable IDs; all 4 original hashes intact; CSV/XLSX/HTML catalogs agree; exact raw cells, nulls, unit conversion, provenance and generated artifacts verified.')


if __name__ == '__main__':
    main()
