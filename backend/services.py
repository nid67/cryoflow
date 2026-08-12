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

class ShipmentService:
    @staticmethod
    def calculate_health_and_risk(category: str, temp: float, hours: float, value: float):
        """Dynamic kinetic degradation model for Hackathon MVP."""
        base_min, base_max = 2.0, 8.0
        if category == "Vaccines":
            if temp < -50.0:  # mRNA ultra-cold
                base_min, base_max = -85.0, -70.0
            else:
                base_min, base_max = 2.0, 8.0
        elif category == "Dairy":
            base_min, base_max = 1.0, 4.0
        elif category == "Quick-Commerce Groceries":
            base_min, base_max = 0.5, 3.5

        delta = 0.0
        if temp > base_max:
            delta = temp - base_max
        elif temp < base_min:
            delta = base_min - temp

        if delta > 0:
            spoilage_risk = min(99.9, max(5.0, (delta * 9.5) + (hours * 0.7)))
        else:
            spoilage_risk = max(0.5, hours * 0.08)

        health_score = max(0.0, min(100.0, 100.0 - spoilage_risk))
        remaining_shelf_life_days = max(0.0, round((100.0 - spoilage_risk) * 0.25, 1))
        financial_loss = round(value * (spoilage_risk / 100.0), 2)
        carbon_impact_kg = round((value / 1000.0) * (spoilage_risk / 100.0) * 12.5, 1)

        requires_decision = spoilage_risk > 25.0
        if spoilage_risk > 60.0:
            recommendation = "CRITICAL BREACH: Immediately execute Re-route to nearest cold warehouse or Secondary Marketplace."
        elif spoilage_risk > 25.0:
            recommendation = "WARNING: Temperature excursion detected. Recommend compressor adjustment or Nearest Warehouse redirect."
        else:
            recommendation = "Parameters nominal. Maintain current thermal envelope."

        return {
            "spoilage_risk": round(spoilage_risk, 1),
            "health_score": round(health_score, 1),
            "remaining_shelf_life_days": remaining_shelf_life_days,
            "financial_loss": financial_loss,
            "carbon_impact_kg": carbon_impact_kg,
            "requires_decision": requires_decision,
            "recommendation": recommendation,
            "min_limit": base_min,
            "max_limit": base_max
        }

    @classmethod
    def create_shipment(cls, data: ShipmentCreateRequest) -> Shipment:
        shipment_id = f"CRY-{uuid.uuid4().hex[:4].upper()}"
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
                id=f"ALT-{uuid.uuid4().hex[:4].upper()}",
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

        return {
            "shipment_id": shipment.id,
            "product_name": shipment.product_name,
            "product_category": shipment.product_category,
            "current_temp": shipment.current_temp,
            "spoilage_risk_percent": metrics["spoilage_risk"],
            "remaining_shelf_life_days": metrics["remaining_shelf_life_days"],
            "health_score": metrics["health_score"],
            "estimated_financial_loss_usd": metrics["financial_loss"],
            "estimated_carbon_impact_kg": metrics["carbon_impact_kg"],
            "confidence_score_percent": confidence_score,
            "ai_recommendation": metrics["recommendation"]
        }

