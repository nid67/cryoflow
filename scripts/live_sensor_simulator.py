#!/usr/bin/env python3
"""
CryoFlow AI - Live Hourly IoT Cold-Chain Telemetry Simulator
============================================================
Simulates continuous, real-time IoT sensor telemetry streams for active shipments.
Generates NEW telemetry records ONCE EVERY 1 HOUR (default: 3600 seconds).

Active shipment statuses monitored:
- 'In Transit'
- 'Warning'
- 'Re-routed'

For each active shipment cycle:
1. Generates new temperature, humidity, ambient temp, compressor status, battery, speed, and GPS position.
2. Inserts exactly 1 new telemetry_logs record.
3. Updates shipment current_temperature, current_location, updated_at, and risk scores.
4. Executes kinetic degradation risk analysis and records AI predictions.
5. Emits critical alerts if thermal thresholds are breached.
6. Waits for the configured interval before the next cycle.

Configuration:
- SIMULATOR_INTERVAL_SECONDS (default: 3600)
- DEMO_MODE (if set to true or via --demo flag, allows shorter intervals for testing)
"""

import argparse
import json
import math
import os
import random
import signal
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple

# Add root directory to path for importing domain models and physics engine
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
try:
    from scripts.generate_synthetic_telemetry import (
        ColdChainSyntheticEngine,
        PRODUCT_CATALOG,
        ROUTES_DATABASE,
        WAREHOUSE_SEEDS
    )
except ImportError:
    from generate_synthetic_telemetry import (
        ColdChainSyntheticEngine,
        PRODUCT_CATALOG,
        ROUTES_DATABASE,
        WAREHOUSE_SEEDS
    )

# ==============================================================================
# 1. ENVIRONMENT & INTERVAL CONFIGURATION
# ==============================================================================

# Default production interval is strictly 1 HOUR (3600 seconds)
DEFAULT_INTERVAL_SECONDS = 3600

def get_configured_interval(args_interval: Optional[int] = None, is_demo: bool = False) -> int:
    """
    Resolves the execution interval:
    1. CLI argument --interval if explicitly passed.
    2. DEMO_MODE / --demo default (30s) if demo mode requested.
    3. Environment variable SIMULATOR_INTERVAL_SECONDS.
    4. Default production interval: 3600 seconds (1 hour).
    """
    if args_interval is not None and args_interval > 0:
        return args_interval

    env_interval = os.environ.get("SIMULATOR_INTERVAL_SECONDS")
    if env_interval:
        try:
            val = int(env_interval)
            if val > 0:
                return val
        except ValueError:
            pass

    env_demo = os.environ.get("DEMO_MODE", "").lower() in ["1", "true", "yes"]
    if is_demo or env_demo:
        return 30 # Short 30-second interval for live testing/demo purposes

    return DEFAULT_INTERVAL_SECONDS

def format_duration(seconds: int) -> str:
    if seconds >= 3600:
        hrs = seconds / 3600.0
        return f"{int(hrs)} hour{'s' if hrs != 1 else ''}" if hrs.is_integer() else f"{hrs:.1f} hours"
    elif seconds >= 60:
        mins = seconds / 60.0
        return f"{int(mins)} minute{'s' if mins != 1 else ''}"
    else:
        return f"{seconds} second{'s' if seconds != 1 else ''}"

# ==============================================================================
# 2. LIVE SIMULATOR ENGINE
# ==============================================================================

