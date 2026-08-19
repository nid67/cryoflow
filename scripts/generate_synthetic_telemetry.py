#!/usr/bin/env python3
"""
CryoFlow AI - Synthetic Cold-Chain Telemetry & Shipment Data Generator
======================================================================
Simulates realistic, physics-based cold chain telemetry time-series,
sensor fluctuations, thermal degradation kinetics, GPS route movements,
compressor degradation, and anomaly excursions for vaccines, dairy,
and quick-commerce groceries.

Supports both:
1. Historical batch seeding (multi-hour historical time-series)
2. Live incremental / hourly streaming simulation
"""

import argparse
import json
import math
import random
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple

# ==============================================================================
# 1. DOMAIN CONFIGURATIONS & ROUTE DATABASE
# ==============================================================================

PRODUCT_CATALOG = {
    "Vaccines": [
        {
            "name": "mRNA COVID-19 Ultra-Cold Vaccines",
            "type": "ultra_cold",
            "min_temp": -85.0,
            "max_temp": -70.0,
            "nominal_temp": -78.0,
            "base_shelf_life_days": 30.0,
            "min_val": 500000.0,
            "max_val": 2500000.0,
            "min_qty": 10000,
            "max_qty": 100000,
            "degradation_rate": 18.0, # high sensitivity
        },
        {
            "name": "Pediatric Polio & MMR Vaccines",
            "type": "standard_cold",
            "min_temp": 2.0,
            "max_temp": 8.0,
            "nominal_temp": 4.5,
            "base_shelf_life_days": 90.0,
            "min_val": 150000.0,
            "max_val": 750000.0,
            "min_qty": 5000,
            "max_qty": 30000,
            "degradation_rate": 9.5,
        },
        {
            "name": "Influenza Quadrivalent Vaccines",
            "type": "standard_cold",
            "min_temp": 2.0,
            "max_temp": 8.0,
            "nominal_temp": 4.0,
            "base_shelf_life_days": 120.0,
            "min_val": 80000.0,
            "max_val": 450000.0,
            "min_qty": 10000,
            "max_qty": 50000,
            "degradation_rate": 8.5,
        }
    ],
    "Dairy": [
        {
            "name": "Organic Pasteurized Whole Milk & Butter",
            "type": "dairy",
            "min_temp": 1.0,
            "max_temp": 4.0,
            "nominal_temp": 2.5,
            "base_shelf_life_days": 18.0,
            "min_val": 20000.0,
            "max_val": 85000.0,
            "min_qty": 5000,
            "max_qty": 25000,
            "degradation_rate": 6.5,
        },
        {
            "name": "Artisanal Cultured Yogurt & Cream",
            "type": "dairy",
            "min_temp": 1.0,
            "max_temp": 4.5,
            "nominal_temp": 3.0,
            "base_shelf_life_days": 21.0,
            "min_val": 25000.0,
            "max_val": 110000.0,
            "min_qty": 4000,
            "max_qty": 18000,
            "degradation_rate": 6.0,
        }
    ],
    "Quick-Commerce Groceries": [
        {
            "name": "Premium Hydroponic Berries & Greens",
            "type": "produce",
            "min_temp": 0.5,
            "max_temp": 3.5,
            "nominal_temp": 2.0,
            "base_shelf_life_days": 8.0,
            "min_val": 12000.0,
            "max_val": 45000.0,
            "min_qty": 1500,
            "max_qty": 8000,
            "degradation_rate": 11.0,
        },
        {
            "name": "Pre-cut Organic Exotic Fruits",
            "type": "produce",
            "min_temp": 1.0,
            "max_temp": 4.0,
            "nominal_temp": 2.2,
            "base_shelf_life_days": 6.0,
            "min_val": 8000.0,
            "max_val": 35000.0,
            "min_qty": 1000,
            "max_qty": 5000,
            "degradation_rate": 12.5,
        }
    ]
}

