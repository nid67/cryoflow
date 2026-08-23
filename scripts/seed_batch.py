#!/usr/bin/env python3
"""
Valtway AI - Historical Batch Seeding Engine
============================================
Populates Supabase PostgreSQL with approximately 20-50 realistic cold-chain shipments,
high-frequency time-series telemetry logs, AI kinetic degradation predictions,
historical recovery decisions, and alert records spanning across a 30-day timeline.

Features:
- Configurable shipment volume (default: 35 shipments, 30 days)
- Physics-correlated thermal time-series & GPS route movement
- Deterministic/Idempotent seeding to prevent accidental duplicate data
- Automatic detection of Supabase credentials (SUPABASE_URL, SUPABASE_KEY / SUPABASE_SERVICE_ROLE_KEY)
- Generates idempotent SQL export (supabase/historical_seed.sql) for direct Supabase SQL Editor execution
- Direct database insertion via Supabase Python SDK and standard HTTP REST
"""

import argparse
import json
import os
import sys
import uuid
import math
import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple

# Add root directory to path for importing generator engine
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
try:
    from scripts.generate_synthetic_telemetry import (
        ColdChainSyntheticEngine,
        PRODUCT_CATALOG,
        ROUTES_DATABASE,
        WAREHOUSE_SEEDS,
        ShipmentRecord,
        TelemetryPoint,
        AIPredictionRecord
    )
except ImportError:
    # Fallback import if running from nested directory
    from generate_synthetic_telemetry import (
        ColdChainSyntheticEngine,
        PRODUCT_CATALOG,
        ROUTES_DATABASE,
        WAREHOUSE_SEEDS,
        ShipmentRecord,
        TelemetryPoint,
        AIPredictionRecord
    )

# ==============================================================================
# 1. SEED CONFIGURATION & 30-DAY TIMELINE GENERATOR
# ==============================================================================

