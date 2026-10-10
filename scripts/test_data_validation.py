#!/usr/bin/env python3
"""Regression checks that reject unsafe catalog corruption and false precision."""
import copy
import json
import unittest

from import_data import ROOT, csv_rows, dataset
from validate_data import validate_catalog


class MigrationIntegrityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows = csv_rows()
        cls.schema = json.loads((ROOT/'data/schemas/materials.schema.json').read_text())
        cls.catalog = dataset(cls.rows)

    def rejected(self, mutate):
        catalog = copy.deepcopy(self.catalog)
        mutate(catalog)
        self.assertTrue(validate_catalog(catalog, self.rows, self.schema))

    def test_original_catalog_passes(self):
        self.assertEqual(validate_catalog(self.catalog, self.rows, self.schema), [])

    def test_unknown_strength_cannot_be_filled_from_grade_name(self):
        def mutate(d):
            next(m for m in d['materials'] if m['yieldMinKsi'] is None)['yieldMinKsi'] = 80
        self.rejected(mutate)

    def test_review_cannot_be_promoted_to_verified(self):
        self.rejected(lambda d: d['materials'][0]['source'].update(verification='verified'))

    def test_missing_property_requires_explicit_null(self):
        self.rejected(lambda d: d['materials'][0]['properties'].pop('tensileMinMPa'))

    def test_invented_chemistry_is_rejected(self):
        self.rejected(lambda d: d['materials'][0]['properties']['chemistry'].update(Cr=13))

    def test_unit_conversion_error_is_rejected(self):
        self.rejected(lambda d: d['materials'][0].update(yieldMinMPa=110))

    def test_duplicate_id_is_rejected(self):
        self.rejected(lambda d: d['materials'][1].update(id=d['materials'][0]['id']))

    def test_raw_source_loss_is_rejected(self):
        self.rejected(lambda d: d['materials'][0]['raw'].update(**{'Technical notes': ''}))

    def test_unknown_price_cannot_be_zero(self):
        self.rejected(lambda d: d['materials'][0]['pricing'].update(vendorUSDPerTonne=0))

    def test_future_contract_field_is_not_silently_accepted(self):
        self.rejected(lambda d: d['materials'][0].update(qualified=True))


if __name__ == '__main__':
    unittest.main()
