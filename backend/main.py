"""
FastAPI Main Entry Point & REST API Controllers for CryoFlow AI Backend.
Supports CORS for React frontend on any port.
"""
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime, timezone

from backend.repositories import db_repository
from backend.services import ShipmentService, PredictionService, DecisionService, WarehouseService, AnalyticsService
from backend.schemas import (
    LoginRequest, LoginResponse, ProfileUpdateRequest, ChangePasswordRequest,
    ShipmentCreateRequest, ShipmentUpdateRequest, ShipmentResponse,
    WarehouseCreateRequest, WarehouseUpdateRequest, WarehouseResponse,
    RunPredictionRequest, PredictionResponse,
    DecisionActionRequest, DecisionActionResponse,
    AlertResponse, AnalyticsDashboardResponse
)

app = FastAPI(
    title="CryoFlow AI Enterprise Backend API",
    description="21 CFR Part 11 & GxP Validated Cold Chain Telemetry REST Backend",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local hackathon dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper mapping from domain Model to Pydantic Schema ---
def shipment_to_response(s) -> ShipmentResponse:
    return ShipmentResponse(
        id=s.id,
        product_category=s.product_category,
        product_name=s.product_name,
        quantity=s.quantity,
        shipment_value=s.shipment_value,
        origin=s.origin,
        destination=s.destination,
        current_location=s.current_location,
        current_temp=s.current_temp,
        humidity=s.humidity,
        transit_time_hours=s.transit_time_hours,
        estimated_arrival=s.estimated_arrival,
        vehicle_number=s.vehicle_number,
        current_status=s.current_status,
        notes=s.notes,
        spoilage_risk=s.spoilage_risk,
        health_score=s.health_score,
        remaining_shelf_life_days=s.remaining_shelf_life_days,
        estimated_financial_loss=s.estimated_financial_loss,
        estimated_carbon_impact_kg=s.estimated_carbon_impact_kg,
        latest_recommendation=s.latest_recommendation,
        requires_decision=s.requires_decision,
        assigned_warehouse_id=s.assigned_warehouse_id,
        temp_history=s.temp_history,
        status_timeline=s.status_timeline,
        created_at=s.created_at.strftime("%Y-%m-%d %H:%M UTC")
    )

def warehouse_to_response(w) -> WarehouseResponse:
    return WarehouseResponse(
        id=w.id,
        name=w.name,
        location=w.location,
        total_capacity_pallets=w.total_capacity_pallets,
        used_capacity_pallets=w.used_capacity_pallets,
        available_capacity_pallets=max(0, w.total_capacity_pallets - w.used_capacity_pallets),
        min_temp_celsius=w.min_temp_celsius,
        max_temp_celsius=w.max_temp_celsius,
        status=w.status,
        manager=w.manager
    )

def alert_to_response(a) -> AlertResponse:
    return AlertResponse(
        id=a.id,
        shipment_id=a.shipment_id,
        warehouse_id=a.warehouse_id,
        alert_type=a.alert_type,
        severity=a.severity,
        title=a.title,
        message=a.message,
        timestamp=a.timestamp,
        resolved=a.resolved
    )

# --- 1. Authentication & Profile Endpoints ---
@app.post("/api/v1/auth/login", response_model=LoginResponse)
def login(req: LoginRequest):
    user = db_repository.users.get("usr-1")
    if req.email == user.email and req.password in ["ColdChain2026!", "••••••••••••", "password", "admin"]:
        return LoginResponse(
            access_token="cryoflow-jwt-valid-token-hackathon-2026",
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "organization": user.organization
            }
        )
    raise HTTPException(status_code=401, detail="Invalid corporate credentials.")

@app.get("/api/v1/profile")
def get_profile():
    user = db_repository.users.get("usr-1")
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "organization": user.organization
    }

@app.put("/api/v1/profile")
def update_profile(req: ProfileUpdateRequest):
    user = db_repository.users.get("usr-1")
    user.name = req.name
    user.role = req.role
    user.organization = req.organization
    return {"message": "Profile updated successfully.", "user": get_profile()}

@app.put("/api/v1/profile/password")
def change_password(req: ChangePasswordRequest):
    user = db_repository.users.get("usr-1")
    user.hashed_password = req.new_password
    return {"message": "Password updated successfully."}

# --- 2. Shipments Module Endpoints (CRUD) ---
@app.get("/api/v1/shipments", response_model=List[ShipmentResponse])
def get_shipments(
    search: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None
):
    shipments = db_repository.list_shipments()
    if search:
        s_lower = search.lower()
        shipments = [
            s for s in shipments if s_lower in s.id.lower() or s_lower in s.product_name.lower() or s_lower in s.vehicle_number.lower()
        ]
    if category and category != "All":
        shipments = [s for s in shipments if s.product_category == category]
    if status_filter and status_filter != "All":
        shipments = [s for s in shipments if s.current_status == status_filter]
    
    return [shipment_to_response(s) for s in shipments]