ROUTES_DATABASE = [
    {
        "origin": "Delhi",
        "origin_coords": (28.6139, 77.2090),
        "destination": "Mumbai",
        "destination_coords": (19.0760, 72.8777),
        "mode": "Reefer Truck",
        "avg_speed_kmh": 65.0,
        "transit_hours": 22.0,
        "vehicle_prefix": "DL-COLD-"
    },
    {
        "origin": "Pune",
        "origin_coords": (18.5204, 73.8567),
        "destination": "Chennai",
        "destination_coords": (13.0827, 80.2707),
        "mode": "Reefer Truck",
        "avg_speed_kmh": 60.0,
        "transit_hours": 18.0,
        "vehicle_prefix": "MH-REEFER-"
    },
    {
        "origin": "Hyderabad",
        "origin_coords": (17.3850, 78.4867),
        "destination": "Bangalore",
        "destination_coords": (12.9716, 77.5946),
        "mode": "Express Reefer Truck",
        "avg_speed_kmh": 70.0,
        "transit_hours": 8.5,
        "vehicle_prefix": "TS-EXPRESS-"
    },
    {
        "origin": "Kolkata",
        "origin_coords": (22.5726, 88.3639),
        "destination": "Delhi",
        "destination_coords": (28.6139, 77.2090),
        "mode": "Long-Haul Reefer Truck",
        "avg_speed_kmh": 55.0,
        "transit_hours": 28.0,
        "vehicle_prefix": "WB-FREIGHT-"
    },
    {
        "origin": "Ahmedabad",
        "origin_coords": (23.0225, 72.5714),
        "destination": "Jaipur",
        "destination_coords": (26.9124, 75.7873),
        "mode": "Reefer Truck",
        "avg_speed_kmh": 65.0,
        "transit_hours": 10.0,
        "vehicle_prefix": "GJ-COLD-"
    },
    {
        "origin": "Chennai",
        "origin_coords": (13.0827, 80.2707),
        "destination": "Kochi",
        "destination_coords": (9.9312, 76.2673),
        "mode": "Express Reefer Truck",
        "avg_speed_kmh": 60.0,
        "transit_hours": 11.0,
        "vehicle_prefix": "TN-REEFER-"
    }
]

WAREHOUSE_SEEDS = [
    {"id": "e0b5f101-1111-4000-8000-000000000101", "code": "WH-101", "name": "Delhi Cold Hub", "city": "Delhi"},
    {"id": "e0b5f102-2222-4000-8000-000000000102", "code": "WH-102", "name": "Mumbai Central Depot", "city": "Mumbai"},
    {"id": "e0b5f103-3333-4000-8000-000000000103", "code": "WH-103", "name": "Chennai Biologics Center", "city": "Chennai"},
    {"id": "e0b5f104-4444-4000-8000-000000000104", "code": "WH-104", "name": "Kolkata Freight Hub", "city": "Kolkata"}
]

# ==============================================================================
# 2. DATA CLASSES
# ==============================================================================

@dataclass
class TelemetryPoint:
    id: str
    shipment_id: str
    recorded_at: str
    temperature: float
    humidity: float
    ambient_temperature: float
    compressor_status: str
    battery: float
    latitude: float
    longitude: float
    speed: float

@dataclass
class AIPredictionRecord:
    id: str
    shipment_id: str
    predicted_at: str
    current_temp: float
    spoilage_risk_percent: float
    remaining_shelf_life_days: float
    health_score: float
    estimated_financial_loss_usd: float
    estimated_carbon_impact_kg: float
    confidence_score_percent: float
    ai_recommendation: str

@dataclass
class ShipmentRecord:
    id: str
    tracking_number: str
    warehouse_id: Optional[str]
    product_category: str
    product_name: str
    quantity: int
    shipment_value: float
    origin: str
    destination: str
    current_location: str
    current_temperature: float
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
    recommendation: str
    requires_decision: bool
    created_at: str
    updated_at: str
    telemetry_logs: List[TelemetryPoint] = field(default_factory=list)
    predictions: List[AIPredictionRecord] = field(default_factory=list)