class LiveColdChainSimulator:
    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
        dry_run: bool = False,
        force_excursion: Optional[str] = None
    ):
        self.supabase_url = supabase_url or os.environ.get("SUPABASE_URL")
        self.supabase_key = supabase_key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
        self.dry_run = dry_run
        self.force_excursion = force_excursion
        self.client = None
        self.running = True

        if not self.dry_run and self.supabase_url and self.supabase_key:
            try:
                from supabase import create_client
                self.client = create_client(self.supabase_url, self.supabase_key)
                print("[SIMULATOR] Connected to live Supabase PostgreSQL backend.")
            except Exception as e:
                print(f"[SIMULATOR] Supabase client initialization warning: {e}")
                self.client = None
        else:
            if not self.dry_run:
                print("[SIMULATOR] Live Supabase credentials not found. Running in standalone local simulation mode.")

    def fetch_active_shipments(self) -> List[Dict[str, Any]]:
        """
        Retrieves all shipments with active statuses ('In Transit', 'Warning', 'Re-routed').
        """
        active_statuses = ["In Transit", "Warning", "Re-routed"]

        if self.client:
            try:
                res = self.client.table("shipments").select("*").in_("current_status", active_statuses).execute()
                if res.data:
                    return res.data
            except Exception as e:
                print(f"[SIMULATOR] Error fetching active shipments from Supabase: {e}")

        # Fallback to local dataset from historical seed or default active fleet
        local_seed_file = "data/historical_batch.json"
        if os.path.exists(local_seed_file):
            try:
                with open(local_seed_file, "r", encoding="utf-8") as f:
                    batch = json.load(f)
                    shipments = batch.get("shipments", [])
                    active = [s for s in shipments if s.get("current_status") in active_statuses]
                    if active:
                        return active
            except Exception:
                pass

        # In-memory realistic fallback shipments if no database or file is present
        return [
            {
                "id": "c7a10001-0001-4000-8000-000000008842",
                "tracking_number": "CRY-8842",
                "warehouse_id": "e0b5f101-1111-4000-8000-000000000101",
                "product_category": "Vaccines",
                "product_name": "mRNA COVID-19 Ultra-Cold Vaccines",
                "quantity": 50000,
                "shipment_value": 1250000.0,
                "origin": "Delhi",
                "destination": "Mumbai",
                "current_location": "Jaipur",
                "current_temperature": -78.2,
                "humidity": 42.0,
                "transit_time_hours": 6.5,
                "vehicle_number": "DL-COLD-774",
                "current_status": "In Transit",
                "spoilage_risk": 1.2,
                "health_score": 98.8,
                "remaining_shelf_life_days": 24.5,
                "estimated_financial_loss": 15000.0,
                "estimated_carbon_impact_kg": 18.8,
                "recommendation": "Parameters nominal.",
                "requires_decision": False
            },
            {
                "id": "c7a10002-0002-4000-8000-000000009104",
                "tracking_number": "CRY-9104",
                "warehouse_id": "e0b5f102-2222-4000-8000-000000000102",
                "product_category": "Dairy",
                "product_name": "Organic Pasteurized Whole Milk & Butter",
                "quantity": 12000,
                "shipment_value": 48000.0,
                "origin": "Pune",
                "destination": "Chennai",
                "current_location": "Hyderabad",
                "current_temperature": 7.4,
                "humidity": 78.0,
                "transit_time_hours": 3.8,
                "vehicle_number": "MH-REEFER-99",
                "current_status": "Warning",
                "spoilage_risk": 34.8,
                "health_score": 65.2,
                "remaining_shelf_life_days": 16.3,
                "estimated_financial_loss": 16704.0,
                "estimated_carbon_impact_kg": 20.9,
                "recommendation": "Excursion detected (+7.4 C). Compressor boost required.",
                "requires_decision": True
            },
            {
                "id": "c7a10006-0006-4000-8000-000000004190",
                "tracking_number": "CRY-4190",
                "warehouse_id": "e0b5f103-3333-4000-8000-000000000103",
                "product_category": "Vaccines",
                "product_name": "Influenza Quadrivalent Vaccines",
                "quantity": 20000,
                "shipment_value": 450000.0,
                "origin": "Kolkata",
                "destination": "Delhi",
                "current_location": "Lucknow",
                "current_temperature": 3.8,
                "humidity": 48.0,
                "transit_time_hours": 8.0,
                "vehicle_number": "WB-FREIGHT-88",
                "current_status": "Re-routed",
                "spoilage_risk": 2.5,
                "health_score": 96.0,
                "remaining_shelf_life_days": 24.0,
                "estimated_financial_loss": 11250.0,
                "estimated_carbon_impact_kg": 14.1,
                "recommendation": "Re-route action active. Baseline restoring.",
                "requires_decision": False
            }
        ]

    def simulate_telemetry_tick(
        self,
        shipment: Dict[str, Any],
        step_hours: float = 1.0
    ) -> Tuple[Dict[str, Any], Dict[str, Any], Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Computes next chronological telemetry point and updated shipment metrics.
        """
        now = datetime.now(timezone.utc)
        recorded_str = now.strftime("%Y-%m-%d %H:%M UTC")

        shipment_id = shipment["id"]
        tracking_num = shipment.get("tracking_number", "CRY-XXXX")
        category = shipment.get("product_category", "Vaccines")
        current_status = shipment.get("current_status", "In Transit")
        prev_temp = float(shipment.get("current_temperature", 4.0))
        prev_hum = float(shipment.get("humidity", 50.0))
        transit_hours = float(shipment.get("transit_time_hours", 0.0)) + step_hours

        # Lookup route bounds & config
        catalog = PRODUCT_CATALOG.get(category, PRODUCT_CATALOG["Vaccines"])
        product_cfg = next((p for p in catalog if p["name"] == shipment.get("product_name")), catalog[0])
        min_limit = product_cfg["min_temp"]
        max_limit = product_cfg["max_temp"]

        # Route coordinates
        route = next((r for r in ROUTES_DATABASE if r["origin"] == shipment.get("origin")), ROUTES_DATABASE[0])
        orig_lat, orig_lon = route["origin_coords"]
        dest_lat, dest_lon = route["destination_coords"]
        total_route_hours = max(1.0, route["transit_hours"])

        # Progress calculation
        progress = min(1.0, transit_hours / total_route_hours)
        lat = round(orig_lat + progress * (dest_lat - orig_lat) + random.uniform(-0.015, 0.015), 6)
        lon = round(orig_lon + progress * (dest_lon - orig_lon) + random.uniform(-0.015, 0.015), 6)
        speed = round(max(0.0, route["avg_speed_kmh"] + random.uniform(-6.0, 6.0)), 1) if progress < 1.0 else 0.0

        # Ambient temperature (diurnal solar wave)
        hour_of_day = now.hour + (now.minute / 60.0)
        ambient_base = 22.0 if route["mode"] != "Air Freight" else -15.0
        diurnal_wave = math.sin((hour_of_day - 9.0) * math.pi / 12.0) * 7.5
        ambient_temp = round(ambient_base + diurnal_wave + random.uniform(-1.0, 1.0), 1)

        # Dynamic thermal physics calculation
        new_temp = prev_temp
        compressor_status = "Normal"
        battery = max(8.0, round(float(shipment.get("battery", 90.0)) - random.uniform(0.15, 0.45) * step_hours, 1))

        if current_status == "Re-routed":
            # Re-routed: active diversion cooling restores safe baseline
            compressor_status = "Active"
            target = product_cfg["nominal_temp"]
            if new_temp > target:
                new_temp -= random.uniform(0.3, 0.8)
            elif new_temp < target:
                new_temp += random.uniform(0.3, 0.8)

        elif current_status == "Warning":
            # Excursion ongoing
            compressor_status = "Warning" if random.random() > 0.3 else "Active"
            ambient_stress = max(0.0, (ambient_temp - max_limit) * 0.04)
            new_temp += random.uniform(0.1, 0.35) + ambient_stress

        elif current_status == "Critical Breach":
            # Compressor failure
            compressor_status = "Fault"
            temp_gap = ambient_temp - new_temp
            new_temp += (temp_gap * 0.08) + random.uniform(0.2, 0.5)

        else: # Normal / In Transit
            compressor_status = "Normal" if random.random() > 0.2 else "Active"
            new_temp += random.uniform(-0.15, 0.15)
            # Natural thermal damping
            if new_temp > max_limit:
                new_temp -= 0.2
            elif new_temp < min_limit:
                new_temp += 0.2

        # --- Inject Forced Excursion ---
        if self.force_excursion and (shipment_id == self.force_excursion or tracking_num == self.force_excursion):
            new_temp += 20.0 # Extreme jump
            compressor_status = "Fault"
        # -------------------------------

        new_temp = round(new_temp, 2)
        new_humidity = round(max(20.0, min(99.0, prev_hum + random.uniform(-0.8, 0.8))), 1)

        # Recalculate degradation metrics
        delta = max(0.0, new_temp - max_limit) + max(0.0, min_limit - new_temp)
        if delta > 0:
            spoilage_risk = min(99.9, max(5.0, (delta * product_cfg["degradation_rate"]) + (transit_hours * 0.5)))
        else:
            spoilage_risk = max(0.5, transit_hours * 0.08)

        spoilage_risk = round(spoilage_risk, 1)
        health_score = round(max(0.0, min(100.0, 100.0 - spoilage_risk)), 1)
        remaining_shelf_life_days = round(max(0.0, product_cfg["base_shelf_life_days"] * (health_score / 100.0)), 1)
        shipment_value = float(shipment.get("shipment_value", 50000.0))
        financial_loss = round(shipment_value * (spoilage_risk / 100.0), 2)
        carbon_impact_kg = round((shipment_value / 1000.0) * (spoilage_risk / 100.0) * 12.5, 1)

        requires_decision = spoilage_risk > 25.0
        if spoilage_risk > 60.0:
            status_update = "Critical Breach"
            recommendation = "CRITICAL BREACH: Temperature excursion exceeds safe threshold. Immediately execute Re-route to cold hub or Secondary Marketplace Liquidation."
        elif spoilage_risk > 25.0:
            status_update = "Warning"
            recommendation = "WARNING: Active thermal excursion detected. Recommend compressor boost or nearest warehouse diversion."
        elif current_status == "Re-routed":
            status_update = "Re-routed"
            recommendation = "ACTION EXECUTED: Rerouted to cold depot. Thermal equilibrium restored."
        elif progress >= 1.0:
            status_update = "Delivered"
            recommendation = "Shipment arrived at destination in compliance."
        else:
            status_update = "In Transit"
            recommendation = "Parameters nominal. Maintain active cooling and continue monitored delivery path."

        # Location name
        if progress >= 1.0:
            location_str = f"Delivered at {route['destination']}"
        elif progress > 0.7:
            location_str = f"Approach corridor to {route['destination']}"
        elif progress > 0.4:
            location_str = f"Midway transit corridor ({route['mode']})"
        else:
            location_str = f"Outbound corridor from {route['origin']}"

        # 1. Telemetry Point
        telemetry_record = {
            "id": str(uuid.uuid4()),
            "shipment_id": shipment_id,
            "recorded_at": recorded_str,
            "temperature": new_temp,
            "humidity": new_humidity,
            "ambient_temperature": ambient_temp,
            "compressor_status": compressor_status,
            "battery": battery,
            "latitude": lat,
            "longitude": lon,
            "speed": speed
        }

        # 2. Updated Shipment Record
        updated_shipment = {
            "current_temperature": new_temp,
            "humidity": new_humidity,
            "current_location": location_str,
            "transit_time_hours": round(transit_hours, 1),
            "current_status": status_update,
            "spoilage_risk": spoilage_risk,
            "health_score": health_score,
            "remaining_shelf_life_days": remaining_shelf_life_days,
            "estimated_financial_loss": financial_loss,
            "estimated_carbon_impact_kg": carbon_impact_kg,
            "recommendation": recommendation,
            "requires_decision": requires_decision,
            "updated_at": recorded_str
        }

        # 3. AI Prediction Record
        pred_record = {
            "id": str(uuid.uuid4()),
            "shipment_id": shipment_id,
            "predicted_at": recorded_str,
            "current_temp": new_temp,
            "spoilage_risk_percent": spoilage_risk,
            "remaining_shelf_life_days": remaining_shelf_life_days,
            "health_score": health_score,
            "estimated_financial_loss_usd": financial_loss,
            "estimated_carbon_impact_kg": carbon_impact_kg,
            "confidence_score_percent": round(94.0 + (100.0 - spoilage_risk) * 0.05, 1),
            "ai_recommendation": recommendation,
            "model_version": "arrhenius-kinetic-v1.0"
        }

        # 4. Alert Record (if excursion triggered)
        alert_record = None
        if requires_decision:
            severity = "Critical" if spoilage_risk > 60.0 else "High"
            alert_record = {
                "id": str(uuid.uuid4()),
                "shipment_id": shipment_id,
                "warehouse_id": shipment.get("warehouse_id"),
                "alert_type": "Temperature Alert" if spoilage_risk > 50 else "Risk Alert",
                "severity": severity,
                "title": f"LIVE SENSOR ALERT: {tracking_num}",
                "message": f"Real-time reading: {new_temp} C. Spoilage risk escalated to {spoilage_risk}%. Action required.",
                "resolved": False,
                "created_at": recorded_str
            }

        return telemetry_record, updated_shipment, pred_record, alert_record

    def execute_live_cycle(self, interval_seconds: int):
        """
        Executes a single hourly cycle across all active shipments.
        """
        active_shipments = self.fetch_active_shipments()
        print(f"\n[SIMULATOR] Starting telemetry cycle at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}...")
        print(f"[SIMULATOR] Active monitored fleet count: {len(active_shipments)}")

        step_hours = max(0.1, interval_seconds / 3600.0)

        for shipment in active_shipments:
            tracking_num = shipment.get("tracking_number", "CRY-XXXX")
            tel_point, ship_update, pred_point, alert = self.simulate_telemetry_tick(shipment, step_hours=step_hours)

            # Console logging
            print(f"[SIMULATOR] Shipment {tracking_num} -> Temp: {tel_point['temperature']} C | Status: {ship_update['current_status']} | Risk: {ship_update['spoilage_risk']}%")

            if self.client and not self.dry_run:
                try:
                    # 1. Insert exactly 1 new telemetry record
                    self.client.table("telemetry_logs").insert(tel_point).execute()
                    # 2. Update shipment
                    self.client.table("shipments").update(ship_update).eq("id", shipment["id"]).execute()
                    # 3. Insert AI prediction
                    self.client.table("ai_predictions").insert(pred_point).execute()
                    # 4. Insert alert if triggered
                    if alert:
                        self.client.table("alerts").insert(alert).execute()
                    print(f"[SIMULATOR] Telemetry inserted successfully for {tracking_num}")
                except Exception as e:
                    print(f"[SIMULATOR] Supabase insertion error for {tracking_num}: {e}")
            else:
                print(f"[SIMULATOR] Telemetry inserted successfully (Local Simulation)")

        print(f"[SIMULATOR] Next sensor cycle in {format_duration(interval_seconds)}")

    def run_continuous(self, interval_seconds: int, max_cycles: Optional[int] = None):
        """
        Main continuous simulation loop.
        """
        print("=" * 70)
        print("CRYOFLOW AI: LIVE IOT COLD-CHAIN TELEMETRY SIMULATOR")
        print("=" * 70)
        print(f"Cycle interval: {interval_seconds} seconds ({format_duration(interval_seconds)})")
        print(f"Next sensor cycle in {format_duration(interval_seconds)}")
        print("Press Ctrl+C to gracefully stop the simulator.\n")

        cycle_count = 0
        while self.running:
            try:
                cycle_count += 1
                self.execute_live_cycle(interval_seconds)

                if max_cycles is not None and cycle_count >= max_cycles:
                    print(f"\n[SIMULATOR] Reached maximum requested cycles ({max_cycles}). Exiting.")
                    break

                # Sleep until next cycle, checking for interrupt
                sleep_chunk = 1.0
                slept = 0.0
                while self.running and slept < interval_seconds:
                    time.sleep(sleep_chunk)
                    slept += sleep_chunk

            except KeyboardInterrupt:
                print("\n[SIMULATOR] Stopping live sensor simulator...")
                self.running = False
                break
            except Exception as e:
                print(f"[SIMULATOR] Error in simulation cycle: {e}")
                time.sleep(5)

# ==============================================================================
# 3. CLI & SIGNAL HANDLING
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="CryoFlow AI - Live Hourly IoT Cold-Chain Telemetry Simulator"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=None,
        help=f"Simulator cycle interval in seconds (default: 3600 / 1 hour)"
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Enable DEMO_MODE (uses 30-second interval for testing)"
    )
    parser.add_argument(
        "--cycles",
        type=int,
        default=None,
        help="Number of simulation cycles to execute before stopping (default: run indefinitely)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate telemetry but DO NOT push to Supabase."
    )
    parser.add_argument(
        "--force-excursion",
        type=str,
        default=None,
        help="Shipment ID (or tracking number) to force an extreme temperature excursion on."
    )
    args = parser.parse_args()

    # Determine interval
    interval = get_configured_interval(args_interval=args.interval, is_demo=args.demo)
    
    # Initialize engine
    simulator = LiveColdChainSimulator(dry_run=args.dry_run, force_excursion=args.force_excursion)
    
    print("==========================================================")
    print("      CRYOFLOW AI - LIVE HOURLY SENSOR SIMULATOR")
    print("==========================================================")

    # Graceful exit handler
    def handle_sig(sig, frame):
        print("\n[SIMULATOR] Received termination signal. Shutting down cleanly...")
        simulator.running = False
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_sig)
    signal.signal(signal.SIGTERM, handle_sig)

    simulator.run_continuous(interval_seconds=interval, max_cycles=args.cycles)

if __name__ == "__main__":
    main()