class HistoricalSeeder:
    def __init__(self, seed: int = 42):
        self.engine = ColdChainSyntheticEngine(seed=seed)
        random.seed(seed)

    def generate_30_day_dataset(
        self,
        num_shipments: int = 35,
        points_per_shipment: int = 20,
        days_span: int = 30
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Generates shipments distributed across the past 30 days.
        """
        now = datetime.now(timezone.utc)
        categories = list(PRODUCT_CATALOG.keys())
        scenarios = ["normal", "normal", "ambient_heat", "compressor_degradation", "compressor_failure"]

        all_shipments: List[Dict[str, Any]] = []
        all_telemetry: List[Dict[str, Any]] = []
        all_predictions: List[Dict[str, Any]] = []
        all_alerts: List[Dict[str, Any]] = []
        all_decisions: List[Dict[str, Any]] = []

        for i in range(num_shipments):
            # Calculate historical start time across 30 days
            # e.g., i=0 is 29 days ago, i=num_shipments-1 is 2 hours ago
            days_ago = (days_span - 1) * (1.0 - (i / max(1, num_shipments - 1)))
            # Add some jitter to distribute throughout the day
            hours_offset = random.uniform(0.0, 18.0)
            shipment_start_dt = now - timedelta(days=days_ago, hours=hours_offset)

            cat = categories[i % len(categories)]
            scen = scenarios[i % len(scenarios)]

            # Generate shipment with telemetry
            shipment_obj = self.engine.generate_single_shipment(
                category=cat,
                scenario=scen,
                points_count=points_per_shipment,
                interval_minutes=25,
                base_time=shipment_start_dt
            )

            # Determine realistic historical status based on time passed
            transit_duration_hours = (points_per_shipment * 25) / 60.0
            shipment_end_dt = shipment_start_dt + timedelta(hours=transit_duration_hours)
            is_historical = (now - shipment_end_dt).total_seconds() > (6 * 3600) # ended more than 6h ago

            current_status = shipment_obj.current_status
            if is_historical:
                if shipment_obj.spoilage_risk > 70.0:
                    current_status = "Liquidated" if random.random() > 0.4 else "Critical Breach"
                elif shipment_obj.spoilage_risk > 30.0:
                    current_status = "Re-routed" if random.random() > 0.3 else "Delivered"
                else:
                    current_status = "Delivered"

            # Create deterministic UUID based on index for safe re-runs
            shipment_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"valtway.shipment.{i}.{cat}.seed42"))
            tracking_number = f"CRY-{8000 + i}"

            shipment_record = {
                "id": shipment_uuid,
                "tracking_number": tracking_number,
                "warehouse_id": shipment_obj.warehouse_id,
                "product_category": shipment_obj.product_category,
                "product_name": shipment_obj.product_name,
                "quantity": shipment_obj.quantity,
                "shipment_value": shipment_obj.shipment_value,
                "origin": shipment_obj.origin,
                "destination": shipment_obj.destination,
                "current_location": shipment_obj.current_location if not is_historical else f"Delivered at {shipment_obj.destination}",
                "current_temperature": shipment_obj.current_temperature,
                "humidity": shipment_obj.humidity,
                "transit_time_hours": round(transit_duration_hours, 1),
                "estimated_arrival": shipment_obj.estimated_arrival,
                "vehicle_number": shipment_obj.vehicle_number,
                "current_status": current_status,
                "notes": f"Historical batch record [Day -{int(days_ago)}]. {shipment_obj.notes}",
                "spoilage_risk": shipment_obj.spoilage_risk,
                "health_score": shipment_obj.health_score,
                "remaining_shelf_life_days": shipment_obj.remaining_shelf_life_days,
                "estimated_financial_loss": shipment_obj.estimated_financial_loss,
                "estimated_carbon_impact_kg": shipment_obj.estimated_carbon_impact_kg,
                "recommendation": shipment_obj.recommendation,
                "requires_decision": shipment_obj.requires_decision if not is_historical else False,
                "created_at": shipment_start_dt.strftime("%Y-%m-%d %H:%M UTC"),
                "updated_at": shipment_end_dt.strftime("%Y-%m-%d %H:%M UTC")
            }
            all_shipments.append(shipment_record)

            # Telemetry Points
            for t_idx, tel in enumerate(shipment_obj.telemetry_logs):
                tel_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"valtway.telemetry.{shipment_uuid}.{t_idx}"))
                all_telemetry.append({
                    "id": tel_uuid,
                    "shipment_id": shipment_uuid,
                    "recorded_at": tel.recorded_at,
                    "temperature": tel.temperature,
                    "humidity": tel.humidity,
                    "ambient_temperature": tel.ambient_temperature,
                    "compressor_status": tel.compressor_status,
                    "battery": tel.battery,
                    "latitude": tel.latitude,
                    "longitude": tel.longitude,
                    "speed": tel.speed
                })

            # AI Predictions
            for p_idx, pred in enumerate(shipment_obj.predictions):
                pred_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"valtway.prediction.{shipment_uuid}.{p_idx}"))
                all_predictions.append({
                    "id": pred_uuid,
                    "shipment_id": shipment_uuid,
                    "predicted_at": pred.predicted_at,
                    "current_temp": pred.current_temp,
                    "spoilage_risk_percent": pred.spoilage_risk_percent,
                    "remaining_shelf_life_days": pred.remaining_shelf_life_days,
                    "health_score": pred.health_score,
                    "estimated_financial_loss_usd": pred.estimated_financial_loss_usd,
                    "estimated_carbon_impact_kg": pred.estimated_carbon_impact_kg,
                    "confidence_score_percent": pred.confidence_score_percent,
                    "ai_recommendation": pred.ai_recommendation,
                    "model_version": "arrhenius-kinetic-v1.0"
                })

            # Alerts generation (for elevated risk shipments)
            if shipment_obj.spoilage_risk > 25.0:
                alert_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"valtway.alert.{shipment_uuid}"))
                severity = "Critical" if shipment_obj.spoilage_risk > 60.0 else "High"
                resolved = is_historical
                resolved_dt = (shipment_end_dt + timedelta(minutes=45)).strftime("%Y-%m-%d %H:%M UTC") if resolved else None

                all_alerts.append({
                    "id": alert_uuid,
                    "shipment_id": shipment_uuid,
                    "warehouse_id": shipment_obj.warehouse_id,
                    "alert_type": "Temperature Alert" if shipment_obj.spoilage_risk > 50 else "Risk Alert",
                    "severity": severity,
                    "title": f"{'CRITICAL THERMAL EXCURSION' if severity == 'Critical' else 'TEMPERATURE WARNING'}: {tracking_number}",
                    "message": f"{shipment_obj.product_name} temperature reached {shipment_obj.current_temperature} C. Spoilage risk elevated to {shipment_obj.spoilage_risk}%.",
                    "resolved": resolved,
                    "resolved_at": resolved_dt,
                    "resolved_by": "Automated Sentinel" if resolved else None,
                    "created_at": shipment_start_dt.strftime("%Y-%m-%d %H:%M UTC")
                })

            # Decision Actions generation (for re-routed or liquidated historical shipments)
            if current_status in ["Re-routed", "Liquidated"] or shipment_obj.spoilage_risk > 50.0:
                action_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"valtway.decision.{shipment_uuid}"))
                action_type = "Re-route" if current_status == "Re-routed" else "Secondary Marketplace" if current_status == "Liquidated" else "Nearest Warehouse"
                action_dt = (shipment_start_dt + timedelta(hours=transit_duration_hours * 0.7)).strftime("%Y-%m-%d %H:%M UTC")

                all_decisions.append({
                    "id": action_uuid,
                    "shipment_id": shipment_uuid,
                    "action_type": action_type,
                    "action_status": "Executed",
                    "assigned_warehouse_id": shipment_obj.warehouse_id,
                    "executed_by": "Operational Dispatch Lead",
                    "notes": f"Automated decision action executed during Day -{int(days_ago)} transit.",
                    "executed_at": action_dt,
                    "created_at": action_dt
                })

        return all_shipments, all_telemetry, all_predictions, all_alerts, all_decisions

# ==============================================================================
# 2. SQL EXPORT GENERATOR (IDEMPOTENT & DUPLICATE-SAFE)
# ==============================================================================

def generate_sql_script(
    shipments: List[Dict[str, Any]],
    telemetry: List[Dict[str, Any]],
    predictions: List[Dict[str, Any]],
    alerts: List[Dict[str, Any]],
    decisions: List[Dict[str, Any]],
    output_path: str
):
    """
    Generates a PostgreSQL script with ON CONFLICT DO UPDATE clauses to guarantee
    safe, idempotent execution without duplicates.
    """
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("-- ==============================================================================\n")
        f.write("-- VALTWAY AI: 30-DAY HISTORICAL DATA SEED\n")
        f.write(f"-- Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n")
        f.write(f"-- Total Shipments: {len(shipments)} | Telemetry Records: {len(telemetry)}\n")
        f.write("-- ==============================================================================\n\n")

        # 1. Ensure Warehouses Exist
        f.write("-- 1. Seed Warehouses\n")
        for wh in WAREHOUSE_SEEDS:
            f.write(
                f"INSERT INTO warehouses (id, code, name, location, total_capacity_pallets, used_capacity_pallets, min_temp_celsius, max_temp_celsius, status, manager) "
                f"VALUES ('{wh['id']}', '{wh['code']}', '{wh['name']}', '{wh['city']}', 5000, 3200, -85.0, 8.0, 'Active', 'Site Manager') "
                f"ON CONFLICT (code) DO UPDATE SET used_capacity_pallets = EXCLUDED.used_capacity_pallets;\n"
            )
        f.write("\n")

        # 2. Seed Shipments (Upsert by ID and tracking_number)
        f.write("-- 2. Seed 30-Day Shipments\n")
        for s in shipments:
            pname = s["product_name"].replace("'", "''")
            notes = s["notes"].replace("'", "''")
            rec = s["recommendation"].replace("'", "''")
            f.write(
                f"INSERT INTO shipments (id, tracking_number, warehouse_id, product_category, product_name, quantity, "
                f"shipment_value, origin, destination, current_location, current_temperature, humidity, transit_time_hours, "
                f"estimated_arrival, vehicle_number, current_status, notes, spoilage_risk, health_score, remaining_shelf_life_days, "
                f"estimated_financial_loss, estimated_carbon_impact_kg, recommendation, requires_decision, created_at, updated_at) VALUES ("
                f"'{s['id']}', '{s['tracking_number']}', '{s['warehouse_id']}', '{s['product_category']}', '{pname}', {s['quantity']}, "
                f"{s['shipment_value']}, '{s['origin']}', '{s['destination']}', '{s['current_location']}', {s['current_temperature']}, {s['humidity']}, "
                f"{s['transit_time_hours']}, '{s['estimated_arrival']}', '{s['vehicle_number']}', '{s['current_status']}', '{notes}', "
                f"{s['spoilage_risk']}, {s['health_score']}, {s['remaining_shelf_life_days']}, {s['estimated_financial_loss']}, "
                f"{s['estimated_carbon_impact_kg']}, '{rec}', {'TRUE' if s['requires_decision'] else 'FALSE'}, '{s['created_at']}', '{s['updated_at']}') "
                f"ON CONFLICT (id) DO UPDATE SET "
                f"current_status = EXCLUDED.current_status, spoilage_risk = EXCLUDED.spoilage_risk, health_score = EXCLUDED.health_score, updated_at = EXCLUDED.updated_at;\n"
            )
        f.write("\n")

        # 3. Seed Telemetry Logs
        f.write("-- 3. Seed Time-Series Telemetry Logs\n")
        for t in telemetry:
            f.write(
                f"INSERT INTO telemetry_logs (id, shipment_id, recorded_at, temperature, humidity, ambient_temperature, compressor_status, battery, latitude, longitude, speed) "
                f"VALUES ('{t['id']}', '{t['shipment_id']}', '{t['recorded_at']}', {t['temperature']}, {t['humidity']}, {t['ambient_temperature']}, '{t['compressor_status']}', {t['battery']}, {t['latitude']}, {t['longitude']}, {t['speed']}) "
                f"ON CONFLICT (id) DO NOTHING;\n"
            )
        f.write("\n")

        # 4. Seed AI Predictions
        f.write("-- 4. Seed AI Predictions\n")
        for p in predictions:
            ai_rec = p["ai_recommendation"].replace("'", "''")
            f.write(
                f"INSERT INTO ai_predictions (id, shipment_id, predicted_at, current_temp, spoilage_risk_percent, remaining_shelf_life_days, health_score, estimated_financial_loss_usd, estimated_carbon_impact_kg, confidence_score_percent, ai_recommendation, model_version) "
                f"VALUES ('{p['id']}', '{p['shipment_id']}', '{p['predicted_at']}', {p['current_temp']}, {p['spoilage_risk_percent']}, {p['remaining_shelf_life_days']}, {p['health_score']}, {p['estimated_financial_loss_usd']}, {p['estimated_carbon_impact_kg']}, {p['confidence_score_percent']}, '{ai_rec}', '{p['model_version']}') "
                f"ON CONFLICT (id) DO NOTHING;\n"
            )
        f.write("\n")

        # 5. Seed Alerts
        f.write("-- 5. Seed Alerts\n")
        for a in alerts:
            title = a["title"].replace("'", "''")
            msg = a["message"].replace("'", "''")
            res_at_val = f"'{a['resolved_at']}'" if a["resolved_at"] else "NULL"
            res_by_val = f"'{a['resolved_by']}'" if a["resolved_by"] else "NULL"
            f.write(
                f"INSERT INTO alerts (id, shipment_id, warehouse_id, alert_type, severity, title, message, resolved, resolved_at, resolved_by, created_at) "
                f"VALUES ('{a['id']}', '{a['shipment_id']}', '{a['warehouse_id']}', '{a['alert_type']}', '{a['severity']}', '{title}', '{msg}', {'TRUE' if a['resolved'] else 'FALSE'}, {res_at_val}, {res_by_val}, '{a['created_at']}') "
                f"ON CONFLICT (id) DO NOTHING;\n"
            )
        f.write("\n")

        # 6. Seed Decision Actions
        f.write("-- 6. Seed Decision Actions\n")
        for d in decisions:
            notes = d["notes"].replace("'", "''")
            f.write(
                f"INSERT INTO decision_actions (id, shipment_id, action_type, action_status, assigned_warehouse_id, executed_by, notes, executed_at, created_at) "
                f"VALUES ('{d['id']}', '{d['shipment_id']}', '{d['action_type']}', '{d['action_status']}', '{d['assigned_warehouse_id']}', '{d['executed_by']}', '{notes}', '{d['executed_at']}', '{d['created_at']}') "
                f"ON CONFLICT (id) DO NOTHING;\n"
            )

    print(f"[PASS] Idempotent SQL historical seed file created at: {output_path}")

# ==============================================================================
# 3. DIRECT SUPABASE REST INSERTION
# ==============================================================================

def push_to_supabase_rest(
    url: str,
    key: str,
    shipments: List[Dict[str, Any]],
    telemetry: List[Dict[str, Any]],
    predictions: List[Dict[str, Any]],
    alerts: List[Dict[str, Any]],
    decisions: List[Dict[str, Any]]
):
    """
    Pushes data directly to Supabase via REST API if credentials are provided.
    """
    try:
        from supabase import create_client, Client
        client: Client = create_client(url, key)

        print("\n--- PUSHING TO LIVE SUPABASE INSTANCE ---")
        
        # 1. Warehouses
        for wh in WAREHOUSE_SEEDS:
            client.table("warehouses").upsert({
                "id": wh["id"],
                "code": wh["code"],
                "name": wh["name"],
                "location": wh["city"],
                "total_capacity_pallets": 5000,
                "used_capacity_pallets": 3200,
                "min_temp_celsius": -85.0,
                "max_temp_celsius": 8.0,
                "status": "Active",
                "manager": "Site Manager"
            }).execute()

        # 2. Shipments
        print(f"Upserting {len(shipments)} shipments...")
        for s in shipments:
            client.table("shipments").upsert(s).execute()

        # 3. Telemetry Logs (Batch in chunks of 50)
        print(f"Inserting {len(telemetry)} telemetry records...")
        chunk_size = 50
        for i in range(0, len(telemetry), chunk_size):
            chunk = telemetry[i:i + chunk_size]
            client.table("telemetry_logs").upsert(chunk).execute()

        # 4. AI Predictions
        print(f"Inserting {len(predictions)} predictions...")
        for i in range(0, len(predictions), chunk_size):
            chunk = predictions[i:i + chunk_size]
            client.table("ai_predictions").upsert(chunk).execute()

        # 5. Alerts
        if alerts:
            print(f"Inserting {len(alerts)} alerts...")
            client.table("alerts").upsert(alerts).execute()

        # 6. Decision Actions
        if decisions:
            print(f"Inserting {len(decisions)} decision actions...")
            client.table("decision_actions").upsert(decisions).execute()

        print("[PASS] Direct Supabase push completed successfully!")
    except Exception as e:
        print(f"[WARN] Live Supabase push encountered an issue: {e}")
        print("Note: You can execute the generated 'supabase/historical_seed.sql' directly in the Supabase SQL Editor.")

# ==============================================================================
# 4. CLI ENTRY POINT
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Valtway AI - Historical 30-Day Batch Seeding Engine"
    )
    parser.add_argument("--num-shipments", type=int, default=35, help="Number of shipments to generate (default: 35, recommended: 20-50)")
    parser.add_argument("--points", type=int, default=20, help="Historical telemetry records per shipment (default: 20)")
    parser.add_argument("--days", type=int, default=30, help="Span of historical timeline in days (default: 30)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducible deterministic IDs")
    parser.add_argument("--output-sql", type=str, default="supabase/historical_seed.sql", help="Output SQL script file")
    parser.add_argument("--output-json", type=str, default="data/historical_batch.json", help="Output JSON dataset file")

    args = parser.parse_args()

    print("=" * 70)
    print("VALTWAY AI: HISTORICAL 30-DAY BATCH SEEDING")
    print("=" * 70)
    print(f"Target: {args.num_shipments} shipments across a {args.days}-day historical timeline.")
    print(f"Telemetry density: {args.points} time-series points per shipment.")
    print("Idempotency: Deterministic UUID generation enabled (Safe against duplicates).")

    seeder = HistoricalSeeder(seed=args.seed)
    shipments, telemetry, predictions, alerts, decisions = seeder.generate_30_day_dataset(
        num_shipments=args.num_shipments,
        points_per_shipment=args.points,
        days_span=args.days
    )

    # Ensure output directories exist
    os.makedirs(os.path.dirname(args.output_sql) or ".", exist_ok=True)
    os.makedirs(os.path.dirname(args.output_json) or ".", exist_ok=True)

    # Export SQL file
    generate_sql_script(shipments, telemetry, predictions, alerts, decisions, args.output_sql)

    # Export JSON file
    dataset = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            "shipments_count": len(shipments),
            "telemetry_count": len(telemetry),
            "predictions_count": len(predictions),
            "alerts_count": len(alerts),
            "decisions_count": len(decisions),
            "timeline_days": args.days
        },
        "shipments": shipments,
        "telemetry_logs": telemetry,
        "ai_predictions": predictions,
        "alerts": alerts,
        "decision_actions": decisions
    }
    with open(args.output_json, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    print(f"[PASS] Historical JSON archive created at: {args.output_json}")

    # Check if Supabase environment variables are present for direct live push
    sb_url = os.environ.get("SUPABASE_URL")
    sb_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    if sb_url and sb_key:
        push_to_supabase_rest(sb_url, sb_key, shipments, telemetry, predictions, alerts, decisions)
    else:
        print("\n[INFO] Live Supabase credentials not detected in environment variables.")
        print("       The generated SQL script 'supabase/historical_seed.sql' is fully prepared")
        print("       for one-click execution inside your Supabase SQL Editor.")

    # Final Summary Report
    print("\n" + "=" * 70)
    print("HISTORICAL SEEDING SUMMARY REPORT")
    print("=" * 70)
    print(f"* Number of shipments created:          {len(shipments)}")
    print(f"* Number of telemetry records created:   {len(telemetry)}")
    print(f"* Number of predictions created:        {len(predictions)}")
    print(f"* Number of alerts created:             {len(alerts)}")
    print(f"* Number of decision actions created:   {len(decisions)}")
    print(f"* Historical span covered:              {args.days} Days")
    print("=" * 70)

if __name__ == "__main__":
    main()
