"""
Unit tests for the Valtway Risk and Kinetic Analysis Engine (backend/risk_engine.py)
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.risk_engine import (
    DeterministicKineticRiskEngine,
    MLRiskEngineStub,
    ValtwayRiskService,
    CATEGORY_PROFILES
)

class TestRiskEngine(unittest.TestCase):
    def setUp(self):
        self.engine = DeterministicKineticRiskEngine()
        self.service = ValtwayRiskService(engine=self.engine)

    def test_category_envelopes(self):
        # mRNA Ultra-Cold Vaccine
        env_mrna = self.engine.get_product_envelope("Vaccines", -78.0)
        self.assertEqual(env_mrna["min_temp"], -85.0)
        self.assertEqual(env_mrna["max_temp"], -70.0)

        # Standard Cold Vaccine
        env_std = self.engine.get_product_envelope("Vaccines", 4.0)
        self.assertEqual(env_std["min_temp"], 2.0)
        self.assertEqual(env_std["max_temp"], 8.0)

        # Dairy
        env_dairy = self.engine.get_product_envelope("Dairy", 3.0)
        self.assertEqual(env_dairy["min_temp"], 1.0)
        self.assertEqual(env_dairy["max_temp"], 4.0)

        # Quick-Commerce
        env_qc = self.engine.get_product_envelope("Quick-Commerce Groceries", 2.0)
        self.assertEqual(env_qc["min_temp"], 0.5)
        self.assertEqual(env_qc["max_temp"], 3.5)

    def test_normal_risk_threshold(self):
        # Nominal temperature within range for 4 hours
        res = self.engine.evaluate(
            product_category="Vaccines",
            product_name="Standard Vaccine",
            current_temp=4.5,
            transit_time_hours=4.0,
            shipment_value=100000.0
        )
        self.assertEqual(res.risk_level, "NORMAL")
        self.assertTrue(res.spoilage_risk_percent <= 25.0)
        self.assertFalse(res.requires_decision)
        self.assertTrue(res.health_score >= 75.0)
        self.assertIn("Parameters nominal", res.ai_recommendation)

    def test_warning_risk_threshold(self):
        # Mild thermal excursion for Dairy (allowed: 1-4°C, actual: 7.5°C)
        res = self.engine.evaluate(
            product_category="Dairy",
            product_name="Organic Milk",
            current_temp=7.5,
            transit_time_hours=5.0,
            shipment_value=50000.0
        )
        self.assertEqual(res.risk_level, "WARNING")
        self.assertTrue(res.spoilage_risk_percent > 25.0 and res.spoilage_risk_percent <= 60.0)
        self.assertTrue(res.requires_decision)
        self.assertIn("WARNING", res.ai_recommendation)
        self.assertTrue(res.estimated_financial_loss_usd > 0)

    def test_critical_breach_threshold(self):
        # Severe excursion for Quick-Commerce Groceries (allowed: 0.5-3.5°C, actual: 16.0°C)
        res = self.engine.evaluate(
            product_category="Quick-Commerce Groceries",
            product_name="Exotic Berries",
            current_temp=16.0,
            transit_time_hours=8.0,
            shipment_value=20000.0
        )
        self.assertEqual(res.risk_level, "CRITICAL BREACH")
        self.assertTrue(res.spoilage_risk_percent > 60.0)
        self.assertTrue(res.requires_decision)
        self.assertIn("CRITICAL BREACH", res.ai_recommendation)

    def test_cumulative_temperature_history_impact(self):
        # Comparison: 1 single reading vs cumulative degree-hours
        history_normal = [(4.0, 1.0), (4.2, 1.0), (4.1, 1.0), (4.0, 1.0)]
        res_normal = self.engine.evaluate(
            product_category="Vaccines",
            product_name="Polio Vaccine",
            current_temp=4.0,
            transit_time_hours=4.0,
            shipment_value=100000.0,
            temperature_history=history_normal
        )

        history_excursion = [(4.0, 1.0), (7.0, 1.0), (9.5, 1.0), (11.0, 1.0)]
        res_excursion = self.engine.evaluate(
            product_category="Vaccines",
            product_name="Polio Vaccine",
            current_temp=11.0,
            transit_time_hours=4.0,
            shipment_value=100000.0,
            temperature_history=history_excursion
        )

        self.assertTrue(res_excursion.spoilage_risk_percent > res_normal.spoilage_risk_percent)
        self.assertTrue(res_normal.health_score > res_excursion.health_score)

    def test_ml_adapter_modularity(self):
        ml_stub = MLRiskEngineStub()
        res = ml_stub.evaluate(
            product_category="Vaccines",
            product_name="Test",
            current_temp=4.0,
            transit_time_hours=2.0,
            shipment_value=50000.0
        )
        self.assertIn("ml_xgboost_stub", res.model_type)

    def test_process_telemetry_event_pipeline(self):
        shipment_data = {
            "id": "shp-test-555",
            "tracking_number": "CRY-555",
            "product_category": "Dairy",
            "product_name": "Artisanal Cream",
            "quantity": 5000,
            "shipment_value": 30000.0,
            "current_temperature": 3.0,
            "humidity": 65.0,
            "transit_time_hours": 4.0,
            "current_status": "In Transit"
        }
        telemetry_point = {
            "temperature": 8.0, # Breached
            "humidity": 75.0
        }

        risk_res, pred, update, alert = self.service.process_telemetry_event(
            shipment_data, telemetry_point
        )
        self.assertEqual(pred["shipment_id"], "shp-test-555")
        self.assertEqual(update["current_temperature"], 8.0)
        self.assertEqual(update["current_status"], "Warning")
        self.assertTrue(update["requires_decision"])
        self.assertIsNotNone(alert)
        self.assertEqual(alert["shipment_id"], "shp-test-555")

if __name__ == "__main__":
    unittest.main()
