"""
Unit tests for the Historical Batch Seeding Engine (scripts/seed_batch.py)
"""
import os
import sys
import unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from scripts.seed_batch import HistoricalSeeder, generate_sql_script

class TestHistoricalBatchSeeder(unittest.TestCase):
    def setUp(self):
        self.seeder = HistoricalSeeder(seed=99)

    def test_30_day_dataset_generation(self):
        shipments, telemetry, predictions, alerts, decisions = self.seeder.generate_30_day_dataset(
            num_shipments=25,
            points_per_shipment=15,
            days_span=30
        )
        self.assertEqual(len(shipments), 25)
        self.assertEqual(len(telemetry), 25 * 15)
        self.assertEqual(len(predictions), 25)
        self.assertTrue(len(alerts) > 0)
        self.assertTrue(len(decisions) > 0)

        # Check timestamp spread across 30 days
        created_dates = [datetime.strptime(s["created_at"], "%Y-%m-%d %H:%M UTC").replace(tzinfo=timezone.utc) for s in shipments]
        oldest = min(created_dates)
        newest = max(created_dates)
        time_span_days = (newest - oldest).total_seconds() / (24 * 3600)
        self.assertTrue(time_span_days >= 25.0)

    def test_idempotency_deterministic_ids(self):
        s1, t1, _, _, _ = self.seeder.generate_30_day_dataset(num_shipments=5, points_per_shipment=5)
        s2, t2, _, _, _ = self.seeder.generate_30_day_dataset(num_shipments=5, points_per_shipment=5)
        # Same seed should produce identical deterministic UUIDs
        self.assertEqual([s["id"] for s in s1], [s["id"] for s in s2])
        self.assertEqual([t["id"] for t in t1], [t["id"] for t in t2])

    def test_sql_export(self):
        shipments, telemetry, predictions, alerts, decisions = self.seeder.generate_30_day_dataset(
            num_shipments=5,
            points_per_shipment=5
        )
        test_sql_path = "tests/test_historical_output.sql"
        generate_sql_script(shipments, telemetry, predictions, alerts, decisions, test_sql_path)
        self.assertTrue(os.path.exists(test_sql_path))
        with open(test_sql_path, "r", encoding="utf-8") as f:
            content = f.read()
            self.assertIn("ON CONFLICT (id) DO UPDATE", content)
            self.assertIn("INSERT INTO telemetry_logs", content)
            self.assertIn("INSERT INTO ai_predictions", content)
        if os.path.exists(test_sql_path):
            os.remove(test_sql_path)

if __name__ == "__main__":
    unittest.main()