# ==============================================================================
# 3. SYNTHETIC COLD-CHAIN ENGINE
# ==============================================================================

class ColdChainSyntheticEngine:
    """
    Core simulation engine modeling thermal degradation kinetics, ambient coupling,
    compressor physics, and GPS route interpolation.
    """

    def __init__(self, seed: Optional[int] = None):
        if seed is not None:
            random.seed(seed)

    @staticmethod
    def calculate_kinetic_metrics(
        category: str,
        base_shelf_life: float,
        degradation_rate: float,
        min_limit: float,
        max_limit: float,
        telemetry_history: List[Tuple[float, float]], # List of (temp, duration_hours)
        current_temp: float,
        total_transit_hours: float,
        shipment_value: float
    ) -> Dict[str, Any]:
        """
        Integrates cumulative thermal degree-hours above threshold using Arrhenius-style
        kinetic degradation modeling.
        """
        cumulative_degree_hours = 0.0
        for temp, step_hours in telemetry_history:
            delta = 0.0
            if temp > max_limit:
                delta = temp - max_limit
            elif temp < min_limit:
                delta = min_limit - temp
            
            if delta > 0:
                cumulative_degree_hours += (delta ** 1.35) * step_hours

        # Compute dynamic risk
        if cumulative_degree_hours > 0:
            spoilage_risk = min(99.9, max(4.0, (cumulative_degree_hours * degradation_rate) + (total_transit_hours * 0.4)))
        else:
            spoilage_risk = max(0.5, total_transit_hours * 0.08)

        spoilage_risk = round(spoilage_risk, 1)
        health_score = round(max(0.0, min(100.0, 100.0 - spoilage_risk)), 1)
        
        # Shelf life decay proportional to health score
        remaining_shelf_life_days = round(max(0.0, base_shelf_life * (health_score / 100.0)), 1)
        
        # Financial and Carbon impact
        financial_loss = round(shipment_value * (spoilage_risk / 100.0), 2)
        carbon_impact_kg = round((shipment_value / 1000.0) * (spoilage_risk / 100.0) * 12.5, 1)

        requires_decision = spoilage_risk > 25.0
        if spoilage_risk > 60.0:
            recommendation = "CRITICAL BREACH: Temperature excursion exceeds safe threshold. Immediately execute Re-route to cold hub or Secondary Marketplace Liquidation."
        elif spoilage_risk > 25.0:
            recommendation = "WARNING: Active thermal excursion detected. Recommend compressor boost or nearest warehouse diversion."
        else:
            recommendation = "Parameters nominal. Maintain active cooling and continue monitored delivery path."

        return {
            "spoilage_risk": spoilage_risk,
            "health_score": health_score,
            "remaining_shelf_life_days": remaining_shelf_life_days,
            "financial_loss": financial_loss,
            "carbon_impact_kg": carbon_impact_kg,
            "requires_decision": requires_decision,
            "recommendation": recommendation
        }

    def generate_single_shipment(
        self,
        category: Optional[str] = None,
        scenario: str = "random", # 'normal', 'ambient_heat', 'compressor_degradation', 'compressor_failure', 'random'
        points_count: int = 16,
        interval_minutes: int = 30,
        base_time: Optional[datetime] = None
    ) -> ShipmentRecord:
        """
        Generates a realistic cold-chain shipment with continuous, correlated time-series telemetry.
        """
        if base_time is None:
            base_time = datetime.now(timezone.utc) - timedelta(minutes=points_count * interval_minutes)

        if category is None or category not in PRODUCT_CATALOG:
            category = random.choice(list(PRODUCT_CATALOG.keys()))

        product_cfg = random.choice(PRODUCT_CATALOG[category])
        route = random.choice(ROUTES_DATABASE)
        
        shipment_id = str(uuid.uuid4())
        tracking_num = f"CRY-{random.randint(1000, 9999)}"
        warehouse = random.choice(WAREHOUSE_SEEDS)

        quantity = random.randint(product_cfg["min_qty"], product_cfg["max_qty"])
        unit_val = random.uniform(product_cfg["min_val"] / product_cfg["max_qty"], product_cfg["max_val"] / product_cfg["min_qty"])
        shipment_value = round(quantity * unit_val, 2)

        vehicle_num = f"{route['vehicle_prefix']}{random.randint(100, 999)}"

        # Determine Scenario
        if scenario == "random":
            scenario_choice = random.choices(
                ["normal", "ambient_heat", "compressor_degradation", "compressor_failure"],
                weights=[0.60, 0.18, 0.14, 0.08]
            )[0]
        else:
            scenario_choice = scenario

        # Initial conditions
        cargo_temp = product_cfg["nominal_temp"] + random.uniform(-0.3, 0.3)
        battery = random.uniform(92.0, 100.0)
        humidity = random.uniform(40.0, 55.0) if category == "Vaccines" else random.uniform(65.0, 80.0)
        compressor_status = "Normal"

        telemetry_points: List[TelemetryPoint] = []
        temp_history_tuples: List[Tuple[float, float]] = []

        step_hours = interval_minutes / 60.0
        total_route_hours = route["transit_hours"]

        orig_lat, orig_lon = route["origin_coords"]
        dest_lat, dest_lon = route["destination_coords"]

        for i in range(points_count):
            recorded_dt = base_time + timedelta(minutes=i * interval_minutes)
            recorded_str = recorded_dt.strftime("%Y-%m-%d %H:%M UTC")

            # Route progress (0.0 -> 1.0)
            progress = min(1.0, max(0.0, (i + 1) / points_count))
            
            # GPS movement interpolation with slight realistic jitter
            lat = round(orig_lat + progress * (dest_lat - orig_lat) + random.uniform(-0.02, 0.02), 6)
            lon = round(orig_lon + progress * (dest_lon - orig_lon) + random.uniform(-0.02, 0.02), 6)
            speed = round(max(0.0, route["avg_speed_kmh"] + random.uniform(-8.0, 8.0)), 1) if progress < 1.0 else 0.0

            # Ambient temperature (diurnal solar curve + weather variation)
            hour_of_day = recorded_dt.hour + (recorded_dt.minute / 60.0)
            ambient_base = 22.0 if route["mode"] != "Air Freight" else -15.0
            diurnal_wave = math.sin((hour_of_day - 9.0) * math.pi / 12.0) * 8.0
            ambient_temp = round(ambient_base + diurnal_wave + random.uniform(-1.5, 1.5), 1)

            # Battery gradual drain
            battery = max(5.0, round(battery - random.uniform(0.1, 0.4), 1))

            # Thermal Physics & Excursion Simulation
            if scenario_choice == "normal":
                compressor_status = "Normal" if random.random() > 0.1 else "Active"
                # Natural slight thermal fluctuation controlled by compressor
                cargo_temp += random.uniform(-0.15, 0.15)
                # Keep within nominal limits
                if cargo_temp > product_cfg["max_temp"]:
                    cargo_temp -= 0.2
                elif cargo_temp < product_cfg["min_temp"]:
                    cargo_temp += 0.2

            elif scenario_choice == "ambient_heat":
                # External heatwave forces compressor into high load
                ambient_temp = max(34.0, ambient_temp + 12.0)
                if i >= points_count // 3:
                    compressor_status = "Warning"
                    cargo_temp += random.uniform(0.1, 0.35)
                else:
                    compressor_status = "Active"
                    cargo_temp += random.uniform(-0.05, 0.1)

            elif scenario_choice == "compressor_degradation":
                if i >= points_count // 4:
                    compressor_status = "Warning"
                    cargo_temp += random.uniform(0.2, 0.45) # steady creeping rise
                    humidity = min(95.0, humidity + random.uniform(0.5, 1.5))
                else:
                    compressor_status = "Normal"
                    cargo_temp += random.uniform(-0.05, 0.1)

            elif scenario_choice == "compressor_failure":
                if i >= points_count // 3:
                    compressor_status = "Fault" if i < points_count - 2 else "Off"
                    # Severe rapid temperature rise toward ambient
                    temp_diff = ambient_temp - cargo_temp
                    cargo_temp += (temp_diff * 0.08) + random.uniform(0.2, 0.6)
                    battery = max(2.0, battery - random.uniform(1.5, 3.5))
                    humidity = min(98.0, humidity + random.uniform(1.0, 3.0))
                else:
                    compressor_status = "Normal"
                    cargo_temp += random.uniform(-0.05, 0.05)

            cargo_temp = round(cargo_temp, 2)
            humidity = round(max(20.0, min(99.0, humidity + random.uniform(-0.8, 0.8))), 1)

            # Store point
            tel_id = str(uuid.uuid4())
            telemetry_points.append(TelemetryPoint(
                id=tel_id,
                shipment_id=shipment_id,
                recorded_at=recorded_str,
                temperature=cargo_temp,
                humidity=humidity,
                ambient_temperature=ambient_temp,
                compressor_status=compressor_status,
                battery=battery,
                latitude=lat,
                longitude=lon,
                speed=speed
            ))

            temp_history_tuples.append((cargo_temp, step_hours))

        # Final calculated metrics
        total_transit_hours = points_count * step_hours
        metrics = self.calculate_kinetic_metrics(
            category=category,
            base_shelf_life=product_cfg["base_shelf_life_days"],
            degradation_rate=product_cfg["degradation_rate"],
            min_limit=product_cfg["min_temp"],
            max_limit=product_cfg["max_temp"],
            telemetry_history=temp_history_tuples,
            current_temp=cargo_temp,
            total_transit_hours=total_transit_hours,
            shipment_value=shipment_value
        )

        # Status determination
        if metrics["spoilage_risk"] > 60.0:
            current_status = "Critical Breach"
        elif metrics["spoilage_risk"] > 25.0:
            current_status = "Warning"
        else:
            current_status = "Normal" if progress < 1.0 else "Delivered"

        # Current location string
        if progress >= 1.0:
            current_location = f"Delivered at {route['destination']}"
        elif progress > 0.6:
            current_location = f"In Transit nearing {route['destination']}"
        elif progress > 0.3:
            current_location = f"Midway corridor between {route['origin']} and {route['destination']}"
        else:
            current_location = f"Departed {route['origin']}"

        created_dt = base_time
        updated_dt = base_time + timedelta(minutes=points_count * interval_minutes)
        eta_dt = created_dt + timedelta(hours=total_route_hours)

        # Generate AI Prediction Record
        pred_id = str(uuid.uuid4())
        conf_score = round(94.0 + (100.0 - metrics["spoilage_risk"]) * 0.05, 1)
        pred_record = AIPredictionRecord(
            id=pred_id,
            shipment_id=shipment_id,
            predicted_at=updated_dt.strftime("%Y-%m-%d %H:%M UTC"),
            current_temp=cargo_temp,
            spoilage_risk_percent=metrics["spoilage_risk"],
            remaining_shelf_life_days=metrics["remaining_shelf_life_days"],
            health_score=metrics["health_score"],
            estimated_financial_loss_usd=metrics["financial_loss"],
            estimated_carbon_impact_kg=metrics["carbon_impact_kg"],
            confidence_score_percent=conf_score,
            ai_recommendation=metrics["recommendation"]
        )

        shipment = ShipmentRecord(
            id=shipment_id,
            tracking_number=tracking_num,
            warehouse_id=warehouse["id"],
            product_category=category,
            product_name=product_cfg["name"],
            quantity=quantity,
            shipment_value=shipment_value,
            origin=route["origin"],
            destination=route["destination"],
            current_location=current_location,
            current_temperature=cargo_temp,
            humidity=humidity,
            transit_time_hours=round(total_transit_hours, 1),
            estimated_arrival=eta_dt.strftime("%Y-%m-%d %H:%M UTC"),
            vehicle_number=vehicle_num,
            current_status=current_status,
            notes=f"Simulated {scenario_choice} cold-chain run ({route['mode']}).",
            spoilage_risk=metrics["spoilage_risk"],
            health_score=metrics["health_score"],
            remaining_shelf_life_days=metrics["remaining_shelf_life_days"],
            estimated_financial_loss=metrics["financial_loss"],
            estimated_carbon_impact_kg=metrics["carbon_impact_kg"],
            recommendation=metrics["recommendation"],
            requires_decision=metrics["requires_decision"],
            created_at=created_dt.strftime("%Y-%m-%d %H:%M UTC"),
            updated_at=updated_dt.strftime("%Y-%m-%d %H:%M UTC"),
            telemetry_logs=telemetry_points,
            predictions=[pred_record]
        )

        return shipment

    def generate_batch(
        self,
        num_shipments: int = 12,
        points_per_shipment: int = 18,
        interval_minutes: int = 30
    ) -> List[ShipmentRecord]:
        """
        Generates a full batch of shipments covering all categories and failure scenarios.
        """
        scenarios = ["normal", "normal", "normal", "ambient_heat", "compressor_degradation", "compressor_failure"]
        categories = list(PRODUCT_CATALOG.keys())
        
        shipments: List[ShipmentRecord] = []
        for i in range(num_shipments):
            cat = categories[i % len(categories)]
            scen = scenarios[i % len(scenarios)]
            # Stagger base start times
            stagger_hours = random.uniform(1.0, 12.0)
            base_time = datetime.now(timezone.utc) - timedelta(hours=stagger_hours) - timedelta(minutes=points_per_shipment * interval_minutes)
            
            s = self.generate_single_shipment(
                category=cat,
                scenario=scen,
                points_count=points_per_shipment,
                interval_minutes=interval_minutes,
                base_time=base_time
            )
            shipments.append(s)

        return shipments

    @staticmethod
    def generate_live_telemetry_step(
        shipment_dict: Dict[str, Any],
        interval_minutes: int = 15
    ) -> Dict[str, Any]:
        """
        Produces the next chronological telemetry point for a live running shipment.
        Used for streaming simulation or live hourly cron ingestion.
        """
        prev_temp = float(shipment_dict.get("current_temperature", 4.0))
        prev_hum = float(shipment_dict.get("humidity", 50.0))
        category = shipment_dict.get("product_category", "Vaccines")
        status = shipment_dict.get("current_status", "In Transit")

        now = datetime.now(timezone.utc)
        recorded_str = now.strftime("%Y-%m-%d %H:%M UTC")

        # Temperature step
        if status == "Critical Breach":
            temp = round(prev_temp + random.uniform(0.1, 0.4), 2)
            comp_status = "Fault"
        elif status == "Warning":
            temp = round(prev_temp + random.uniform(-0.1, 0.3), 2)
            comp_status = "Warning"
        else:
            temp = round(prev_temp + random.uniform(-0.15, 0.15), 2)
            comp_status = "Normal"

        new_point = {
            "id": str(uuid.uuid4()),
            "shipment_id": shipment_dict["id"],
            "recorded_at": recorded_str,
            "temperature": temp,
            "humidity": round(max(20.0, min(99.0, prev_hum + random.uniform(-1.0, 1.0))), 1),
            "ambient_temperature": round(24.0 + random.uniform(-3.0, 3.0), 1),
            "compressor_status": comp_status,
            "battery": max(10.0, round(float(shipment_dict.get("battery", 90.0)) - 0.2, 1)),
            "latitude": round(float(shipment_dict.get("latitude", 42.0)) + random.uniform(0.01, 0.05), 6),
            "longitude": round(float(shipment_dict.get("longitude", -88.0)) + random.uniform(0.01, 0.05), 6),
            "speed": round(random.uniform(75.0, 95.0), 1)
        }
        return new_point

