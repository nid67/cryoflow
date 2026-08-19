"""
Unit tests for the Synthetic Cold-Chain Telemetry Generator
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from scripts.generate_synthetic_telemetry import (
    ColdChainSyntheticEngine,
    PRODUCT_CATALOG,
    ROUTES_DATABASE
)

class TestSyntheticTelemetryGenerator(unittest.TestCase):
    def setUp(self):
        self.engine = ColdChainSyntheticEngine(seed=123)

    def test_product_categories_exist(self):
        self.assertIn("Vaccines", PRODUCT_CATALOG)
        self.assertIn("Dairy", PRODUCT_CATALOG)
        self.assertIn("Quick-Commerce Groceries", PRODUCT_CATALOG)

    def test_single_shipment_generation(self):
        shipment = self.engine.generate_single_shipment(
            category="Vaccines",
            scenario="normal",
            points_count=10,
            interval_minutes=30
        )
        self.assertEqual(shipment.product_category, "Vaccines")
        self.assertEqual(len(shipment.telemetry_logs), 10)
        self.assertEqual(len(shipment.predictions), 1)
        self.assertTrue(shipment.health_score >= 0 and shipment.health_score <= 100)
        self.assertTrue(shipment.spoilage_risk >= 0 and shipment.spoilage_risk <= 100)

    def test_excursion_failure_scenario(self):
        shipment = self.engine.generate_single_shipment(
            category="Dairy",
            scenario="compressor_failure",
            points_count=20,
            interval_minutes=30
        )
        self.assertEqual(shipment.product_category, "Dairy")
        # In compressor failure, risk should elevate
        self.assertTrue(shipment.spoilage_risk > 20.0)
        self.assertTrue(shipment.requires_decision)
        # Check compressor status in telemetry
        statuses = [t.compressor_status for t in shipment.telemetry_logs]
        self.assertTrue("Fault" in statuses or "Off" in statuses or "Warning" in statuses)

    def test_batch_generation(self):
        batch = self.engine.generate_batch(num_shipments=6, points_per_shipment=8, interval_minutes=20)
        self.assertEqual(len(batch), 6)
        total_telemetry = sum(len(s.telemetry_logs) for s in batch)
        self.assertEqual(total_telemetry, 48)

    def test_live_telemetry_step(self):
        shipment = self.engine.generate_single_shipment(category="Quick-Commerce Groceries", points_count=5)
        shipment_dict = {
            "id": shipment.id,
            "current_temperature": shipment.current_temperature,
            "humidity": shipment.humidity,
            "product_category": shipment.product_category,
            "current_status": shipment.current_status,
            "battery": 88.0,
            "latitude": 38.0,
            "longitude": -100.0
        }
        next_point = ColdChainSyntheticEngine.generate_live_telemetry_step(shipment_dict, interval_minutes=15)
        self.assertEqual(next_point["shipment_id"], shipment.id)
        self.assertIn("temperature", next_point)
        self.assertIn("humidity", next_point)
        self.assertIn("ambient_temperature", next_point)
        self.assertIn("compressor_status", next_point)
        self.assertIn("speed", next_point)

if __name__ == "__main__":
    unittest.main()
