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
        }
        self._local_shipments: Dict[str, Shipment] = {}
        if SUPABASE_URL and SUPABASE_KEY:
            self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        else:
            self.client = None
            print("WARNING: Supabase URL and Key not found in environment.")

    def _map_to_shipment(self, data: dict) -> Shipment:
        # Map database fields to Shipment object
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
            current_temp=float(data.get("current_temperature") or 0.0),
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
            latest_recommendation=data.get("recommendation", ""),
            requires_decision=bool(data.get("requires_decision")),
            assigned_warehouse_id=data.get("warehouse_id"),
            temp_history=[],  # Could be populated via a separate join/query
            status_timeline=[],
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
            timestamp=data.get("created_at", ""),
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
        if not self.client:
            return self._local_shipments.get(shipment_id)
        res = self.client.table("shipments").select("*").eq("id", shipment_id).execute()
        if res.data:
            return self._map_to_shipment(res.data[0])
        return None

    def list_shipments(self) -> List[Shipment]:
        if not self.client:
            return list(self._local_shipments.values())
        res = self.client.table("shipments").select("*").order("created_at", desc=True).execute()
        return [self._map_to_shipment(d) for d in res.data]

    def save_shipment(self, shipment: Shipment) -> Shipment:
        if not self.client:
            self._local_shipments[shipment.id] = shipment
            return shipment
        data = self._map_from_shipment(shipment)
        res = self.client.table("shipments").upsert(data).execute()
        if res.data:
            return self._map_to_shipment(res.data[0])
        return shipment

    def delete_shipment(self, shipment_id: str) -> bool:
        if not self.client:
            if shipment_id in self._local_shipments:
                del self._local_shipments[shipment_id]
                return True
            return False
        res = self.client.table("shipments").delete().eq("id", shipment_id).execute()
        return len(res.data) > 0

    # Warehouse methods
    def get_warehouse(self, warehouse_id: str) -> Optional[Warehouse]:
        if not self.client: return None
        res = self.client.table("warehouses").select("*").eq("id", warehouse_id).execute()
        if res.data:
            return self._map_to_warehouse(res.data[0])
        return None

    def list_warehouses(self) -> List[Warehouse]:
        if not self.client: return []
        res = self.client.table("warehouses").select("*").order("created_at", desc=True).execute()
        return [self._map_to_warehouse(d) for d in res.data]

    def save_warehouse(self, warehouse: Warehouse) -> Warehouse:
        if not self.client: return warehouse
        data = self._map_from_warehouse(warehouse)
        res = self.client.table("warehouses").upsert(data).execute()
        if res.data:
            return self._map_to_warehouse(res.data[0])
        return warehouse

    def delete_warehouse(self, warehouse_id: str) -> bool:
        if not self.client: return False
        res = self.client.table("warehouses").delete().eq("id", warehouse_id).execute()
        return len(res.data) > 0

    # Alerts methods
    def list_alerts(self) -> List[Alert]:
        if not self.client: return []
        res = self.client.table("alerts").select("*").order("created_at", desc=True).execute()
        return [self._map_to_alert(d) for d in res.data]

    def save_alert(self, alert: Alert) -> Alert:
        if not self.client: return alert
        data = self._map_from_alert(alert)
        res = self.client.table("alerts").upsert(data).execute()
        if res.data:
            return self._map_to_alert(res.data[0])
        return alert

    # Analytics methods
    def get_dashboard_kpis(self) -> dict:
        if not self.client: return {}
        res = self.client.table("view_dashboard_kpis").select("*").execute()
        if res.data:
            return res.data[0]
        return {}

    def get_route_risk_analytics(self) -> List[dict]:
        if not self.client: return []
        res = self.client.table("view_route_risk_analytics").select("*").execute()
        return res.data

    def get_telemetry(self, shipment_id: str) -> List[dict]:
        if not self.client: return []
        res = self.client.table("telemetry_logs").select("*").eq("shipment_id", shipment_id).order("recorded_at", desc=False).execute()
        return res.data

    def get_predictions(self, shipment_id: str) -> List[dict]:
        if not self.client: return []
        res = self.client.table("ai_predictions").select("*").eq("shipment_id", shipment_id).order("predicted_at", desc=False).execute()
        return res.data

    def get_decision_history(self) -> List[dict]:
        if not self.client: return []
        res = self.client.table("decision_actions").select("*").order("executed_at", desc=True).execute()
        return res.data

    def save_decision_action(self, shipment_id: str, action: str, notes: str, assigned_warehouse_id: Optional[str] = None) -> dict:
        if not self.client: return {}
        data = {
            "shipment_id": shipment_id,
            "action_type": action,
            "notes": notes,
            "assigned_warehouse_id": assigned_warehouse_id
        }
        res = self.client.table("decision_actions").insert(data).execute()
        if res.data:
            return res.data[0]
        return {}

    def save_prediction(self, data: dict) -> dict:
        if not self.client: return {}
        res = self.client.table("ai_predictions").insert(data).execute()
        if res.data:
            return res.data[0]
        return {}

db_repository = SupabaseRepository()
