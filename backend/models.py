"""
Domain models for CryoFlow AI Backend.
In-memory entities ready for SQLAlchemy / PostgreSQL migration.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Dict, Any

@dataclass
class User:
    id: str
    email: str
    name: str
    role: str
    organization: str
    hashed_password: str
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class TempLog:
    timestamp: str
    temp: float
    min_limit: float
    max_limit: float

@dataclass
class StatusLog:
    timestamp: str
    status: str
    location: str
    note: str

@dataclass
class Shipment:
    id: str
    tracking_number: str
    product_category: str  # Vaccines, Dairy, Quick-Commerce Groceries
    product_name: str
    quantity: int
    shipment_value: float  # $ USD
    origin: str
    destination: str
    current_location: str
    current_temp: float  # °C
    humidity: float  # %
    transit_time_hours: float
    estimated_arrival: str
    vehicle_number: str
    current_status: str  # In Transit, Warning, Critical Breach, Re-routed, Delivered, Liquidated
    notes: str
    
    # Dynamic computed fields initialized or updated by AI / Services
    spoilage_risk: float = 2.0  # %
    health_score: float = 98.0  # 0 - 100
    remaining_shelf_life_days: float = 14.0
    estimated_financial_loss: float = 0.0
    estimated_carbon_impact_kg: float = 0.0
    latest_recommendation: str = "Parameters normal. Maintain current thermal envelope."
    requires_decision: bool = False
    assigned_warehouse_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


    temp_history: List[Dict[str, Any]] = field(default_factory=list)
    status_timeline: List[Dict[str, Any]] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)




@dataclass
class Warehouse:
    id: str
    code: str
    name: str
    location: str
    total_capacity_pallets: int
    used_capacity_pallets: int
    min_temp_celsius: float
    max_temp_celsius: float
    status: str  # Active, Maintenance, Full
    manager: str
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Alert:
    id: str
    shipment_id: Optional[str]
    warehouse_id: Optional[str]
    alert_type: str  # Temperature Alert, Delay Alert, Spoilage Alert, Warehouse Alert, Risk Alert
    severity: str  # Low, Medium, High, Critical
    title: str
    message: str
    timestamp: str
    resolved: bool = False
