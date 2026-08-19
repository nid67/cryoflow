"""
Unit tests for the Live Hourly IoT Telemetry Simulator (scripts/live_sensor_simulator.py)
"""
import os
import sys
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from scripts.live_sensor_simulator import (
    LiveColdChainSimulator,
    get_configured_interval,
    DEFAULT_INTERVAL_SECONDS,
    format_duration
)

class TestLiveSensorSimulator(unittest.TestCase):
    def test_default_interval_is_3600_seconds(self):
        with patch.dict(os.environ, {}, clear=True):
            interval = get_configured_interval()
            self.assertEqual(interval, 3600)
            self.assertEqual(DEFAULT_INTERVAL_SECONDS, 3600)

    def test_environment_variable_interval_override(self):
        with patch.dict(os.environ, {"SIMULATOR_INTERVAL_SECONDS": "1800"}):
            interval = get_configured_interval()
            self.assertEqual(interval, 1800)

    def test_demo_mode_interval(self):
        # Demo mode should default to 30 seconds
        interval = get_configured_interval(is_demo=True)
        self.assertEqual(interval, 30)

        with patch.dict(os.environ, {"DEMO_MODE": "true"}):
            interval_env = get_configured_interval()
            self.assertEqual(interval_env, 30)

    def test_format_duration(self):
        self.assertEqual(format_duration(3600), "1 hour")
        self.assertEqual(format_duration(7200), "2 hours")
        self.assertEqual(format_duration(30), "30 seconds")
        self.assertEqual(format_duration(300), "5 minutes")

    def test_single_active_shipment_tick(self):
        simulator = LiveColdChainSimulator(dry_run=True)
        sample_shipment = {
            "id": "test-shp-101",
            "tracking_number": "CRY-101",
            "product_category": "Vaccines",
            "product_name": "mRNA COVID-19 Ultra-Cold Vaccines",
            "quantity": 25000,
            "shipment_value": 750000.0,
            "origin": "Frankfurt (FRA)",
            "destination": "Boston (BOS)",
            "current_location": "Mid-Atlantic",
            "current_temperature": -78.0,
            "humidity": 45.0,
            "transit_time_hours": 3.0,
            "vehicle_number": "LH-774",
            "current_status": "In Transit",
            "spoilage_risk": 1.0,
            "health_score": 99.0,
            "remaining_shelf_life_days": 28.0
        }

        tel, update, pred, alert = simulator.simulate_telemetry_tick(sample_shipment, step_hours=1.0)

        # 1. Telemetry point verified
        self.assertEqual(tel["shipment_id"], "test-shp-101")
        self.assertIn("temperature", tel)
        self.assertIn("ambient_temperature", tel)
        self.assertIn("compressor_status", tel)
        self.assertIn("latitude", tel)
        self.assertIn("longitude", tel)

        # 2. Shipment update verified
        self.assertEqual(update["transit_time_hours"], 4.0)
        self.assertIn("current_temperature", update)
        self.assertIn("current_location", update)
        self.assertIn("spoilage_risk", update)

        # 3. AI prediction verified
        self.assertEqual(pred["shipment_id"], "test-shp-101")
        self.assertIn("spoilage_risk_percent", pred)

    def test_warning_status_escalation_alert(self):
        simulator = LiveColdChainSimulator(dry_run=True)
        sample_breached_shipment = {
            "id": "test-shp-warning",
            "tracking_number": "CRY-WARN-99",
            "product_category": "Dairy",
            "product_name": "Organic Pasteurized Whole Milk & Butter",
            "quantity": 10000,
            "shipment_value": 40000.0,
            "origin": "Madison, WI",
            "destination": "Chicago, IL",
            "current_location": "Rockford",
            "current_temperature": 8.5, # already warm
            "humidity": 80.0,
            "transit_time_hours": 3.0,
            "vehicle_number": "TRK-99",
            "current_status": "Warning",
            "spoilage_risk": 45.0,
            "health_score": 55.0,
            "remaining_shelf_life_days": 10.0
        }

        tel, update, pred, alert = simulator.simulate_telemetry_tick(sample_breached_shipment, step_hours=1.0)
        self.assertTrue(update["requires_decision"])
        self.assertIsNotNone(alert)
        self.assertEqual(alert["shipment_id"], "test-shp-warning")
        self.assertIn("LIVE SENSOR ALERT", alert["title"])

if __name__ == "__main__":
    unittest.main()
