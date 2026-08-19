"""
Supabase PostgreSQL Storage Repositories for CryoFlow AI Backend.
"""
import os
from typing import List, Optional, Dict
from datetime import datetime, timezone
import uuid
import logging

from supabase import create_client, Client
from backend.models import Shipment, Warehouse, Alert, User

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_KEY", ""))

logger = logging.getLogger(__name__)

class SupabaseRepository:
    def __init__(self):
        # We mock users as requested in hackathon/dev phase
        self.users: Dict[str, User] = {
            "demo@cryoflow.ai": User(
                id=str(uuid.uuid4()),
                email="demo@cryoflow.ai",
                name="Dr. Elena Vance",
                role="admin",
                organization="Apex Life Sciences",
                hashed_password="ColdChain2026!"
            ),
            "usr-1": User(
                id="usr-1",
                email="admin@cryoflow.ai",
                name="Dr. Elena Vance",
                role="Director of Cold Chain Logistics",
                organization="Apex Life Sciences",
                hashed_password="ColdChain2026!"
            )
        }
        self._local_shipments: Dict[str, Shipment] = {}
        self._local_warehouses: Dict[str, Warehouse] = {}
        self._local_alerts: Dict[str, Alert] = {}

        if SUPABASE_URL and SUPABASE_KEY:
            try:
                self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            except Exception as e:
                logger.warning(f"Could not connect to Supabase: {e}")
                self.client = None
        else:
            self.client = None
            print("INFO: Operating with local in-memory telemetry repository.")

        self._seed_default_data()

    def _seed_default_data(self):
        warehouses_data = [
            Warehouse(id="wh-delhi", code="DEL-HUB-01", name="Delhi Air Cargo Cold Hub", location="Delhi", total_capacity_pallets=500, used_capacity_pallets=320, min_temp_celsius=-80.0, max_temp_celsius=10.0, status="Active", manager="Rajesh Kumar"),
            Warehouse(id="wh-mumbai", code="BOM-HUB-02", name="Mumbai JNPT Cold Logistics", location="Mumbai", total_capacity_pallets=800, used_capacity_pallets=650, min_temp_celsius=1.0, max_temp_celsius=8.0, status="Active", manager="Priya Sharma"),
            Warehouse(id="wh-bangalore", code="BLR-HUB-03", name="Bangalore Biologics Hub", location="Bangalore", total_capacity_pallets=400, used_capacity_pallets=210, min_temp_celsius=-85.0, max_temp_celsius=4.0, status="Active", manager="Dr. Aris Thorne"),
            Warehouse(id="wh-chennai", code="MAA-HUB-04", name="Chennai Port Freezer Terminal", location="Chennai", total_capacity_pallets=600, used_capacity_pallets=480, min_temp_celsius=-25.0, max_temp_celsius=10.0, status="Active", manager="K. Raman"),
            Warehouse(id="wh-pune", code="PNQ-HUB-05", name="Pune Agro-Cold Facility", location="Pune", total_capacity_pallets=350, used_capacity_pallets=190, min_temp_celsius=0.0, max_temp_celsius=12.0, status="Active", manager="Amit Varma"),
        ]
        for w in warehouses_data:
            self._local_warehouses[w.id] = w

        shipments_data = [
            Shipment(
                id="CRY-8842", tracking_number="DL-COLD-8842", product_category="Vaccines",
                product_name="mRNA COVID-19 Ultra-Cold Vaccines", quantity=25000, shipment_value=1250000.0,
                origin="Delhi", destination="Mumbai", current_location="Ahmedabad",
                current_temp=-78.2, humidity=42.0, transit_time_hours=14.5, estimated_arrival="2026-08-20 06:00 UTC",
                vehicle_number="DL-01-AX-9942", current_status="In Transit", notes="Dry-ice active refrigeration operational.",
                spoilage_risk=1.2, health_score=99.4, remaining_shelf_life_days=28.5,
                estimated_financial_loss=0.0, estimated_carbon_impact_kg=45.2,
                latest_recommendation="Parameters nominal. Maintain current active ultra-cold envelope.",
                requires_decision=False, assigned_warehouse_id="wh-mumbai",
                temp_history=[
                    {"time": "00:00", "temp": -78.5, "min_limit": -85, "max_limit": -70},
                    {"time": "04:00", "temp": -78.1, "min_limit": -85, "max_limit": -70},
                    {"time": "08:00", "temp": -78.3, "min_limit": -85, "max_limit": -70},
                    {"time": "12:00", "temp": -78.2, "min_limit": -85, "max_limit": -70}
                ],
                status_timeline=[
                    {"timestamp": "2026-08-19 04:00 UTC", "status": "In Transit", "location": "Ahmedabad", "note": "Passing Gujarat checkpoint."},
                    {"timestamp": "2026-08-19 00:00 UTC", "status": "Dispatched", "location": "Delhi Air Cargo", "note": "Manifest loaded."}
                ]
            ),
            Shipment(
                id="CRY-9104", tracking_number="MH-REEFER-9104", product_category="Dairy",
                product_name="Organic Pasteurized Whole Milk & Butter", quantity=12000, shipment_value=45000.0,
                origin="Pune", destination="Chennai", current_location="Bengaluru",
                current_temp=7.4, humidity=78.0, transit_time_hours=12.0, estimated_arrival="2026-08-20 02:00 UTC",
                vehicle_number="MH-12-PQ-4410", current_status="Warning", notes="Compressor efficiency anomaly detected near Bengaluru.",
                spoilage_risk=42.8, health_score=71.5, remaining_shelf_life_days=8.2,
                estimated_financial_loss=19260.0, estimated_carbon_impact_kg=12.4,
                latest_recommendation="Compressor warning detected. Reroute to Bangalore Biologics Hub within 45 mins.",
                requires_decision=True, assigned_warehouse_id="wh-bangalore",
                temp_history=[
                    {"time": "00:00", "temp": 2.8, "min_limit": 1, "max_limit": 4},
                    {"time": "04:00", "temp": 4.5, "min_limit": 1, "max_limit": 4},
                    {"time": "08:00", "temp": 6.2, "min_limit": 1, "max_limit": 4},
                    {"time": "12:00", "temp": 7.4, "min_limit": 1, "max_limit": 4}
                ],
                status_timeline=[
                    {"timestamp": "2026-08-19 12:00 UTC", "status": "Warning", "location": "Bengaluru", "note": "Temp excursion breach detected."}
                ]
            ),
            Shipment(
                id="CRY-7719", tracking_number="TS-EXPRESS-7719", product_category="Vaccines",
                product_name="Pediatric Polio & MMR Vaccines", quantity=15000, shipment_value=320000.0,
                origin="Hyderabad", destination="Bangalore", current_location="Anantapur",
                current_temp=4.1, humidity=55.0, transit_time_hours=5.5, estimated_arrival="2026-08-20 00:30 UTC",
                vehicle_number="TS-09-CB-1120", current_status="In Transit", notes="Express highway transit on schedule.",
                spoilage_risk=3.5, health_score=97.8, remaining_shelf_life_days=85.0,
                estimated_financial_loss=0.0, estimated_carbon_impact_kg=18.5,
                latest_recommendation="Thermal trajectory optimal. Clearance expected at Bangalore Cold Hub.",
                requires_decision=False, assigned_warehouse_id="wh-bangalore",
                temp_history=[
                    {"time": "00:00", "temp": 4.0, "min_limit": 2, "max_limit": 8},
                    {"time": "02:00", "temp": 4.2, "min_limit": 2, "max_limit": 8},
                    {"time": "04:00", "temp": 4.1, "min_limit": 2, "max_limit": 8}
                ],
                status_timeline=[
                    {"timestamp": "2026-08-19 06:00 UTC", "status": "In Transit", "location": "Anantapur", "note": "Checkpoint scanned."}
                ]
            ),
            Shipment(
                id="CRY-6301", tracking_number="WB-COLD-6301", product_category="Quick-Commerce Groceries",
                product_name="Premium Hydroponic Berries & Greens", quantity=4500, shipment_value=28000.0,
                origin="Kolkata", destination="Delhi", current_location="Patna",
                current_temp=11.2, humidity=89.0, transit_time_hours=16.0, estimated_arrival="2026-08-20 14:00 UTC",
                vehicle_number="WB-04-ER-8812", current_status="Critical Breach", notes="Door seal breach + ambient heat soak.",
                spoilage_risk=84.6, health_score=38.0, remaining_shelf_life_days=1.5,
                estimated_financial_loss=23688.0, estimated_carbon_impact_kg=8.1,
                latest_recommendation="CRITICAL BREACH: Ambient temp +11.2°C exceeds 3.5°C threshold. Reroute to nearest cold facility or liquidate locally.",
                requires_decision=True, assigned_warehouse_id="wh-delhi",
                temp_history=[
                    {"time": "00:00", "temp": 2.1, "min_limit": 0.5, "max_limit": 3.5},
                    {"time": "04:00", "temp": 6.9, "min_limit": 0.5, "max_limit": 3.5},
                    {"time": "08:00", "temp": 9.4, "min_limit": 0.5, "max_limit": 3.5},
                    {"time": "12:00", "temp": 11.2, "min_limit": 0.5, "max_limit": 3.5}
                ],
                status_timeline=[
                    {"timestamp": "2026-08-19 14:00 UTC", "status": "Critical Breach", "location": "Patna", "note": "High temp breach alert."}
                ]
            ),
            Shipment(
                id="CRY-5049", tracking_number="PB-REEFER-5049", product_category="Vaccines",
                product_name="Influenza Quadrivalent Vaccines", quantity=20000, shipment_value=240000.0,
                origin="Chandigarh", destination="Delhi", current_location="Ambala",
                current_temp=4.8, humidity=48.0, transit_time_hours=2.5, estimated_arrival="2026-08-19 23:00 UTC",
                vehicle_number="PB-65-AX-3301", current_status="In Transit", notes="Routine morning dispatch.",
                spoilage_risk=2.1, health_score=98.9, remaining_shelf_life_days=115.0,
                estimated_financial_loss=0.0, estimated_carbon_impact_kg=6.2,
                latest_recommendation="Parameters compliant. Next automated check in 15 minutes.",
                requires_decision=False, assigned_warehouse_id="wh-delhi",
                temp_history=[
                    {"time": "00:00", "temp": 4.5, "min_limit": 2, "max_limit": 8},
                    {"time": "02:00", "temp": 4.8, "min_limit": 2, "max_limit": 8}
                ]
            ),
            Shipment(
                id="CRY-4190", tracking_number="GJ-EXPRESS-4190", product_category="Dairy",
                product_name="Artisanal Cultured Yogurt & Cream", quantity=8000, shipment_value=38000.0,
                origin="Ahmedabad", destination="Mumbai", current_location="Surat",
                current_temp=3.1, humidity=65.0, transit_time_hours=6.0, estimated_arrival="2026-08-20 01:00 UTC",
                vehicle_number="GJ-01-KC-7720", current_status="In Transit", notes="Dual-zone refrigeration steady.",
                spoilage_risk=4.2, health_score=96.5, remaining_shelf_life_days=18.0,
                estimated_financial_loss=0.0, estimated_carbon_impact_kg=9.4,
                latest_recommendation="Refrigeration operating at nominal capacity.",
                requires_decision=False, assigned_warehouse_id="wh-mumbai",
                temp_history=[
                    {"time": "00:00", "temp": 3.0, "min_limit": 1, "max_limit": 4.5},
                    {"time": "04:00", "temp": 3.1, "min_limit": 1, "max_limit": 4.5}
                ]
            ),
            Shipment(
                id="CRY-3320", tracking_number="KL-COLD-3320", product_category="Quick-Commerce Groceries",
                product_name="Pre-cut Organic Exotic Fruits", quantity=3000, shipment_value=15000.0,
                origin="Kochi", destination="Chennai", current_location="Chennai",
                current_temp=2.8, humidity=70.0, transit_time_hours=14.0, estimated_arrival="Delivered",
                vehicle_number="KL-07-BW-1002", current_status="Delivered", notes="Successfully unloaded at Chennai Port Terminal.",
                spoilage_risk=0.8, health_score=99.8, remaining_shelf_life_days=5.5,
                estimated_financial_loss=0.0, estimated_carbon_impact_kg=14.1,
                latest_recommendation="Shipment completed with zero thermal degradation.",
                requires_decision=False, assigned_warehouse_id="wh-chennai",
                temp_history=[
                    {"time": "00:00", "temp": 2.5, "min_limit": 1, "max_limit": 4},
                    {"time": "08:00", "temp": 2.7, "min_limit": 1, "max_limit": 4},
                    {"time": "14:00", "temp": 2.8, "min_limit": 1, "max_limit": 4}
                ]
            ),
            Shipment(
                id="CRY-2105", tracking_number="RJ-COLD-2105", product_category="Vaccines",
                product_name="Pediatric Polio & MMR Vaccines", quantity=18000, shipment_value=410000.0,
                origin="Jaipur", destination="Lucknow", current_location="Agra",
                current_temp=4.4, humidity=50.0, transit_time_hours=7.0, estimated_arrival="2026-08-20 04:00 UTC",
                vehicle_number="RJ-14-GH-9011", current_status="In Transit", notes="On schedule via Agra Expressway.",
                spoilage_risk=2.5, health_score=98.2, remaining_shelf_life_days=88.0,
                estimated_financial_loss=0.0, estimated_carbon_impact_kg=11.3,
                latest_recommendation="Parameters nominal.",
                requires_decision=False, assigned_warehouse_id="wh-delhi",
                temp_history=[
                    {"time": "00:00", "temp": 4.2, "min_limit": 2, "max_limit": 8},
                    {"time": "04:00", "temp": 4.4, "min_limit": 2, "max_limit": 8}
                ]
            )
        ]
        for s in shipments_data:
            self._local_shipments[s.id] = s

        alerts_data = [
            Alert(
                id="alt-101", shipment_id="CRY-6301", warehouse_id=None, alert_type="Temperature Alert",
                severity="Critical", title="Critical Temp Breach on CRY-6301",
                message="Ambient temp reached +11.2°C exceeding max threshold +3.5°C for Hydroponic Berries.",
                timestamp="2026-08-19 20:15 UTC", resolved=False
            ),
            Alert(
                id="alt-102", shipment_id="CRY-9104", warehouse_id=None, alert_type="Risk Alert",
                severity="Warning", title="Compressor Degradation Warning on CRY-9104",
                message="Compressor efficiency dropped to 62%. Temp rising towards +7.4°C.",
                timestamp="2026-08-19 19:40 UTC", resolved=False
            ),
            Alert(
                id="alt-103", shipment_id=None, warehouse_id="wh-mumbai", alert_type="Warehouse Alert",
                severity="Medium", title="High Storage Capacity Warning",
                message="Mumbai JNPT Cold Logistics reached 81% pallet capacity utilization.",
                timestamp="2026-08-19 18:30 UTC", resolved=False
            )
        ]
        for a in alerts_data:
            self._local_alerts[a.id] = a

    def _map_to_shipment(self, data: dict) -> Shipment:
        return Shipment(
            id=str(data.get("id")),
            tracking_number=data.get("tracking_number", ""),
            product_category=data.get("product_category", ""),
            product_name=data.get("product_name", ""),
            quantity=data.get("quantity", 0),
            shipment_value=float(data.get("shipment_value") or 0.0),
            origin=data.get("origin", ""),
            destination=data.get("destination", ""),
            current_location=data.get("current_location", ""),
            current_temp=float(data.get("current_temperature") or data.get("current_temp") or 0.0),
            humidity=float(data.get("humidity") or 0.0),
            transit_time_hours=float(data.get("transit_time_hours") or 0.0),
            estimated_arrival=str(data.get("estimated_arrival") or ""),
            vehicle_number=data.get("vehicle_number", ""),
            current_status=data.get("current_status", ""),
            notes=data.get("notes", ""),
            spoilage_risk=float(data.get("spoilage_risk") or 0.0),
            health_score=float(data.get("health_score") or 0.0),
            remaining_shelf_life_days=float(data.get("remaining_shelf_life_days") or 0.0),
            estimated_financial_loss=float(data.get("estimated_financial_loss") or 0.0),
            estimated_carbon_impact_kg=float(data.get("estimated_carbon_impact_kg") or 0.0),
            latest_recommendation=data.get("recommendation", "") or data.get("latest_recommendation", ""),
            requires_decision=bool(data.get("requires_decision")),
            assigned_warehouse_id=data.get("warehouse_id") or data.get("assigned_warehouse_id"),
            temp_history=data.get("temp_history") or [],
            status_timeline=data.get("status_timeline") or [],
            created_at=data.get("created_at")
        )

    def _map_from_shipment(self, s: Shipment) -> dict:
        return {
            "id": s.id,
            "tracking_number": s.tracking_number,
            "product_category": s.product_category,
            "product_name": s.product_name,
            "quantity": s.quantity,
            "shipment_value": s.shipment_value,
            "origin": s.origin,
            "destination": s.destination,
            "current_location": s.current_location,
            "current_temperature": s.current_temp,
            "humidity": s.humidity,
            "transit_time_hours": s.transit_time_hours,
            "estimated_arrival": s.estimated_arrival,
            "vehicle_number": s.vehicle_number,
            "current_status": s.current_status,
            "notes": s.notes,
            "spoilage_risk": s.spoilage_risk,
            "health_score": s.health_score,
            "remaining_shelf_life_days": s.remaining_shelf_life_days,
            "estimated_financial_loss": s.estimated_financial_loss,
            "estimated_carbon_impact_kg": s.estimated_carbon_impact_kg,
            "recommendation": s.latest_recommendation,
            "requires_decision": s.requires_decision,
            "warehouse_id": s.assigned_warehouse_id
        }

    def _map_to_warehouse(self, data: dict) -> Warehouse:
        return Warehouse(
            id=str(data.get("id")),
            code=data.get("code", ""),
            name=data.get("name", ""),
            location=data.get("location", ""),
            total_capacity_pallets=data.get("total_capacity_pallets", 0),
            used_capacity_pallets=data.get("used_capacity_pallets", 0),
            min_temp_celsius=float(data.get("min_temp_celsius") or 0.0),
            max_temp_celsius=float(data.get("max_temp_celsius") or 0.0),
            status=data.get("status", ""),
            manager=data.get("manager", ""),
            created_at=data.get("created_at")
        )

    def _map_from_warehouse(self, w: Warehouse) -> dict:
        return {
            "id": w.id,
            "code": w.code,
            "name": w.name,
            "location": w.location,
            "total_capacity_pallets": w.total_capacity_pallets,
            "used_capacity_pallets": w.used_capacity_pallets,
            "min_temp_celsius": w.min_temp_celsius,
            "max_temp_celsius": w.max_temp_celsius,
            "status": w.status,
            "manager": w.manager
        }

    def _map_to_alert(self, data: dict) -> Alert:
        return Alert(
            id=str(data.get("id")),
            shipment_id=str(data.get("shipment_id")) if data.get("shipment_id") else None,
            warehouse_id=str(data.get("warehouse_id")) if data.get("warehouse_id") else None,
            alert_type=data.get("alert_type", ""),
            severity=data.get("severity", ""),
            title=data.get("title", ""),
            message=data.get("message", ""),
            timestamp=data.get("created_at", "") or data.get("timestamp", ""),
            resolved=bool(data.get("resolved"))
        )

    def _map_from_alert(self, a: Alert) -> dict:
        return {
            "id": a.id,
            "shipment_id": a.shipment_id,
            "warehouse_id": a.warehouse_id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "resolved": a.resolved
        }

    # Shipment methods
    def get_shipment(self, shipment_id: str) -> Optional[Shipment]:
        if self.client:
            try:
                res = self.client.table("shipments").select("*").eq("id", shipment_id).execute()
                if res.data:
                    return self._map_to_shipment(res.data[0])
            except Exception as e:
                logger.warning(f"Supabase get_shipment failed: {e}")
        return self._local_shipments.get(shipment_id)

    def list_shipments(self) -> List[Shipment]:
        if self.client:
            try:
                res = self.client.table("shipments").select("*").order("created_at", desc=True).execute()
                if res.data and len(res.data) > 0:
                    return [self._map_to_shipment(d) for d in res.data]
            except Exception as e:
                logger.warning(f"Supabase list_shipments failed: {e}")
        return list(self._local_shipments.values())

    def save_shipment(self, shipment: Shipment) -> Shipment:
        self._local_shipments[shipment.id] = shipment
        if self.client:
            try:
                data = self._map_from_shipment(shipment)
                res = self.client.table("shipments").upsert(data).execute()
                if res.data:
                    return self._map_to_shipment(res.data[0])
            except Exception as e:
                logger.warning(f"Supabase save_shipment failed: {e}")
        return shipment

    def delete_shipment(self, shipment_id: str) -> bool:
        if shipment_id in self._local_shipments:
            del self._local_shipments[shipment_id]
        if self.client:
            try:
                res = self.client.table("shipments").delete().eq("id", shipment_id).execute()
                return len(res.data) > 0
            except Exception as e:
                logger.warning(f"Supabase delete_shipment failed: {e}")
        return True

    # Warehouse methods
    def get_warehouse(self, warehouse_id: str) -> Optional[Warehouse]:
        if self.client:
            try:
                res = self.client.table("warehouses").select("*").eq("id", warehouse_id).execute()
                if res.data:
                    return self._map_to_warehouse(res.data[0])
            except Exception as e:
                logger.warning(f"Supabase get_warehouse failed: {e}")
        return self._local_warehouses.get(warehouse_id)

    def list_warehouses(self) -> List[Warehouse]:
        if self.client:
            try:
                res = self.client.table("warehouses").select("*").order("created_at", desc=True).execute()
                if res.data and len(res.data) > 0:
                    return [self._map_to_warehouse(d) for d in res.data]
            except Exception as e:
                logger.warning(f"Supabase list_warehouses failed: {e}")
        return list(self._local_warehouses.values())

    def save_warehouse(self, warehouse: Warehouse) -> Warehouse:
        self._local_warehouses[warehouse.id] = warehouse
        if self.client:
            try:
                data = self._map_from_warehouse(warehouse)
                res = self.client.table("warehouses").upsert(data).execute()
                if res.data:
                    return self._map_to_warehouse(res.data[0])
            except Exception as e:
                logger.warning(f"Supabase save_warehouse failed: {e}")
        return warehouse

    def delete_warehouse(self, warehouse_id: str) -> bool:
        if warehouse_id in self._local_warehouses:
            del self._local_warehouses[warehouse_id]
        if self.client:
            try:
                res = self.client.table("warehouses").delete().eq("id", warehouse_id).execute()
                return len(res.data) > 0
            except Exception as e:
                logger.warning(f"Supabase delete_warehouse failed: {e}")
        return True

    # Alerts methods
    def list_alerts(self) -> List[Alert]:
        if self.client:
            try:
                res = self.client.table("alerts").select("*").order("created_at", desc=True).execute()
                if res.data and len(res.data) > 0:
                    return [self._map_to_alert(d) for d in res.data]
            except Exception as e:
                logger.warning(f"Supabase list_alerts failed: {e}")
        return list(self._local_alerts.values())

    def save_alert(self, alert: Alert) -> Alert:
        self._local_alerts[alert.id] = alert
        if self.client:
            try:
                data = self._map_from_alert(alert)
                res = self.client.table("alerts").upsert(data).execute()
                if res.data:
                    return self._map_to_alert(res.data[0])
            except Exception as e:
                logger.warning(f"Supabase save_alert failed: {e}")
        return alert

    # Analytics methods
    def get_dashboard_kpis(self) -> dict:
        if self.client:
            try:
                res = self.client.table("view_dashboard_kpis").select("*").execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase get_dashboard_kpis failed: {e}")
        return {}

    def get_route_risk_analytics(self) -> List[dict]:
        if self.client:
            try:
                res = self.client.table("view_route_risk_analytics").select("*").execute()
                return res.data
            except Exception as e:
                logger.warning(f"Supabase get_route_risk_analytics failed: {e}")
        return []

    def get_telemetry(self, shipment_id: str) -> List[dict]:
        if self.client:
            try:
                res = self.client.table("telemetry_logs").select("*").eq("shipment_id", shipment_id).order("recorded_at", desc=False).execute()
                return res.data
            except Exception as e:
                logger.warning(f"Supabase get_telemetry failed: {e}")
        return []

    def get_predictions(self, shipment_id: str) -> List[dict]:
        if self.client:
            try:
                res = self.client.table("ai_predictions").select("*").eq("shipment_id", shipment_id).order("predicted_at", desc=False).execute()
                return res.data
            except Exception as e:
                logger.warning(f"Supabase get_predictions failed: {e}")
        return []

    def get_decision_history(self) -> List[dict]:
        if self.client:
            try:
                res = self.client.table("decision_actions").select("*").order("executed_at", desc=True).execute()
                return res.data
            except Exception as e:
                logger.warning(f"Supabase get_decision_history failed: {e}")
        return []

    def save_decision_action(self, shipment_id: str, action: str, notes: str, assigned_warehouse_id: Optional[str] = None) -> dict:
        data = {
            "id": str(uuid.uuid4()),
            "shipment_id": shipment_id,
            "action_type": action,
            "notes": notes,
            "assigned_warehouse_id": assigned_warehouse_id,
            "executed_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        }
        if self.client:
            try:
                res = self.client.table("decision_actions").insert(data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase save_decision_action failed: {e}")
        return data

    def save_prediction(self, data: dict) -> dict:
        if self.client:
            try:
                res = self.client.table("ai_predictions").insert(data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase save_prediction failed: {e}")
        return data

db_repository = SupabaseRepository()