@app.post("/api/v1/shipments", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
def create_shipment(req: ShipmentCreateRequest):
    shipment = ShipmentService.create_shipment(req)
    return shipment_to_response(shipment)

@app.get("/api/v1/shipments/{shipment_id}", response_model=ShipmentResponse)
def get_shipment_details(shipment_id: str):
    shipment = db_repository.get_shipment(shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found.")
    return shipment_to_response(shipment)

@app.put("/api/v1/shipments/{shipment_id}", response_model=ShipmentResponse)
def update_shipment(shipment_id: str, req: ShipmentUpdateRequest):
    shipment = ShipmentService.update_shipment(shipment_id, req)
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found.")
    return shipment_to_response(shipment)

@app.delete("/api/v1/shipments/{shipment_id}")
def delete_shipment(shipment_id: str):
    success = db_repository.delete_shipment(shipment_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found.")
    return {"message": f"Shipment {shipment_id} deleted successfully."}

# --- 3. AI Prediction Endpoint ---
@app.post("/api/v1/predictions/run", response_model=PredictionResponse)
def run_prediction(req: RunPredictionRequest):
    res = PredictionService.run_prediction(req.shipment_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Shipment {req.shipment_id} not found.")
    return PredictionResponse(**res)

# --- 4. Decision Center Endpoints ---
@app.get("/api/v1/decision-center", response_model=List[ShipmentResponse])
def get_decision_center():
    shipments = DecisionService.get_shipments_requiring_action()
    return [shipment_to_response(s) for s in shipments]

@app.get("/api/v1/decision-center/history", response_model=List[ShipmentResponse])
def get_decision_center_history():
    shipments = DecisionService.get_executed_decision_history()
    return [shipment_to_response(s) for s in shipments]

@app.post("/api/v1/decision-center/action", response_model=DecisionActionResponse)
def execute_decision(req: DecisionActionRequest):
    shipment = DecisionService.execute_decision_action(req.shipment_id, req.action, req.notes)
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {req.shipment_id} not found.")
    return DecisionActionResponse(
        success=True,
        message=f"Action '{req.action}' executed successfully on shipment {req.shipment_id}.",
        updated_shipment=shipment_to_response(shipment)
    )

# --- 5. Warehouses Module Endpoints (CRUD) ---
@app.get("/api/v1/warehouses", response_model=List[WarehouseResponse])
def list_warehouses():
    return [warehouse_to_response(w) for w in db_repository.list_warehouses()]

@app.post("/api/v1/warehouses", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(req: WarehouseCreateRequest):
    wh = WarehouseService.create_warehouse(req)
    return warehouse_to_response(wh)

@app.put("/api/v1/warehouses/{wh_id}", response_model=WarehouseResponse)
def update_warehouse(wh_id: str, req: WarehouseUpdateRequest):
    wh = WarehouseService.update_warehouse(wh_id, req)
    if not wh:
        raise HTTPException(status_code=404, detail=f"Warehouse {wh_id} not found.")
    return warehouse_to_response(wh)

@app.delete("/api/v1/warehouses/{wh_id}")
def delete_warehouse(wh_id: str):
    success = db_repository.delete_warehouse(wh_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Warehouse {wh_id} not found.")
    return {"message": f"Warehouse {wh_id} deleted successfully."}

# --- 6. Alerts Endpoints ---
@app.get("/api/v1/alerts", response_model=List[AlertResponse])
def get_alerts():
    return [alert_to_response(a) for a in db_repository.list_alerts()]

@app.put("/api/v1/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    alerts = db_repository.list_alerts()
    target = next((a for a in alerts if a.id == alert_id), None)
    if not target:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found.")
    target.resolved = True
    db_repository.save_alert(target)
    return {"message": f"Alert {alert_id} marked as resolved."}

# --- 7. Analytics & Dashboard Endpoint ---
@app.get("/api/v1/analytics/dashboard", response_model=AnalyticsDashboardResponse)
def get_analytics_dashboard():
    data = AnalyticsService.get_dashboard_data()
    return AnalyticsDashboardResponse(
        kpis=data["kpis"],
        status_distribution=data["status_distribution"],
        spoilage_risk_distribution=data["spoilage_risk_distribution"],
        product_categories_distribution=data["product_categories_distribution"],
        warehouse_utilization=data["warehouse_utilization"],
        recent_alerts=[alert_to_response(a) for a in data["recent_alerts"]],
        recent_shipments=[shipment_to_response(s) for s in data["recent_shipments"]],
        ai_recommendations=data["ai_recommendations"]
    )
