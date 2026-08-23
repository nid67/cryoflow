"""
Pydantic Schemas for Request & Response Validation.
All input validation happens on the backend.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any

# Authentication & Profile Schemas
class LoginRequest(BaseModel):
    email: str = Field(..., example="admin@valtway.ai")
    password: str = Field(..., example="ColdChain2026!")

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class ProfileUpdateRequest(BaseModel):
    name: str = Field(..., min_length=2)
    role: str = Field(..., min_length=2)
    organization: str = Field(..., min_length=2)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

# Shipment Schemas
class ShipmentCreateRequest(BaseModel):
    product_category: str = Field(..., description="Vaccines, Dairy, or Quick-Commerce Groceries")
    product_name: str = Field(..., min_length=2)
    quantity: int = Field(..., gt=0)
    shipment_value: float = Field(..., gt=0)
    origin: str = Field(..., min_length=2)
    destination: str = Field(..., min_length=2)
    current_location: str = Field(..., min_length=2)
    current_temp: float
    humidity: float = Field(..., ge=0, le=100)
    transit_time_hours: float = Field(..., ge=0)
    estimated_arrival: str
    vehicle_number: str = Field(..., min_length=2)
    current_status: Optional[str] = "In Transit"
    notes: Optional[str] = ""

class ShipmentUpdateRequest(BaseModel):
    product_category: Optional[str] = None
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    shipment_value: Optional[float] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    current_location: Optional[str] = None
    current_temp: Optional[float] = None
    humidity: Optional[float] = None
    transit_time_hours: Optional[float] = None
    estimated_arrival: Optional[str] = None
    vehicle_number: Optional[str] = None
    current_status: Optional[str] = None
    notes: Optional[str] = None

class ShipmentResponse(BaseModel):
    id: str
    tracking_number: str
    product_category: str
    product_name: str
    quantity: int
    shipment_value: float
    origin: str
    destination: str
    current_location: str
    current_temp: float
    humidity: float
    transit_time_hours: float
    estimated_arrival: str
    vehicle_number: str
    current_status: str
    notes: str
    spoilage_risk: float
    health_score: float
    remaining_shelf_life_days: float
    estimated_financial_loss: float
    estimated_carbon_impact_kg: float
    latest_recommendation: str
    requires_decision: bool
    assigned_warehouse_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    temp_history: List[Dict[str, Any]]
    status_timeline: List[Dict[str, Any]]
    created_at: str


# Warehouse Schemas
class WarehouseCreateRequest(BaseModel):
    name: str = Field(..., min_length=2)
    location: str = Field(..., min_length=2)
    total_capacity_pallets: int = Field(..., gt=0)
    used_capacity_pallets: int = Field(..., ge=0)
    min_temp_celsius: float
    max_temp_celsius: float
    status: Optional[str] = "Active"
    manager: str = Field(..., min_length=2)

class WarehouseUpdateRequest(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    total_capacity_pallets: Optional[int] = None
    used_capacity_pallets: Optional[int] = None
    min_temp_celsius: Optional[float] = None
    max_temp_celsius: Optional[float] = None
    status: Optional[str] = None
    manager: Optional[str] = None

class WarehouseResponse(BaseModel):
    id: str
    code: str
    name: str
    location: str
    total_capacity_pallets: int
    used_capacity_pallets: int
    available_capacity_pallets: int
    min_temp_celsius: float
    max_temp_celsius: float
    status: str
    manager: str

# Prediction Schemas
class RunPredictionRequest(BaseModel):
    shipment_id: str

class PredictionResponse(BaseModel):
    shipment_id: str
    product_name: str
    product_category: str
    current_temp: float
    spoilage_risk_percent: float
    remaining_shelf_life_days: float
    health_score: float
    estimated_financial_loss_usd: float
    estimated_carbon_impact_kg: float
    confidence_score_percent: float
    ai_recommendation: str

# Decision Center Action Schemas
class DecisionActionRequest(BaseModel):
    shipment_id: str
    action: str = Field(..., description="Continue Delivery, Re-route, Nearest Warehouse, Priority Delivery, Secondary Marketplace")
    notes: Optional[str] = ""

class DecisionActionResponse(BaseModel):
    success: bool
    message: str
    updated_shipment: ShipmentResponse

# Alert Schemas
class AlertResponse(BaseModel):
    id: str
    shipment_id: Optional[str]
    warehouse_id: Optional[str]
    alert_type: str
    severity: str
    title: str
    message: str
    timestamp: str
    resolved: bool

# Analytics Dashboard Schemas
class DashboardKPIs(BaseModel):
    total_shipments: int
    active_shipments: int
    delivered_shipments: int
    high_risk_shipments: int
    products_saved_units: int
    estimated_loss_prevented_usd: float
    carbon_saved_kg: float

class AnalyticsDashboardResponse(BaseModel):
    kpis: DashboardKPIs
    status_distribution: List[Dict[str, Any]]
    spoilage_risk_distribution: List[Dict[str, Any]]
    product_categories_distribution: List[Dict[str, Any]]
    warehouse_utilization: List[Dict[str, Any]]
    recent_alerts: List[AlertResponse]
    recent_shipments: List[ShipmentResponse]
    ai_recommendations: List[Dict[str, Any]]