class DecisionService:
    @staticmethod
    def get_shipments_requiring_action() -> List[Shipment]:
        return [s for s in db_repository.list_shipments() if s.requires_decision or s.spoilage_risk > 20.0 or s.current_status in ["Warning", "Critical Breach"]]

    @staticmethod
    def get_executed_decision_history() -> List[Shipment]:
        all_shipments = db_repository.list_shipments()
        history = []
        for s in all_shipments:
            has_action = any("ACTION EXECUTED" in st.get("note", "") for st in s.status_timeline)
            if has_action or s.current_status in ["Re-routed", "Liquidated"]:
                history.append(s)
        return history

    @staticmethod
    def execute_decision_action(shipment_id: str, action: str, notes: str = "") -> Optional[Shipment]:
        shipment = db_repository.get_shipment(shipment_id)
        if not shipment:
            return None

        timestamp_now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        if action == "Continue Delivery":
            shipment.current_status = "In Transit"
            shipment.spoilage_risk = max(1.0, shipment.spoilage_risk * 0.3)
            shipment.health_score = min(99.0, shipment.health_score + 25.0)
            shipment.requires_decision = False
            shipment.latest_recommendation = f"ACTION EXECUTED: Continued standard delivery path under priority monitoring. {notes}".strip()

        elif action == "Re-route":
            shipment.current_status = "Re-routed"
            shipment.current_location = "Redirected to Chicago Central Cold Hub"
            shipment.spoilage_risk = 2.5
            shipment.health_score = 96.0
            shipment.requires_decision = False
            shipment.assigned_warehouse_id = "WH-102"
            shipment.latest_recommendation = f"ACTION EXECUTED: Rerouted to Chicago Central Cold Hub. {notes}".strip()

        elif action == "Nearest Warehouse":
            shipment.current_status = "Re-routed"
            shipment.current_location = "Redirected to Frankfurt Cold Hub"
            shipment.spoilage_risk = 1.8
            shipment.health_score = 97.5
            shipment.requires_decision = False
            shipment.assigned_warehouse_id = "WH-101"
            shipment.latest_recommendation = f"ACTION EXECUTED: Emergency diversion to nearest warehouse (WH-101). {notes}".strip()

        elif action == "Priority Delivery":
            shipment.current_status = "In Transit"
            shipment.spoilage_risk = 5.0
            shipment.health_score = 94.0
            shipment.requires_decision = False
            shipment.latest_recommendation = f"ACTION EXECUTED: Priority express lane speed override engaged. {notes}".strip()

        elif action == "Secondary Marketplace":
            shipment.current_status = "Liquidated"
            shipment.spoilage_risk = 0.0
            shipment.health_score = 80.0
            shipment.requires_decision = False
            shipment.latest_recommendation = f"ACTION EXECUTED: Batch liquidated to secondary grocery market to prevent total financial write-off. {notes}".strip()

        # Update timeline
        shipment.status_timeline.append({
            "timestamp": timestamp_now,
            "status": shipment.current_status,
            "location": shipment.current_location,
            "note": f"Decision Center Action: '{action}' executed successfully."
        })

        db_repository.save_shipment(shipment)

        # Automatically resolve related open alerts for this shipment
        for alert in db_repository.list_alerts():
            if alert.shipment_id == shipment_id:
                alert.resolved = True
                db_repository.save_alert(alert)

        return shipment

class WarehouseService:
    @staticmethod
    def create_warehouse(data: WarehouseCreateRequest) -> Warehouse:
        wh_id = f"WH-{uuid.uuid4().hex[:3].upper()}"
        wh = Warehouse(
            id=wh_id,
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

        total_shipments = len(shipments)
        active_shipments = len([s for s in shipments if s.current_status in ["In Transit", "Warning", "Critical Breach", "Re-routed"]])
        delivered_shipments = len([s for s in shipments if s.current_status == "Delivered"])
        high_risk_shipments = len([s for s in shipments if s.spoilage_risk > 25.0])
        
        products_saved_units = sum([s.quantity for s in shipments if s.current_status == "Delivered" or (s.spoilage_risk < 10.0 and s.current_status == "Re-routed")])
        estimated_loss_prevented_usd = round(sum([s.shipment_value * 0.85 for s in shipments if s.health_score > 80.0]), 2)
        carbon_saved_kg = round(sum([s.estimated_carbon_impact_kg * 8.5 for s in shipments if s.health_score > 80.0]), 1)

        # Distribution charts
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
                "utilization_percent": round((w.used_capacity_pallets / w.total_capacity_pallets) * 100, 1),
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

        return {
            "kpis": {
                "total_shipments": total_shipments,
                "active_shipments": active_shipments,
                "delivered_shipments": delivered_shipments,
                "high_risk_shipments": high_risk_shipments,
                "products_saved_units": products_saved_units,
                "estimated_loss_prevented_usd": estimated_loss_prevented_usd,
                "carbon_saved_kg": carbon_saved_kg
            },
            "status_distribution": status_distribution,
            "spoilage_risk_distribution": spoilage_risk_distribution,
            "product_categories_distribution": product_categories_distribution,
            "warehouse_utilization": warehouse_utilization,
            "recent_alerts": recent_alerts,
            "recent_shipments": shipments,
            "ai_recommendations": ai_recommendations
        }
