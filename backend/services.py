"""
Business Services Layer for CryoFlow AI.
Contains all calculation logic, prediction engine, decision center execution, and KPI aggregations.
No business data is modified by the frontend — the backend is the source of truth.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from backend.models import Shipment, Warehouse, Alert, User
from backend.repositories import db_repository
from backend.schemas import (
    ShipmentCreateRequest, ShipmentUpdateRequest,
    WarehouseCreateRequest, WarehouseUpdateRequest,
    ProfileUpdateRequest, ChangePasswordRequest
)
try:
    from backend.risk_engine import DeterministicKineticRiskEngine, risk_service
except ImportError:
    from risk_engine import DeterministicKineticRiskEngine, risk_service

class ShipmentService:
    @staticmethod
    def calculate_health_and_risk(category: str, temp: float, hours: float, value: float):
        """
        Deterministic thermodynamic & kinetic degradation model calculation.
        Evaluates spoilage risk %, health score, shelf life decay, financial loss,
        and carbon footprint impact.
        """
        engine = DeterministicKineticRiskEngine()
        result = engine.evaluate(
            product_category=category,
            product_name="Cargo",
            current_temp=temp,
            transit_time_hours=hours,
            shipment_value=value
        )
        envelope = engine.get_product_envelope(category, temp)

        return {
            "spoilage_risk": result.spoilage_risk_percent,
            "health_score": result.health_score,
            "remaining_shelf_life_days": result.remaining_shelf_life_days,
            "financial_loss": result.estimated_financial_loss_usd,
            "carbon_impact_kg": result.estimated_carbon_impact_kg,
            "requires_decision": result.requires_decision,
            "recommendation": result.ai_recommendation,
            "min_limit": envelope["min_temp"],
            "max_limit": envelope["max_temp"]
        }

    @classmethod
    def create_shipment(cls, data: ShipmentCreateRequest) -> Shipment:
        tracking_num = f"CRY-{uuid.uuid4().hex[:4].upper()}"
        shipment_id = str(uuid.uuid4())
        metrics = cls.calculate_health_and_risk(
            data.product_category, data.current_temp, data.transit_time_hours, data.shipment_value
        )

        status = data.current_status or "In Transit"
        if metrics["spoilage_risk"] > 60.0 and status != "Delivered":
            status = "Critical Breach"
        elif metrics["spoilage_risk"] > 25.0 and status != "Delivered":
            status = "Warning"

        timestamp_now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        shipment = Shipment(
            id=shipment_id,
            tracking_number=tracking_num,
            product_category=data.product_category,
            product_name=data.product_name,
            quantity=data.quantity,
            shipment_value=data.shipment_value,
            origin=data.origin,
            destination=data.destination,
            current_location=data.current_location,
            current_temp=data.current_temp,
            humidity=data.humidity,
            transit_time_hours=data.transit_time_hours,
            estimated_arrival=data.estimated_arrival,
            vehicle_number=data.vehicle_number,
            current_status=status,
            notes=data.notes or "",
            spoilage_risk=metrics["spoilage_risk"],
            health_score=metrics["health_score"],
            remaining_shelf_life_days=metrics["remaining_shelf_life_days"],
            estimated_financial_loss=metrics["financial_loss"],
            estimated_carbon_impact_kg=metrics["carbon_impact_kg"],
            latest_recommendation=metrics["recommendation"],
            requires_decision=metrics["requires_decision"],
            temp_history=[
                {"time": "00:00", "temp": round(data.current_temp - 0.5, 1), "min_limit": metrics["min_limit"], "max_limit": metrics["max_limit"]},
                {"time": "04:00", "temp": data.current_temp, "min_limit": metrics["min_limit"], "max_limit": metrics["max_limit"]}
            ],
            status_timeline=[
                {"timestamp": timestamp_now, "status": "Manifest Created", "location": data.origin, "note": "Shipment initialized in system."}
            ]
        )

        db_repository.save_shipment(shipment)

        # Trigger automatic backend alert if risk is elevated
        if metrics["requires_decision"]:
            alert = Alert(
                id=str(uuid.uuid4()),
                shipment_id=shipment_id,
                warehouse_id=None,
                alert_type="Temperature Alert" if metrics["spoilage_risk"] > 50 else "Spoilage Alert",
                severity="Critical" if metrics["spoilage_risk"] > 60 else "High",
                title=f"AUTOMATED RISK ALERT: {shipment_id}",
                message=f"{data.product_name} current temp is {data.current_temp}°C. Risk: {metrics['spoilage_risk']}%. Action required.",
                timestamp=timestamp_now
            )
            db_repository.save_alert(alert)

        return shipment

    @classmethod
    def update_shipment(cls, shipment_id: str, data: ShipmentUpdateRequest) -> Optional[Shipment]:
        shipment = db_repository.get_shipment(shipment_id)
        if not shipment:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                setattr(shipment, key, value)

        # Recalculate metrics based on updated temp / category / value
        metrics = cls.calculate_health_and_risk(
            shipment.product_category, shipment.current_temp, shipment.transit_time_hours, shipment.shipment_value
        )
        shipment.spoilage_risk = metrics["spoilage_risk"]
        shipment.health_score = metrics["health_score"]
        shipment.remaining_shelf_life_days = metrics["remaining_shelf_life_days"]
        shipment.estimated_financial_loss = metrics["financial_loss"]
        shipment.estimated_carbon_impact_kg = metrics["carbon_impact_kg"]
        shipment.latest_recommendation = metrics["recommendation"]
        shipment.requires_decision = metrics["requires_decision"]

        # Append timeline event
        timestamp_now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        shipment.status_timeline.append({
            "timestamp": timestamp_now,
            "status": shipment.current_status,
            "location": shipment.current_location,
            "note": "Shipment parameters updated by operational dispatcher."
        })

        return db_repository.save_shipment(shipment)

class PredictionService:
    @staticmethod
    def run_prediction(shipment_id: str) -> Dict[str, Any]:
        shipment = db_repository.get_shipment(shipment_id)
        if not shipment:
            return None

        metrics = ShipmentService.calculate_health_and_risk(
            shipment.product_category, shipment.current_temp, shipment.transit_time_hours, shipment.shipment_value
        )

        confidence_score = round(94.5 + (100.0 - metrics["spoilage_risk"]) * 0.05, 1)

        # Update shipment properties
        shipment.spoilage_risk = metrics["spoilage_risk"]
        shipment.health_score = metrics["health_score"]
        shipment.remaining_shelf_life_days = metrics["remaining_shelf_life_days"]
        shipment.estimated_financial_loss = metrics["financial_loss"]
        shipment.estimated_carbon_impact_kg = metrics["carbon_impact_kg"]
        shipment.latest_recommendation = metrics["recommendation"]
        
        # Save updated shipment
        db_repository.save_shipment(shipment)

        prediction_data = {
            "shipment_id": shipment.id,
            "current_temp": shipment.current_temp,
            "spoilage_risk_percent": metrics["spoilage_risk"],
            "remaining_shelf_life_days": metrics["remaining_shelf_life_days"],
            "health_score": metrics["health_score"],
            "estimated_financial_loss_usd": metrics["financial_loss"],
            "estimated_carbon_impact_kg": metrics["carbon_impact_kg"],
            "confidence_score_percent": confidence_score,
            "ai_recommendation": metrics["recommendation"]
        }
        
        # Save to ai_predictions table
        db_repository.save_prediction(prediction_data)

        # Build response
        prediction_data["product_name"] = shipment.product_name
        prediction_data["product_category"] = shipment.product_category
        return prediction_data

class DecisionService:
    @staticmethod
    def get_shipments_requiring_action() -> List[Shipment]:
        return [s for s in db_repository.list_shipments() if s.requires_decision or s.spoilage_risk > 20.0 or s.current_status in ["Warning", "Critical Breach"]]

    @staticmethod
    def get_executed_decision_history() -> List[Shipment]:
        history_actions = db_repository.get_decision_history()
        # Find unique shipment IDs that have executed actions
        shipment_ids = list(set([h["shipment_id"] for h in history_actions if "shipment_id" in h]))
        
        history_shipments = []
        for sid in shipment_ids:
            shipment = db_repository.get_shipment(sid)
            if shipment:
                history_shipments.append(shipment)
        
        # Also include any that are currently Re-routed or Liquidated
        all_shipments = db_repository.list_shipments()
        for s in all_shipments:
            if s.current_status in ["Re-routed", "Liquidated"] and s not in history_shipments:
                history_shipments.append(s)
                
        return history_shipments

    @staticmethod
    def get_nearest_hub_for_location(location: str, destination: str) -> tuple:
        """Returns (warehouse_id, warehouse_name, warehouse_location) based on shipment location."""
        loc = (str(location or "") + " " + str(destination or "")).lower()
        if any(c in loc for c in ["bengaluru", "bangalore", "pune", "anantapur"]):
            return ("wh-bangalore", "Bangalore Biologics & Cold Hub", "Bangalore")
        elif any(c in loc for c in ["mumbai", "surat", "ahmedabad"]):
            return ("wh-mumbai", "Mumbai JNPT Cold Logistics", "Mumbai")
        elif any(c in loc for c in ["delhi", "patna", "ambala", "chandigarh", "agra"]):
            return ("wh-delhi", "Delhi Air Cargo Cold Hub", "Delhi")
        elif any(c in loc for c in ["chennai", "kochi"]):
            return ("wh-chennai", "Chennai Port Freezer Terminal", "Chennai")
        return ("wh-pune", "Pune Agro-Cold Facility", "Pune")

    @staticmethod
    def execute_decision_action(shipment_id: str, action: str, notes: str = "") -> Optional[Shipment]:
        shipment = db_repository.get_shipment(shipment_id)
        if not shipment:
            return None

        timestamp_now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        loc = shipment.current_location or shipment.origin or "Current Checkpoint"
        dest = shipment.destination or "Destination Hub"
        product = shipment.product_name or "Cargo"
        val_recovered = round(shipment.shipment_value * 0.75, 2)

        wh_id, wh_name, wh_loc = DecisionService.get_nearest_hub_for_location(loc, dest)
        clean_notes = f" Note: {notes}" if notes else ""

        if action in ["Continue Delivery", "Continue"]:
            shipment.current_status = "In Transit"
            shipment.spoilage_risk = max(1.0, round(shipment.spoilage_risk * 0.3, 1))
            shipment.health_score = min(99.0, round(shipment.health_score + 25.0, 1))
            shipment.requires_decision = False
            shipment.latest_recommendation = (
                f"ACTION EXECUTED: Continued standard route for shipment {shipment_id} ({product}) currently at {loc}. "
                f"Cargo proceeding to destination {dest}. Active telemetry monitoring engaged and driver requested to inspect door seals.{clean_notes}"
            ).strip()

        elif action in ["Re-route", "Re-route Cargo"]:
            shipment.current_status = "Re-routed"
            shipment.current_location = f"Re-routed via {loc} Express Bypass Corridor → {dest}"
            shipment.spoilage_risk = 2.5
            shipment.health_score = 96.0
            shipment.requires_decision = False
            shipment.assigned_warehouse_id = wh_id
            shipment.latest_recommendation = (
                f"ACTION EXECUTED: Shipment {shipment_id} ({product}) currently at {loc} re-routed to destination {dest} "
                f"via alternative express cold corridor bypassing traffic congestion, saving ~3.5h transit time.{clean_notes}"
            ).strip()

        elif action in ["Nearest Warehouse", "Nearest Hub", "Send to Nearest Hub"]:
            shipment.current_status = "Re-routed"
            shipment.current_location = f"Diverted to {wh_name} ({wh_loc})"
            shipment.spoilage_risk = 1.8
            shipment.health_score = 97.5
            shipment.requires_decision = False
            shipment.assigned_warehouse_id = wh_id
            shipment.latest_recommendation = (
                f"ACTION EXECUTED: Emergency cold storage diversion for shipment {shipment_id} ({product}) currently at {loc}. "
                f"Diverted to nearest facility {wh_name} ({wh_loc}) for immediate pallet offloading and temperature stabilization.{clean_notes}"
            ).strip()

        elif action in ["Priority Delivery", "Priority Express", "Priority Shipping"]:
            shipment.current_status = "In Transit"
            shipment.spoilage_risk = 5.0
            shipment.health_score = 94.0
            shipment.requires_decision = False
            shipment.latest_recommendation = (
                f"ACTION EXECUTED: Priority Express Protocol engaged for shipment {shipment_id} ({product}) currently at {loc}. "
                f"Vehicle cooling compressor set to maximum boost and driver assigned express highway toll corridor to {dest}, cutting arrival ETA by 4 hours.{clean_notes}"
            ).strip()

        elif action in ["Secondary Marketplace", "Liquidate", "Liquidate Stock"]:
            shipment.current_status = "Liquidated"
            shipment.current_location = f"Liquidated at {loc} Secondary Market Exchange"
            shipment.spoilage_risk = 0.0
            shipment.health_score = 80.0
            shipment.requires_decision = False
            shipment.latest_recommendation = (
                f"ACTION EXECUTED: Shipment {shipment_id} ({product}) currently at {loc} liquidated to local secondary grocery exchange in {loc}. "
                f"Prevents total thermal spoilage write-off and recovers ${val_recovered:,.2f} of cargo value.{clean_notes}"
            ).strip()

        # Update timeline
        shipment.status_timeline.append({
            "timestamp": timestamp_now,
            "status": shipment.current_status,
            "location": shipment.current_location,
            "note": shipment.latest_recommendation
        })

        db_repository.save_shipment(shipment)
        
        # Log to decision_actions table
        db_repository.save_decision_action(
            shipment_id=shipment.id, 
            action=action, 
            notes=notes, 
            assigned_warehouse_id=shipment.assigned_warehouse_id
        )

        # Automatically resolve related open alerts for this shipment
        for alert in db_repository.list_alerts():
            if alert.shipment_id == shipment_id:
                alert.resolved = True
                db_repository.save_alert(alert)

        return shipment

class WarehouseService:
    @staticmethod
    def create_warehouse(data: WarehouseCreateRequest) -> Warehouse:
        wh_code = f"WH-{uuid.uuid4().hex[:3].upper()}"
        wh_id = str(uuid.uuid4())
        wh = Warehouse(
            id=wh_id,
            code=wh_code,
            name=data.name,
            location=data.location,
            total_capacity_pallets=data.total_capacity_pallets,
            used_capacity_pallets=data.used_capacity_pallets,
            min_temp_celsius=data.min_temp_celsius,
            max_temp_celsius=data.max_temp_celsius,
            status=data.status or "Active",
            manager=data.manager
        )
        return db_repository.save_warehouse(wh)

    @staticmethod
    def update_warehouse(wh_id: str, data: WarehouseUpdateRequest) -> Optional[Warehouse]:
        wh = db_repository.get_warehouse(wh_id)
        if not wh:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                setattr(wh, key, value)
        return db_repository.save_warehouse(wh)

class AnalyticsService:
    @staticmethod
    def get_dashboard_data() -> Dict[str, Any]:
        shipments = db_repository.list_shipments()
        warehouses = db_repository.list_warehouses()
        alerts = db_repository.list_alerts()
        kpis_db = db_repository.get_dashboard_kpis()

        # Distribution charts based on fetched shipments
        status_counts = {}
        category_counts = {}
        risk_ranges = {"Low (<15%)": 0, "Medium (15-50%)": 0, "High (>50%)": 0}

        for s in shipments:
            status_counts[s.current_status] = status_counts.get(s.current_status, 0) + 1
            category_counts[s.product_category] = category_counts.get(s.product_category, 0) + 1
            if s.spoilage_risk < 15.0:
                risk_ranges["Low (<15%)"] += 1
            elif s.spoilage_risk <= 50.0:
                risk_ranges["Medium (15-50%)"] += 1
            else:
                risk_ranges["High (>50%)"] += 1

        status_distribution = [{"name": k, "value": v} for k, v in status_counts.items()]
        spoilage_risk_distribution = [{"name": k, "value": v} for k, v in risk_ranges.items()]
        product_categories_distribution = [{"name": k, "value": v} for k, v in category_counts.items()]

        warehouse_utilization = [
            {
                "id": w.id,
                "name": w.name,
                "location": w.location,
                "utilization_percent": round((w.used_capacity_pallets / w.total_capacity_pallets) * 100, 1) if w.total_capacity_pallets > 0 else 0,
                "available_pallets": w.total_capacity_pallets - w.used_capacity_pallets
            }
            for w in warehouses
        ]

        recent_alerts = [a for a in alerts if not a.resolved][:5]
        ai_recommendations = [
            {
                "shipment_id": s.id,
                "product_name": s.product_name,
                "risk": s.spoilage_risk,
                "recommendation": s.latest_recommendation
            }
            for s in shipments if s.spoilage_risk > 15.0
        ]

        # Use DB KPIs if available, else fallback to manual aggregation for robust dev testing
        kpis = {
            "total_shipments": kpis_db.get("total_shipments", len(shipments)),
            "active_shipments": kpis_db.get("active_shipments", len([s for s in shipments if s.current_status in ["In Transit", "Warning", "Critical Breach", "Re-routed"]])),
            "delivered_shipments": kpis_db.get("delivered_shipments", len([s for s in shipments if s.current_status == "Delivered"])),
            "high_risk_shipments": kpis_db.get("high_risk_shipments", len([s for s in shipments if s.spoilage_risk > 25.0])),
            "products_saved_units": kpis_db.get("products_saved_units", sum([s.quantity for s in shipments if s.current_status == "Delivered" or (s.spoilage_risk < 10.0 and s.current_status == "Re-routed")])),
            "estimated_loss_prevented_usd": float(kpis_db.get("estimated_loss_prevented_usd", round(sum([s.shipment_value * 0.85 for s in shipments if s.health_score > 80.0]), 2))),
            "carbon_saved_kg": float(kpis_db.get("total_carbon_saved_kg", round(sum([s.estimated_carbon_impact_kg * 8.5 for s in shipments if s.health_score > 80.0]), 1)))
        }

        return {
            "kpis": kpis,
            "status_distribution": status_distribution,
            "spoilage_risk_distribution": spoilage_risk_distribution,
            "product_categories_distribution": product_categories_distribution,
            "warehouse_utilization": warehouse_utilization,
            "recent_alerts": recent_alerts,
            "recent_shipments": shipments,
            "ai_recommendations": ai_recommendations
        }