# ==============================================================================
# 4. EXPORT HELPERS (SQL, JSON)
# ==============================================================================

def export_to_sql(shipments: List[ShipmentRecord], filepath: str):
    """
    Exports generated synthetic shipments, time-series telemetry, and predictions
    to a ready-to-run PostgreSQL / Supabase SQL insert file.
    """
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("-- ==============================================================================\n")
        f.write("-- CRYOFLOW AI: SYNTHETIC COLD-CHAIN TELEMETRY SEED DATA\n")
        f.write(f"-- Generated At: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n")
        f.write(f"-- Total Shipments: {len(shipments)}\n")
        f.write("-- ==============================================================================\n\n")

        # 1. Warehouses reference
        f.write("-- 1. Ensure Warehouses exist\n")
        for wh in WAREHOUSE_SEEDS:
            f.write(
                f"INSERT INTO warehouses (id, code, name, location, total_capacity_pallets, used_capacity_pallets, min_temp_celsius, max_temp_celsius, status, manager) "
                f"VALUES ('{wh['id']}', '{wh['code']}', '{wh['name']}', '{wh['city']}', 5000, 3000, -85.0, 8.0, 'Active', 'Site Manager') "
                f"ON CONFLICT (code) DO NOTHING;\n"
            )
        f.write("\n")

        # 2. Shipments
        f.write("-- 2. Insert Shipments\n")
        for s in shipments:
            notes_esc = s.notes.replace("'", "''")
            rec_esc = s.recommendation.replace("'", "''")
            pname_esc = s.product_name.replace("'", "''")
            f.write(
                f"INSERT INTO shipments (id, tracking_number, warehouse_id, product_category, product_name, quantity, "
                f"shipment_value, origin, destination, current_location, current_temperature, humidity, transit_time_hours, "
                f"estimated_arrival, vehicle_number, current_status, notes, spoilage_risk, health_score, remaining_shelf_life_days, "
                f"estimated_financial_loss, estimated_carbon_impact_kg, recommendation, requires_decision, created_at, updated_at) VALUES ("
                f"'{s.id}', '{s.tracking_number}', '{s.warehouse_id}', '{s.product_category}', '{pname_esc}', {s.quantity}, "
                f"{s.shipment_value}, '{s.origin}', '{s.destination}', '{s.current_location}', {s.current_temperature}, {s.humidity}, "
                f"{s.transit_time_hours}, '{s.estimated_arrival}', '{s.vehicle_number}', '{s.current_status}', '{notes_esc}', "
                f"{s.spoilage_risk}, {s.health_score}, {s.remaining_shelf_life_days}, {s.estimated_financial_loss}, "
                f"{s.estimated_carbon_impact_kg}, '{rec_esc}', {'TRUE' if s.requires_decision else 'FALSE'}, '{s.created_at}', '{s.updated_at}') "
                f"ON CONFLICT (tracking_number) DO UPDATE SET current_temperature = EXCLUDED.current_temperature, spoilage_risk = EXCLUDED.spoilage_risk;\n"
            )
        f.write("\n")

        # 3. Telemetry Logs
        f.write("-- 3. Insert Time-Series Telemetry Logs\n")
        total_points = sum(len(s.telemetry_logs) for s in shipments)
        f.write(f"-- Total telemetry points: {total_points}\n")
        for s in shipments:
            for t in s.telemetry_logs:
                f.write(
                    f"INSERT INTO telemetry_logs (id, shipment_id, recorded_at, temperature, humidity, ambient_temperature, compressor_status, battery, latitude, longitude, speed) "
                    f"VALUES ('{t.id}', '{t.shipment_id}', '{t.recorded_at}', {t.temperature}, {t.humidity}, {t.ambient_temperature}, '{t.compressor_status}', {t.battery}, {t.latitude}, {t.longitude}, {t.speed});\n"
                )
        f.write("\n")

        # 4. AI Predictions
        f.write("-- 4. Insert AI Predictions\n")
        for s in shipments:
            for p in s.predictions:
                ai_rec_esc = p.ai_recommendation.replace("'", "''")
                f.write(
                    f"INSERT INTO ai_predictions (id, shipment_id, predicted_at, current_temp, spoilage_risk_percent, remaining_shelf_life_days, health_score, estimated_financial_loss_usd, estimated_carbon_impact_kg, confidence_score_percent, ai_recommendation) "
                    f"VALUES ('{p.id}', '{p.shipment_id}', '{p.predicted_at}', {p.current_temp}, {p.spoilage_risk_percent}, {p.remaining_shelf_life_days}, {p.health_score}, {p.estimated_financial_loss_usd}, {p.estimated_carbon_impact_kg}, {p.confidence_score_percent}, '{ai_rec_esc}');\n"
                )

    print(f"[PASS] SQL dataset successfully generated and saved to: {filepath}")

