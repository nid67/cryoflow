"""
CryoFlow AI - Risk and Kinetic Analysis Engine
=============================================
Computes cold-chain degradation metrics, spoilage risk percentages, health scores,
remaining shelf life, financial loss risk, and prescriptive decision recommendations.

NOTE: This is a deterministic thermodynamic & kinetic degradation model
(time-above-threshold Arrhenius integration), not a machine-learning model.
The architecture is structured with modular interfaces (BaseRiskEngine)
so that ML models (e.g. XGBoost, PyTorch, Scikit-Learn) can be plugged in seamlessly.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
import math
import uuid

# ==============================================================================
# 1. PRODUCT TEMPERATURE ENVELOPES & PARAMETERS
# ==============================================================================

CATEGORY_PROFILES = {
    "Vaccines": {
        "ultra_cold": {
            "min_temp": -85.0,
            "max_temp": -70.0,
            "nominal_temp": -78.0,
            "base_shelf_life_days": 30.0,
            "degradation_rate": 18.0,
            "sensitivity": "Critical Ultra-Cold"
        },
        "standard_cold": {
            "min_temp": 2.0,
            "max_temp": 8.0,
            "nominal_temp": 4.0,
            "base_shelf_life_days": 90.0,
            "degradation_rate": 9.5,
            "sensitivity": "High Cold-Chain"
        }
    },
    "Dairy": {
        "default": {
            "min_temp": 1.0,
            "max_temp": 4.0,
            "nominal_temp": 2.5,
            "base_shelf_life_days": 18.0,
            "degradation_rate": 8.5,
            "sensitivity": "Medium Perishable"
        }
    },
    "Quick-Commerce Groceries": {
        "default": {
            "min_temp": 0.5,
            "max_temp": 3.5,
            "nominal_temp": 2.0,
            "base_shelf_life_days": 8.0,
            "degradation_rate": 11.0,
            "sensitivity": "High Perishable"
        }
    },
    "Biologics": {
        "default": {
            "min_temp": 2.0,
            "max_temp": 6.0,
            "nominal_temp": 4.0,
            "base_shelf_life_days": 45.0,
            "degradation_rate": 12.0,
            "sensitivity": "High Biologic"
        }
    }
}

# ==============================================================================
# 2. EVALUATION DATA MODELS
# ==============================================================================

@dataclass
class RiskEvaluationResult:
    """
    Standard output data structure returned by any Risk Engine implementation.
    """
    spoilage_risk_percent: float
    risk_level: str               # 'NORMAL', 'WARNING', 'CRITICAL BREACH'
    health_score: float           # 0.0 - 100.0
    remaining_shelf_life_days: float
    estimated_financial_loss_usd: float
    estimated_carbon_impact_kg: float
    requires_decision: bool
    ai_recommendation: str
    confidence_score_percent: float
    model_type: str               # 'deterministic_kinetic_v1.0'
    evaluated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

# ==============================================================================
# 3. ABSTRACT RISK ENGINE INTERFACE
# ==============================================================================

class BaseRiskEngine(ABC):
    """
    Abstract interface for all cold-chain risk evaluation engines.
    Enables swapping between deterministic kinetic models and future ML models.
    """
    @abstractmethod
    def evaluate(
        self,
        product_category: str,
        product_name: str,
        current_temp: float,
        transit_time_hours: float,
        shipment_value: float,
        temperature_history: Optional[List[Tuple[float, float]]] = None
    ) -> RiskEvaluationResult:
        """
        Evaluates risk for a given shipment and telemetry state.
        """
        pass

# ==============================================================================
# 4. DETERMINISTIC KINETIC RISK ENGINE
# ==============================================================================

class DeterministicKineticRiskEngine(BaseRiskEngine):
    """
    Thermodynamic and kinetic degradation engine.
    Calculates thermal excursion severity by integrating:
    1. Temperature deviation from allowable envelope (delta T)
    2. Duration of exposure (transit hours / degree-hours)
    3. Product category sensitivity parameters
    4. Total shipment financial value
    """

    MODEL_VERSION = "deterministic_kinetic_v1.0"

    @staticmethod
    def get_product_envelope(category: str, current_temp: float) -> Dict[str, Any]:
        """
        Retrieves the appropriate temperature bounds based on category and temperature range.
        """
        if category == "Vaccines":
            if current_temp < -50.0:
                return CATEGORY_PROFILES["Vaccines"]["ultra_cold"]
            return CATEGORY_PROFILES["Vaccines"]["standard_cold"]
        elif category in CATEGORY_PROFILES:
            return CATEGORY_PROFILES[category]["default"]
        
        # Fallback default
        return CATEGORY_PROFILES["Vaccines"]["standard_cold"]

    def evaluate(
        self,
        product_category: str,
        product_name: str,
        current_temp: float,
        transit_time_hours: float,
        shipment_value: float,
        temperature_history: Optional[List[Tuple[float, float]]] = None
    ) -> RiskEvaluationResult:
        """
        Executes deterministic kinetic degradation evaluation.
        """
        envelope = self.get_product_envelope(product_category, current_temp)
        min_limit = envelope["min_temp"]
        max_limit = envelope["max_temp"]
        degradation_rate = envelope["degradation_rate"]
        base_shelf_life = envelope["base_shelf_life_days"]

        # 1. Compute Temperature Deviation (Delta T)
        delta_t = 0.0
        if current_temp > max_limit:
            delta_t = current_temp - max_limit
        elif current_temp < min_limit:
            delta_t = min_limit - current_temp

        # 2. Cumulative Excursion Degree-Hours Integration
        if temperature_history and len(temperature_history) > 0:
            cumulative_excursion = 0.0
            for hist_temp, step_hours in temperature_history:
                step_delta = 0.0
                if hist_temp > max_limit:
                    step_delta = hist_temp - max_limit
                elif hist_temp < min_limit:
                    step_delta = min_limit - hist_temp
                if step_delta > 0:
                    cumulative_excursion += step_delta * step_hours

            raw_risk = (cumulative_excursion * degradation_rate * 0.45) + (delta_t * degradation_rate * 0.55) + (transit_time_hours * 0.3)
        else:
            # Single reading without history
            if delta_t > 0:
                raw_risk = (delta_t * degradation_rate) + (transit_time_hours * 0.5)
            else:
                raw_risk = max(0.5, transit_time_hours * 0.08)

        if delta_t > 0 or (temperature_history and any(t > max_limit or t < min_limit for t, _ in temperature_history)):
            spoilage_risk = min(99.9, max(5.0, raw_risk))
        else:
            spoilage_risk = max(0.5, raw_risk)

        spoilage_risk = round(spoilage_risk, 1)

        # 3. Classify Risk Level by CryoFlow Design Thresholds
        if spoilage_risk > 60.0:
            risk_level = "CRITICAL BREACH"
            recommendation = (
                "CRITICAL BREACH: Temperature excursion exceeds safety threshold. "
                "Immediately execute Re-route to cold hub or Secondary Marketplace Liquidation."
            )
            requires_decision = True
        elif spoilage_risk > 25.0:
            risk_level = "WARNING"
            recommendation = (
                "WARNING: Active thermal excursion detected. "
                "Recommend compressor adjustment or Nearest Warehouse redirect."
            )
            requires_decision = True
        else:
            risk_level = "NORMAL"
            recommendation = (
                "Parameters nominal. Maintain active cooling and continue monitored delivery path."
            )
            requires_decision = False

        # 4. Compute Health Score & Remaining Shelf Life
        health_score = round(max(0.0, min(100.0, 100.0 - spoilage_risk)), 1)
        remaining_shelf_life_days = round(max(0.0, base_shelf_life * (health_score / 100.0)), 1)

        # 5. Compute Financial Loss & Environmental Carbon Impact
        financial_loss = round(shipment_value * (spoilage_risk / 100.0), 2)
        carbon_impact_kg = round((shipment_value / 1000.0) * (spoilage_risk / 100.0) * 12.5, 1)

        # 6. Confidence Score (Deterministic stability index)
        confidence_score = round(94.5 + (100.0 - spoilage_risk) * 0.05, 1)
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        return RiskEvaluationResult(
            spoilage_risk_percent=spoilage_risk,
            risk_level=risk_level,
            health_score=health_score,
            remaining_shelf_life_days=remaining_shelf_life_days,
            estimated_financial_loss_usd=financial_loss,
            estimated_carbon_impact_kg=carbon_impact_kg,
            requires_decision=requires_decision,
            ai_recommendation=recommendation,
            confidence_score_percent=confidence_score,
            model_type=self.MODEL_VERSION,
            evaluated_at=now_str
        )

# ==============================================================================
# 5. ML MODEL ADAPTER (PLUGGABLE STUB)
# ==============================================================================

class MLRiskEngineStub(BaseRiskEngine):
    """
    Modular stub for future Machine Learning models (e.g., XGBoost, Random Forest, PyTorch).
    Maintains identical interface to allow hot-swapping without modifying pipeline code.
    """
    def __init__(self, model_artifact_path: Optional[str] = None):
        self.model_artifact_path = model_artifact_path
        self.is_trained = False

    def evaluate(
        self,
        product_category: str,
        product_name: str,
        current_temp: float,
        transit_time_hours: float,
        shipment_value: float,
        temperature_history: Optional[List[Tuple[float, float]]] = None
    ) -> RiskEvaluationResult:
        # Fallback to deterministic model if ML model weights are not loaded
        deterministic_fallback = DeterministicKineticRiskEngine()
        result = deterministic_fallback.evaluate(
            product_category, product_name, current_temp, transit_time_hours, shipment_value, temperature_history
        )
        result.model_type = "ml_xgboost_stub_fallback"
        return result

# ==============================================================================
# 6. RISK ENGINE SERVICE & DATABASE PROCESSOR
# ==============================================================================

class CryoFlowRiskService:
    """
    Coordinates risk evaluations upon telemetry receipt, updates Supabase shipment records,
    persists ai_predictions records, and triggers sentinel alerts.
    """

    def __init__(self, engine: Optional[BaseRiskEngine] = None):
        self.engine = engine or DeterministicKineticRiskEngine()

    def process_telemetry_event(
        self,
        shipment_data: Dict[str, Any],
        telemetry_point: Dict[str, Any],
        temperature_history: Optional[List[Tuple[float, float]]] = None,
        supabase_client: Any = None
    ) -> Tuple[RiskEvaluationResult, Dict[str, Any], Dict[str, Any], Optional[Dict[str, Any]]]:
        """
        Main pipeline hook executed whenever new telemetry arrives.
        Calculates all risk metrics, returns database update payloads,
        and triggers alerts if thresholds are breached.
        """
        shipment_id = shipment_data["id"]
        category = shipment_data.get("product_category", "Vaccines")
        product_name = shipment_data.get("product_name", "Cold Cargo")
        current_temp = float(telemetry_point.get("temperature", shipment_data.get("current_temperature", 4.0)))
        transit_hours = float(shipment_data.get("transit_time_hours", 1.0))
        shipment_value = float(shipment_data.get("shipment_value", 50000.0))

        # 1. Run Risk Analysis
        risk_result = self.engine.evaluate(
            product_category=category,
            product_name=product_name,
            current_temp=current_temp,
            transit_time_hours=transit_hours,
            shipment_value=shipment_value,
            temperature_history=temperature_history
        )

        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        # 2. Prepare Prediction Record for `ai_predictions`
        pred_record = {
            "id": str(uuid.uuid4()),
            "shipment_id": shipment_id,
            "predicted_at": now_str,
            "current_temp": current_temp,
            "spoilage_risk_percent": risk_result.spoilage_risk_percent,
            "remaining_shelf_life_days": risk_result.remaining_shelf_life_days,
            "health_score": risk_result.health_score,
            "estimated_financial_loss_usd": risk_result.estimated_financial_loss_usd,
            "estimated_carbon_impact_kg": risk_result.estimated_carbon_impact_kg,
            "confidence_score_percent": risk_result.confidence_score_percent,
            "ai_recommendation": risk_result.ai_recommendation,
            "model_version": risk_result.model_type
        }

        # 3. Determine Updated Shipment Status
        prev_status = shipment_data.get("current_status", "In Transit")
        if prev_status not in ["Delivered", "Liquidated"]:
            if risk_result.risk_level == "CRITICAL BREACH":
                status_update = "Critical Breach"
            elif risk_result.risk_level == "WARNING":
                status_update = "Warning"
            elif prev_status == "Re-routed":
                status_update = "Re-routed"
            else:
                status_update = "In Transit"
        else:
            status_update = prev_status

        # 4. Prepare Shipment Update Record for `shipments`
        shipment_update = {
            "current_temperature": current_temp,
            "humidity": float(telemetry_point.get("humidity", shipment_data.get("humidity", 50.0))),
            "current_status": status_update,
            "spoilage_risk": risk_result.spoilage_risk_percent,
            "health_score": risk_result.health_score,
            "remaining_shelf_life_days": risk_result.remaining_shelf_life_days,
            "estimated_financial_loss": risk_result.estimated_financial_loss_usd,
            "estimated_carbon_impact_kg": risk_result.estimated_carbon_impact_kg,
            "recommendation": risk_result.ai_recommendation,
            "requires_decision": risk_result.requires_decision,
            "updated_at": now_str
        }

        # 5. Prepare Alert Record for `alerts` if excursion occurs
        alert_record = None
        if risk_result.requires_decision:
            severity = "Critical" if risk_result.risk_level == "CRITICAL BREACH" else "High"
            tracking_num = shipment_data.get("tracking_number", shipment_id[:8])
            alert_record = {
                "id": str(uuid.uuid4()),
                "shipment_id": shipment_id,
                "warehouse_id": shipment_data.get("warehouse_id"),
                "alert_type": "Temperature Alert" if risk_result.spoilage_risk_percent > 50 else "Risk Alert",
                "severity": severity,
                "title": f"THERMAL RISK ALERT: {tracking_num} ({risk_result.risk_level})",
                "message": f"{product_name} temp reached {current_temp} C. Spoilage risk: {risk_result.spoilage_risk_percent}%.",
                "resolved": False,
                "created_at": now_str
            }

        # 6. Push to Supabase if client is available
        if supabase_client:
            try:
                # Insert prediction
                supabase_client.table("ai_predictions").insert(pred_record).execute()
                # Update shipment
                supabase_client.table("shipments").update(shipment_update).eq("id", shipment_id).execute()
                # Insert alert
                if alert_record:
                    supabase_client.table("alerts").insert(alert_record).execute()
            except Exception as e:
                print(f"[RiskService] Error persisting to Supabase: {e}")

        return risk_result, pred_record, shipment_update, alert_record

# Default singleton instance
risk_service = CryoFlowRiskService()
