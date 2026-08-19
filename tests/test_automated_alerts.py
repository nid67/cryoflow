"""
Unit tests for Automated Alert Generation in PostgreSQL / Python Trigger Simulation (tests/test_automated_alerts.py)
"""
import os
import sys
import unittest
import sqlite3
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.risk_engine import CryoFlowRiskService

class TestAutomatedAlerts(unittest.TestCase):
    def setUp(self):
        # Create an in-memory SQLite database simulating the PostgreSQL trigger
        self.conn = sqlite3.connect(":memory:")
        self.cursor = self.conn.cursor()

        # Create minimal tables
        self.cursor.executescript("""
        CREATE TABLE warehouses (
            id TEXT PRIMARY KEY,
            code TEXT,
            name TEXT
        );

        CREATE TABLE shipments (
            id TEXT PRIMARY KEY,
            tracking_number TEXT,
            warehouse_id TEXT,
            product_category TEXT,
            product_name TEXT,
            quantity INTEGER,
            shipment_value REAL,
            origin TEXT,
            destination TEXT,
            current_location TEXT,
            current_temperature REAL,
            humidity REAL,
            transit_time_hours REAL,
            current_status TEXT,
            spoilage_risk REAL,
            health_score REAL,
            remaining_shelf_life_days REAL,
            estimated_financial_loss REAL,
            estimated_carbon_impact_kg REAL,
            recommendation TEXT,
            requires_decision INTEGER,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE telemetry_logs (
            id TEXT PRIMARY KEY,
            shipment_id TEXT,
            recorded_at TEXT,
            temperature REAL,
            humidity REAL,
            ambient_temperature REAL,
            compressor_status TEXT,
            battery REAL,
            latitude REAL,
            longitude REAL,
            speed REAL,
            created_at TEXT
        );

        CREATE TABLE alerts (
            id TEXT PRIMARY KEY,
            shipment_id TEXT,
            warehouse_id TEXT,
            alert_type TEXT,
            severity TEXT,
            title TEXT,
            message TEXT,
            resolved INTEGER,
            created_at TEXT
        );

        -- SQLite Trigger simulating PostgreSQL PL/pgSQL trigger
        CREATE TRIGGER trg_auto_alert_telemetry
        AFTER INSERT ON telemetry_logs
        FOR EACH ROW
        BEGIN
            -- 1. Check if temperature exceeds threshold for category (Vaccines: 2.0 to 8.0)
            INSERT INTO alerts (id, shipment_id, warehouse_id, alert_type, severity, title, message, resolved, created_at)
            SELECT
                lower(hex(randomblob(16))),
                NEW.shipment_id,
                s.warehouse_id,
                CASE WHEN NEW.compressor_status IN ('Fault', 'Off') THEN 'Compressor Failure' ELSE 'Temperature Alert' END,
                CASE 
                    WHEN NEW.compressor_status IN ('Fault', 'Off') THEN 'Critical'
                    WHEN (s.product_category = 'Vaccines' AND (NEW.temperature > 12.0 OR NEW.temperature < 0.0)) THEN 'Critical'
                    WHEN (s.product_category = 'Dairy' AND (NEW.temperature > 8.0 OR NEW.temperature < 0.0)) THEN 'Critical'
                    WHEN (s.product_category = 'Quick-Commerce Groceries' AND (NEW.temperature > 7.0 OR NEW.temperature < 0.0)) THEN 'Critical'
                    ELSE 'High'
                END,
                'CRITICAL ALERT: ' || s.tracking_number,
                s.product_name || ' reached ' || NEW.temperature || ' C. Excursion detected.',
                0,
                NEW.recorded_at
            FROM shipments s
            WHERE s.id = NEW.shipment_id
              AND (
                NEW.compressor_status IN ('Fault', 'Off')
                OR (s.product_category = 'Vaccines' AND (NEW.temperature > 8.0 OR NEW.temperature < 2.0))
                OR (s.product_category = 'Dairy' AND (NEW.temperature > 4.0 OR NEW.temperature < 1.0))
                OR (s.product_category = 'Quick-Commerce Groceries' AND (NEW.temperature > 3.5 OR NEW.temperature < 0.5))
              );

            -- 2. Update parent shipment status
            UPDATE shipments
            SET current_temperature = NEW.temperature,
                requires_decision = 1,
                current_status = CASE 
                    WHEN (s.product_category = 'Vaccines' AND (NEW.temperature > 12.0 OR NEW.temperature < 0.0)) THEN 'Critical Breach'
                    WHEN NEW.compressor_status IN ('Fault', 'Off') THEN 'Critical Breach'
                    ELSE 'Warning'
                END
            FROM (SELECT id, product_category FROM shipments WHERE id = NEW.shipment_id) s
            WHERE shipments.id = NEW.shipment_id
              AND (
                NEW.compressor_status IN ('Fault', 'Off')
                OR (s.product_category = 'Vaccines' AND (NEW.temperature > 8.0 OR NEW.temperature < 2.0))
                OR (s.product_category = 'Dairy' AND (NEW.temperature > 4.0 OR NEW.temperature < 1.0))
                OR (s.product_category = 'Quick-Commerce Groceries' AND (NEW.temperature > 3.5 OR NEW.temperature < 0.5))
              );
        END;
        """)

        # Insert seed warehouse and shipments
        self.warehouse_id = str(uuid.uuid4())
        self.shipment_vaccine = str(uuid.uuid4())
        self.shipment_dairy = str(uuid.uuid4())

        self.cursor.execute(
            "INSERT INTO warehouses (id, code, name) VALUES (?, ?, ?)",
            (self.warehouse_id, "WH-BOS", "Boston Cold Hub")
        )

        self.cursor.execute("""
        INSERT INTO shipments (
            id, tracking_number, warehouse_id, product_category, product_name, quantity, shipment_value,
            origin, destination, current_location, current_temperature, humidity, transit_time_hours,
            current_status, spoilage_risk, health_score, remaining_shelf_life_days, estimated_financial_loss,
            estimated_carbon_impact_kg, recommendation, requires_decision, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            self.shipment_vaccine, "CRY-VAC-01", self.warehouse_id, "Vaccines",
            "Polio Vaccines", 10000, 250000.0, "Frankfurt", "Boston", "In Transit",
            4.0, 50.0, 3.0, "In Transit", 0.5, 99.5, 90.0, 1250.0, 15.0,
            "Parameters nominal.", 0, "2026-08-19 00:00 UTC", "2026-08-19 00:00 UTC"
        ))

        self.conn.commit()

    def tearDown(self):
        self.conn.close()

    def test_nominal_telemetry_creates_no_alert(self):
        # Insert safe reading (4.5°C for Vaccines)
        self.cursor.execute("""
        INSERT INTO telemetry_logs (id, shipment_id, recorded_at, temperature, humidity, ambient_temperature, compressor_status, battery, latitude, longitude, speed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), self.shipment_vaccine, "2026-08-19 01:00 UTC", 4.5, 50.0, 20.0, "Normal", 95.0, 42.0, -71.0, 60.0, "2026-08-19 01:00 UTC"))
        self.conn.commit()

        # Check alerts
        self.cursor.execute("SELECT COUNT(*) FROM alerts WHERE shipment_id = ?", (self.shipment_vaccine,))
        count = self.cursor.fetchone()[0]
        self.assertEqual(count, 0)

    def test_critical_temperature_excursion_automatically_creates_alert(self):
        # Insert critical excursion (15.5°C for Vaccines, max allowed is 8.0°C)
        self.cursor.execute("""
        INSERT INTO telemetry_logs (id, shipment_id, recorded_at, temperature, humidity, ambient_temperature, compressor_status, battery, latitude, longitude, speed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), self.shipment_vaccine, "2026-08-19 02:00 UTC", 15.5, 65.0, 28.0, "Active", 90.0, 42.1, -71.2, 55.0, "2026-08-19 02:00 UTC"))
        self.conn.commit()

        # 1. Verify alert created automatically
        self.cursor.execute("SELECT shipment_id, severity, resolved, title, message FROM alerts WHERE shipment_id = ?", (self.shipment_vaccine,))
        alert = self.cursor.fetchone()
        self.assertIsNotNone(alert)
        self.assertEqual(alert[0], self.shipment_vaccine)
        self.assertEqual(alert[1], "Critical")
        self.assertEqual(alert[2], 0) # resolved = False
        self.assertIn("CRITICAL ALERT", alert[3])
        self.assertIn("15.5 C", alert[4])

        # 2. Verify shipment updated automatically
        self.cursor.execute("SELECT current_status, requires_decision, current_temperature FROM shipments WHERE id = ?", (self.shipment_vaccine,))
        shipment = self.cursor.fetchone()
        self.assertEqual(shipment[0], "Critical Breach")
        self.assertEqual(shipment[1], 1) # requires_decision = True
        self.assertEqual(shipment[2], 15.5)

    def test_compressor_fault_automatically_creates_alert(self):
        # Insert compressor fault
        self.cursor.execute("""
        INSERT INTO telemetry_logs (id, shipment_id, recorded_at, temperature, humidity, ambient_temperature, compressor_status, battery, latitude, longitude, speed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), self.shipment_vaccine, "2026-08-19 03:00 UTC", 8.2, 50.0, 25.0, "Fault", 85.0, 42.2, -71.3, 50.0, "2026-08-19 03:00 UTC"))
        self.conn.commit()

        self.cursor.execute("SELECT alert_type, severity, resolved FROM alerts WHERE shipment_id = ?", (self.shipment_vaccine,))
        alert = self.cursor.fetchone()
        self.assertIsNotNone(alert)
        self.assertEqual(alert[0], "Compressor Failure")
        self.assertEqual(alert[1], "Critical")
        self.assertEqual(alert[2], 0)

if __name__ == "__main__":
    unittest.main()