def export_to_json(shipments: List[ShipmentRecord], filepath: str):
    """
    Exports full synthetic dataset to a structured JSON document.
    """
    data = []
    for s in shipments:
        s_dict = asdict(s)
        data.append(s_dict)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"[PASS] JSON dataset successfully generated and saved to: {filepath}")

# ==============================================================================
# 5. CLI & MAIN EXECUTION
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="CryoFlow AI Synthetic Cold-Chain Telemetry Generator"
    )
    parser.add_argument("--num-shipments", type=int, default=8, help="Number of shipments to generate (default: 8)")
    parser.add_argument("--points", type=int, default=16, help="Telemetry points per shipment (default: 16)")
    parser.add_argument("--interval", type=int, default=30, help="Interval in minutes between telemetry points (default: 30)")
    parser.add_argument("--scenario", type=str, default="random", choices=["random", "normal", "ambient_heat", "compressor_degradation", "compressor_failure"], help="Excursion scenario (default: random)")
    parser.add_argument("--output-json", type=str, default="data/synthetic_telemetry.json", help="JSON output file path")
    parser.add_argument("--output-sql", type=str, default="supabase/synthetic_seed.sql", help="SQL output file path")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")

    args = parser.parse_args()

    print("=" * 70)
    print("CRYOFLOW AI: SYNTHETIC COLD-CHAIN TELEMETRY GENERATOR")
    print("=" * 70)
    print(f"Generating {args.num_shipments} shipments with {args.points} time-series points each...")
    print(f"Sampling interval: {args.interval} minutes | Scenario mode: {args.scenario}")

    engine = ColdChainSyntheticEngine(seed=args.seed)
    shipments = engine.generate_batch(
        num_shipments=args.num_shipments,
        points_per_shipment=args.points,
        interval_minutes=args.interval
    )

    import os
    os.makedirs(os.path.dirname(args.output_json) or ".", exist_ok=True)
    os.makedirs(os.path.dirname(args.output_sql) or ".", exist_ok=True)

    export_to_json(shipments, args.output_json)
    export_to_sql(shipments, args.output_sql)

    # Print summary of generated items
    print("\n--- SYNTHESIS SUMMARY ---")
    for s in shipments:
        print(f"  * [{s.tracking_number}] {s.product_name} ({s.product_category}) | Status: {s.current_status} | Temp: {s.current_temperature} C | Risk: {s.spoilage_risk}% | Health: {s.health_score}/100 | Points: {len(s.telemetry_logs)}")

    print("\n" + "=" * 70)
    print(f"Successfully generated {len(shipments)} shipments and {sum(len(s.telemetry_logs) for s in shipments)} time-series telemetry records!")
    print("=" * 70)

if __name__ == "__main__":
    main()
