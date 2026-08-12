"""
In-Memory Storage Repositories for CryoFlow AI Backend.
Formatted cleanly so PostgreSQL / SQLAlchemy can replace this layer seamlessly.
"""
from typing import List, Optional, Dict
from datetime import datetime, timezone
import uuid
from backend.models import Shipment, Warehouse, Alert, User

class InMemoryRepository:
    def __init__(self):
        # Users
        self.users: Dict[str, User] = {
            "usr-1": User(
                id="usr-1",
                email="admin@cryoflow.ai",
                name="Dr. Elena Vance",
                role="Cold Operations Director",
                organization="Apex Life Sciences",
                hashed_password="ColdChain2026!"
            ),
            "usr-2": User(
                id="usr-2",
                email="warehouse@cryoflow.ai",
                name="Hans Mueller",
                role="Warehouse Logistics Manager",
                organization="Frankfurt Cold Hub & Logistics",
                hashed_password="ColdChain2026!"
            ),
            "usr-3": User(
                id="usr-3",
                email="manager@cryoflow.ai",
                name="Sarah Jenkins",
                role="Regional Cold Chain Manager",
                organization="Chicago Refrigerated Depot",
                hashed_password="ColdChain2026!"
            )
        }

        # Warehouses
        self.warehouses: Dict[str, Warehouse] = {
            "WH-101": Warehouse(
                id="WH-101",
                name="Frankfurt Cold Hub & Hub Logistics",
                location="Frankfurt Airport, Germany",
                total_capacity_pallets=5000,
                used_capacity_pallets=3850,
                min_temp_celsius=-85.0,
                max_temp_celsius=8.0,
                status="Active",
                manager="Hans Mueller"
            ),
            "WH-102": Warehouse(
                id="WH-102",
                name="Chicago Central Refrigerated Depot",
                location="Chicago IL, USA",
                total_capacity_pallets=8000,
                used_capacity_pallets=6200,
                min_temp_celsius=-25.0,
                max_temp_celsius=5.0,
                status="Active",
                manager="Sarah Jenkins"
            ),
            "WH-103": Warehouse(
                id="WH-103",
                name="Boston Biologics Distribution Center",
                location="Boston MA, USA",
                total_capacity_pallets=3500,
                used_capacity_pallets=3100,
                min_temp_celsius=-90.0,
                max_temp_celsius=4.0,
                status="Active",
                manager="David Miller"
            ),
            "WH-104": Warehouse(
                id="WH-104",
                name="London Heathrow Cold Freight Facility",
                location="London, United Kingdom",
                total_capacity_pallets=4000,
                used_capacity_pallets=1900,
                min_temp_celsius=-20.0,
                max_temp_celsius=10.0,
                status="Active",
                manager="Emma Watson"
            )
        }

        # Initial Hackathon Seed Shipments (Clean & Real Dynamics)
        self.shipments: Dict[str, Shipment] = {}
        self._init_seed_shipments()

        # Initial Alerts
        self.alerts: Dict[str, Alert] = {}
        self._init_seed_alerts()

    def _init_seed_shipments(self):
        s1 = Shipment(
            id="CRY-8842",
            product_category="Vaccines",
            product_name="mRNA COVID-19 Ultra-Cold Vaccines",
            quantity=12000,
            shipment_value=450000.0,
            origin="Frankfurt (FRA)",
            destination="Boston (BOS)",
            current_location="Mid-Atlantic Airspace (Flight LH-420)",
            current_temp=-78.4,
            humidity=42.0,
            transit_time_hours=14.5,
            estimated_arrival="2026-07-28 18:30 UTC",
            vehicle_number="LH-CARGO-777",
            current_status="In Transit",
            notes="Requires continuous LN2 dry-ice thermal profile.",
            spoilage_risk=1.2,
            health_score=99.4,
            remaining_shelf_life_days=18.5,
            estimated_financial_loss=0.0,
            estimated_carbon_impact_kg=12.5,
            latest_recommendation="Parameters optimal. Continue scheduled flight path to Boston Hub.",
            requires_decision=False,
            assigned_warehouse_id="WH-103",
            temp_history=[
                {"time": "00:00", "temp": -78.5, "min_limit": -85.0, "max_limit": -70.0},
                {"time": "04:00", "temp": -78.1, "min_limit": -85.0, "max_limit": -70.0},
                {"time": "08:00", "temp": -78.3, "min_limit": -85.0, "max_limit": -70.0},
                {"time": "12:00", "temp": -78.0, "min_limit": -85.0, "max_limit": -70.0},
                {"time": "14:30", "temp": -78.4, "min_limit": -85.0, "max_limit": -70.0}
            ],
            status_timeline=[
                {"timestamp": "2026-07-28 04:00 UTC", "status": "Manifest Created", "location": "Frankfurt Hub", "note": "Loaded & calibrated."},
                {"timestamp": "2026-07-28 08:30 UTC", "status": "In Transit", "location": "FRA Runway", "note": "Flight departed."},
                {"timestamp": "2026-07-28 14:30 UTC", "status": "In Transit", "location": "Mid-Atlantic", "note": "Telemetry nominal."}
            ]
        )

        s2 = Shipment(
            id="CRY-9104",
            product_category="Dairy",
            product_name="Organic Whole Milk & Artisan Cheese",
            quantity=8500,
            shipment_value=38500.0,
            origin="Madison, WI",
            destination="Chicago, IL",
            current_location="Rockford I-90 Transit Corridor",
            current_temp=7.4,  # Breach (> 4.0°C)
            humidity=78.0,
            transit_time_hours=6.2,
            estimated_arrival="2026-07-28 16:00 UTC",
            vehicle_number="TRK-MIDWEST-90",
            current_status="Warning",
            notes="Primary reefer unit compressor malfunction detected.",
            spoilage_risk=54.8,
            health_score=62.0,
            remaining_shelf_life_days=1.8,
            estimated_financial_loss=21100.0,
            estimated_carbon_impact_kg=145.0,
            latest_recommendation="Compressor warning: Re-route to Chicago Central Refrigerated Depot immediately.",
            requires_decision=True,
            assigned_warehouse_id="WH-102",
            temp_history=[
                {"time": "00:00", "temp": 2.8, "min_limit": 1.0, "max_limit": 4.0},
                {"time": "02:00", "temp": 3.1, "min_limit": 1.0, "max_limit": 4.0},
                {"time": "04:00", "temp": 5.2, "min_limit": 1.0, "max_limit": 4.0},
                {"time": "06:00", "temp": 7.4, "min_limit": 1.0, "max_limit": 4.0}
            ],
            status_timeline=[
                {"timestamp": "2026-07-28 00:00 UTC", "status": "In Transit", "location": "Madison Depot", "note": "Departed Madison."},
                {"timestamp": "2026-07-28 04:15 UTC", "status": "Warning", "location": "Rockford", "note": "Temperature rose above 4.0°C."}
            ]
        )

        s3 = Shipment(
            id="CRY-6301",
            product_category="Quick-Commerce Groceries",
            product_name="Fresh Farm Strawberries & Avocados",
            quantity=15000,
            shipment_value=62000.0,
            origin="Salinas, CA",
            destination="Denver, CO",
            current_location="Sacramento Logistics Corridor",
            current_temp=12.2,  # Severe Breach (> 3.5°C)
            humidity=89.0,
            transit_time_hours=18.0,
            estimated_arrival="2026-07-29 02:00 UTC",
            vehicle_number="TRK-PACIFIC-04",
            current_status="Critical Breach",
            notes="Cooling seal damaged after road shock event.",
            spoilage_risk=86.4,
            health_score=34.0,
            remaining_shelf_life_days=0.5,
            estimated_financial_loss=53500.0,
            estimated_carbon_impact_kg=320.0,
            latest_recommendation="CRITICAL: Re-route to secondary local marketplace or liquidate at Sacramento Hub.",
            requires_decision=True,
            assigned_warehouse_id=None,
            temp_history=[
                {"time": "00:00", "temp": 2.1, "min_limit": 0.5, "max_limit": 3.5},
                {"time": "06:00", "temp": 5.8, "min_limit": 0.5, "max_limit": 3.5},
                {"time": "12:00", "temp": 9.6, "min_limit": 0.5, "max_limit": 3.5},
                {"time": "18:00", "temp": 12.2, "min_limit": 0.5, "max_limit": 3.5}
            ],
            status_timeline=[
                {"timestamp": "2026-07-28 00:00 UTC", "status": "In Transit", "location": "Salinas Farm", "note": "Loaded fresh produce."},
                {"timestamp": "2026-07-28 12:00 UTC", "status": "Critical Breach", "location": "Sacramento", "note": "Door seal breach detected."}
            ]
        )

        s4 = Shipment(
            id="CRY-7719",
            product_category="Vaccines",
            product_name="Monoclonal Antibody Oncology Infusions",
            quantity=4200,
            shipment_value=280000.0,
            origin="Basel, Switzerland",
            destination="London, UK",
            current_location="Eurotunnel Freight Terminal",
            current_temp=4.1,
            humidity=52.0,
            transit_time_hours=10.0,
            estimated_arrival="2026-07-28 19:00 UTC",
            vehicle_number="SWISS-CARGO-88",
            current_status="In Transit",
            notes="Strict 2.0°C to 8.0°C cold envelope.",
            spoilage_risk=2.4,
            health_score=98.8,
            remaining_shelf_life_days=25.0,
            estimated_financial_loss=0.0,
            estimated_carbon_impact_kg=18.0,
            latest_recommendation="Temperature optimal. Proceed through Eurotunnel to London Heathrow Depot.",
            requires_decision=False,
            assigned_warehouse_id="WH-104",
            temp_history=[
                {"time": "00:00", "temp": 4.0, "min_limit": 2.0, "max_limit": 8.0},
                {"time": "05:00", "temp": 4.2, "min_limit": 2.0, "max_limit": 8.0},
                {"time": "10:00", "temp": 4.1, "min_limit": 2.0, "max_limit": 8.0}
            ],
            status_timeline=[
                {"timestamp": "2026-07-28 00:00 UTC", "status": "In Transit", "location": "Basel Hub", "note": "Dispatched from manufacturing."}
            ]
        )

        s5 = Shipment(
            id="CRY-5049",
            product_category="Vaccines",
            product_name="Insulin Pen Injectors & Peptides",
            quantity=9000,
            shipment_value=125000.0,
            origin="Indianapolis, IN",
            destination="Dallas, TX",
            current_location="Memphis Freight Hub",
            current_temp=4.9,
            humidity=48.0,
            transit_time_hours=12.0,
            estimated_arrival="2026-07-29 08:00 UTC",
            vehicle_number="FEDEX-REEFER-19",
            current_status="Delivered",
            notes="Delivered to Dallas Medical Depot with 100% compliance.",
            spoilage_risk=0.5,
            health_score=100.0,
            remaining_shelf_life_days=60.0,
            estimated_financial_loss=0.0,
            estimated_carbon_impact_kg=8.0,
            latest_recommendation="Delivery complete. Audit log sealed with 21 CFR Part 11 signature.",
            requires_decision=False,
            assigned_warehouse_id=None,
            temp_history=[
                {"time": "00:00", "temp": 5.0, "min_limit": 2.0, "max_limit": 8.0},
                {"time": "06:00", "temp": 4.8, "min_limit": 2.0, "max_limit": 8.0},
                {"time": "12:00", "temp": 4.9, "min_limit": 2.0, "max_limit": 8.0}
            ],
            status_timeline=[
                {"timestamp": "2026-07-27 12:00 UTC", "status": "In Transit", "location": "Indianapolis", "note": "Dispatched."},
                {"timestamp": "2026-07-28 08:00 UTC", "status": "Delivered", "location": "Dallas Depot", "note": "Customer signed receipt."}
            ]
        )

        self.shipments[s1.id] = s1
        self.shipments[s2.id] = s2
        self.shipments[s3.id] = s3
        self.shipments[s4.id] = s4
        self.shipments[s5.id] = s5

    def _init_seed_alerts(self):
        a1 = Alert(
            id="ALT-1001",
            shipment_id="CRY-6301",
            warehouse_id=None,
            alert_type="Temperature Alert",
            severity="Critical",
            title="CRITICAL TEMP BREACH: CRY-6301",
            message="Ambient temperature is 12.2°C exceeding 3.5°C threshold. Spoilage risk 86.4%.",
            timestamp="2026-07-28 12:00 UTC"
        )
        a2 = Alert(
            id="ALT-1002",
            shipment_id="CRY-9104",
            warehouse_id="WH-102",
            alert_type="Spoilage Alert",
            severity="High",
            title="SPOILAGE WARNING: CRY-9104",
            message="Reefer compressor warning. Temp 7.4°C. Action required in Decision Center.",
            timestamp="2026-07-28 04:15 UTC"
        )
        a3 = Alert(
            id="ALT-1003",
            shipment_id=None,
            warehouse_id="WH-103",
            alert_type="Warehouse Alert",
            severity="Medium",
            title="HIGH CAPACITY: Boston Hub",
            message="Boston Biologics Distribution Center reaches 88.5% pallet capacity utilization.",
            timestamp="2026-07-28 08:00 UTC"
        )
        self.alerts[a1.id] = a1
        self.alerts[a2.id] = a2
        self.alerts[a3.id] = a3

    # Repo methods
    def get_shipment(self, shipment_id: str) -> Optional[Shipment]:
        return self.shipments.get(shipment_id)

    def list_shipments(self) -> List[Shipment]:
        return list(self.shipments.values())

    def save_shipment(self, shipment: Shipment) -> Shipment:
        self.shipments[shipment.id] = shipment
        return shipment

    def delete_shipment(self, shipment_id: str) -> bool:
        if shipment_id in self.shipments:
            del self.shipments[shipment_id]
            return True
        return False

    def get_warehouse(self, warehouse_id: str) -> Optional[Warehouse]:
        return self.warehouses.get(warehouse_id)

    def list_warehouses(self) -> List[Warehouse]:
        return list(self.warehouses.values())

    def save_warehouse(self, warehouse: Warehouse) -> Warehouse:
        self.warehouses[warehouse.id] = warehouse
        return warehouse

    def delete_warehouse(self, warehouse_id: str) -> bool:
        if warehouse_id in self.warehouses:
            del self.warehouses[warehouse_id]
            return True
        return False

    def list_alerts(self) -> List[Alert]:
        return list(self.alerts.values())

    def save_alert(self, alert: Alert) -> Alert:
        self.alerts[alert.id] = alert
        return alert

# Global singleton repository instance
db_repository = InMemoryRepository()
