#!/usr/bin/env python3
"""
Valtway AI - Risk & Kinetic Degradation Evaluation CLI
======================================================
CLI tool to test and evaluate risk metrics for a cold chain shipment.
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.risk_engine import DeterministicKineticRiskEngine

def main():
    parser = argparse.ArgumentParser(
        description="Valtway AI - Risk & Kinetic Degradation Evaluator"
    )
    parser.add_argument("--category", type=str, default="Vaccines", choices=["Vaccines", "Dairy", "Quick-Commerce Groceries", "Biologics"], help="Product category")
    parser.add_argument("--name", type=str, default="Clinical Vaccines", help="Product name")
    parser.add_argument("--temp", type=float, required=True, help="Current temperature in Celsius")
    parser.add_argument("--hours", type=float, default=6.0, help="Transit exposure time in hours")
    parser.add_argument("--value", type=float, default=250000.0, help="Shipment value in USD")

    args = parser.parse_args()

    engine = DeterministicKineticRiskEngine()
    result = engine.evaluate(
        product_category=args.category,
        product_name=args.name,
        current_temp=args.temp,
        transit_time_hours=args.hours,
        shipment_value=args.value
    )

    print("=" * 60)
    print(f"VALTWAY RISK EVALUATION: {args.name} ({args.category})")
    print("=" * 60)
    print(f"* Current Temperature:         {args.temp} C")
    print(f"* Transit Exposure Duration:   {args.hours} Hours")
    print(f"* Shipment Financial Value:    ${args.value:,.2f}")
    print("-" * 70)
    print(f"* Spoilage Risk:               {result.spoilage_risk_percent}%")
    print(f"* Risk Level Classification:   {result.risk_level}")
    print(f"* Health / Freshness Score:    {result.health_score} / 100")
    print(f"* Remaining Shelf Life:        {result.remaining_shelf_life_days} Days")
    print(f"* Estimated Financial Loss:    ${result.estimated_financial_loss_usd:,.2f}")
    print(f"* Estimated Carbon Footprint:  {result.estimated_carbon_impact_kg} kg CO2e")
    print(f"* Requires Operator Decision:  {result.requires_decision}")
    print(f"* Prescriptive Recommendation: {result.ai_recommendation}")
    print(f"* Evaluation Model:            {result.model_type}")
    print("=" * 70)

if __name__ == "__main__":
    main()
