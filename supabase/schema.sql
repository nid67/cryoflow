-- ==============================================================================
-- VALTWAY AI: SUPABASE POSTGRESQL DATABASE SCHEMA
-- Purpose: Cold-Chain Telemetry Monitoring, Kinetic Thermal Spoilage Prediction,
--          and Actionable Decision Support System.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing views and tables if rebuilding
DROP VIEW IF EXISTS view_dashboard_kpis CASCADE;
DROP VIEW IF EXISTS view_route_risk_analytics CASCADE;

DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS decision_actions CASCADE;
DROP TABLE IF EXISTS ai_predictions CASCADE;
DROP TABLE IF EXISTS telemetry_logs CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;

-- ------------------------------------------------------------------------------
-- 1. WAREHOUSES TABLE
-- Stores multi-depot cold storage facility capacities, temperature limits, and status
-- ------------------------------------------------------------------------------
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    total_capacity_pallets INTEGER NOT NULL DEFAULT 0 CHECK (total_capacity_pallets >= 0),
    used_capacity_pallets INTEGER NOT NULL DEFAULT 0 CHECK (used_capacity_pallets >= 0),
    min_temp_celsius NUMERIC(5, 2) NOT NULL,
    max_temp_celsius NUMERIC(5, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Maintenance', 'Full', 'Inactive')),
    manager VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_warehouse_temp_range CHECK (min_temp_celsius <= max_temp_celsius),
    CONSTRAINT chk_warehouse_capacity CHECK (used_capacity_pallets <= total_capacity_pallets)
);

-- ------------------------------------------------------------------------------
-- 2. SHIPMENTS TABLE
-- Primary cold chain cargo tracking with dynamic kinetic risk indicators
-- ------------------------------------------------------------------------------
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    product_category VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    shipment_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (shipment_value >= 0),
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    current_location VARCHAR(255) NOT NULL,
    current_temperature NUMERIC(5, 2) NOT NULL,
    humidity NUMERIC(5, 2) NOT NULL DEFAULT 50.0 CHECK (humidity >= 0 AND humidity <= 100),
    transit_time_hours NUMERIC(8, 2) NOT NULL DEFAULT 0.0 CHECK (transit_time_hours >= 0),
    estimated_arrival TIMESTAMPTZ,
    vehicle_number VARCHAR(100) NOT NULL,
    current_status VARCHAR(50) NOT NULL DEFAULT 'In Transit' 
        CHECK (current_status IN ('In Transit', 'Normal', 'Warning', 'Critical Breach', 'Re-routed', 'Delivered', 'Liquidated')),
    notes TEXT,
    
    -- Dynamic thermal degradation intelligence fields
    spoilage_risk NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (spoilage_risk >= 0 AND spoilage_risk <= 100),
    health_score NUMERIC(5, 2) NOT NULL DEFAULT 100.0 CHECK (health_score >= 0 AND health_score <= 100),
    remaining_shelf_life_days NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (remaining_shelf_life_days >= 0),
    estimated_financial_loss NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (estimated_financial_loss >= 0),
    estimated_carbon_impact_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (estimated_carbon_impact_kg >= 0),
    recommendation TEXT NOT NULL DEFAULT 'Parameters nominal. Maintain current thermal envelope.',
    requires_decision BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. TELEMETRY_LOGS TABLE (Time-Series)
-- High-frequency sensor ingestion for thermal, humidity, compressor, and GPS stream
-- ------------------------------------------------------------------------------
CREATE TABLE telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    temperature NUMERIC(5, 2) NOT NULL,
    humidity NUMERIC(5, 2) NOT NULL CHECK (humidity >= 0 AND humidity <= 100),
    ambient_temperature NUMERIC(5, 2) NOT NULL,
    compressor_status VARCHAR(50) NOT NULL DEFAULT 'Normal' 
        CHECK (compressor_status IN ('Normal', 'Active', 'Warning', 'Fault', 'Off', 'Eco')),
    battery NUMERIC(5, 2) NOT NULL DEFAULT 100.0 CHECK (battery >= 0 AND battery <= 100),
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    speed NUMERIC(6, 2) DEFAULT 0.0 CHECK (speed >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. AI_PREDICTIONS TABLE
-- Kinetic degradation inference audit trail and predictive risk evaluations
-- ------------------------------------------------------------------------------
CREATE TABLE ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_temp NUMERIC(5, 2) NOT NULL,
    spoilage_risk_percent NUMERIC(5, 2) NOT NULL CHECK (spoilage_risk_percent >= 0 AND spoilage_risk_percent <= 100),
    remaining_shelf_life_days NUMERIC(6, 2) NOT NULL CHECK (remaining_shelf_life_days >= 0),
    health_score NUMERIC(5, 2) NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    estimated_financial_loss_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (estimated_financial_loss_usd >= 0),
    estimated_carbon_impact_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (estimated_carbon_impact_kg >= 0),
    confidence_score_percent NUMERIC(5, 2) NOT NULL DEFAULT 95.0 CHECK (confidence_score_percent >= 0 AND confidence_score_percent <= 100),
    ai_recommendation TEXT NOT NULL,
    model_version VARCHAR(50) DEFAULT 'arrhenius-kinetic-v1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. DECISION_ACTIONS TABLE
-- Operational dispatch recovery actions and prescriptive interventions
-- ------------------------------------------------------------------------------
CREATE TABLE decision_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL CHECK (action_type IN (
        'Continue Delivery',
        'Re-route',
        'Nearest Warehouse',
        'Priority Delivery',
        'Secondary Marketplace',
        'Compressor Calibration',
        'Dry Ice Re-charge'
    )),
    action_status VARCHAR(50) NOT NULL DEFAULT 'Executed' CHECK (action_status IN ('Pending', 'In Progress', 'Executed', 'Failed', 'Cancelled')),
    assigned_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    executed_by VARCHAR(255) DEFAULT 'Operational Dispatcher',
    notes TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. ALERTS TABLE
-- Multi-severity thermal excursion, threshold breach, and logistics alert sentinel
-- ------------------------------------------------------------------------------
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    alert_type VARCHAR(100) NOT NULL CHECK (alert_type IN (
        'Temperature Alert',
        'Spoilage Alert',
        'Delay Alert',
        'Warehouse Alert',
        'Risk Alert',
        'Compressor Failure'
    )),
    severity VARCHAR(50) NOT NULL DEFAULT 'High' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES & TIME-SERIES OPTIMIZATIONS
-- ==============================================================================

-- Mandatory time-series index on telemetry_logs
CREATE INDEX idx_telemetry_logs_shipment_recorded_at ON telemetry_logs (shipment_id, recorded_at DESC);

-- Secondary indexing for fast queries, joins, and filters
CREATE INDEX idx_shipments_warehouse_id ON shipments (warehouse_id);
CREATE INDEX idx_shipments_tracking_number ON shipments (tracking_number);
CREATE INDEX idx_shipments_current_status ON shipments (current_status);
CREATE INDEX idx_shipments_spoilage_risk ON shipments (spoilage_risk);
CREATE INDEX idx_shipments_requires_decision ON shipments (requires_decision);

CREATE INDEX idx_ai_predictions_shipment_id ON ai_predictions (shipment_id, predicted_at DESC);
CREATE INDEX idx_decision_actions_shipment_id ON decision_actions (shipment_id, executed_at DESC);
CREATE INDEX idx_alerts_shipment_id ON alerts (shipment_id);
CREATE INDEX idx_alerts_resolved ON alerts (resolved);
CREATE INDEX idx_alerts_severity ON alerts (severity);

-- ==============================================================================
-- AUTOMATIC TIMESTAMP TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_warehouses_updated_at
BEFORE UPDATE ON warehouses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_shipments_updated_at
BEFORE UPDATE ON shipments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- AUTOMATED SENTINEL ALERTS & TELEMETRY PROCESSOR TRIGGER
-- Fires automatically on new telemetry insertion without frontend intervention
-- ==============================================================================
CREATE OR REPLACE FUNCTION trigger_process_telemetry_alert()
RETURNS TRIGGER AS $$
DECLARE
    v_shipment RECORD;
    v_min_temp NUMERIC;
    v_max_temp NUMERIC;
    v_delta NUMERIC := 0.0;
    v_severity VARCHAR(50);
    v_alert_type VARCHAR(100) := 'Temperature Alert';
    v_title VARCHAR(255);
    v_message TEXT;
    v_existing_open_alert_count INT;
BEGIN
    -- 1. Fetch parent shipment information
    SELECT id, tracking_number, warehouse_id, product_category, product_name, current_temperature, current_status
    INTO v_shipment
    FROM shipments
    WHERE id = NEW.shipment_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- 2. Determine category-specific temperature bounds
    IF v_shipment.product_category = 'Vaccines' THEN
        IF NEW.temperature < -50.0 THEN
            v_min_temp := -85.0;
            v_max_temp := -70.0;
        ELSE
            v_min_temp := 2.0;
            v_max_temp := 8.0;
        END IF;
    ELSIF v_shipment.product_category = 'Dairy' THEN
        v_min_temp := 1.0;
        v_max_temp := 4.0;
    ELSIF v_shipment.product_category = 'Quick-Commerce Groceries' THEN
        v_min_temp := 0.5;
        v_max_temp := 3.5;
    ELSIF v_shipment.product_category = 'Biologics' THEN
        v_min_temp := 2.0;
        v_max_temp := 6.0;
    ELSE
        v_min_temp := 2.0;
        v_max_temp := 8.0;
    END IF;

    -- 3. Calculate deviation Delta T
    IF NEW.temperature > v_max_temp THEN
        v_delta := NEW.temperature - v_max_temp;
    ELSIF NEW.temperature < v_min_temp THEN
        v_delta := v_min_temp - NEW.temperature;
    END IF;

    -- 4. Check for compressor failure or thermal excursion
    IF NEW.compressor_status IN ('Fault', 'Off') THEN
        v_severity := 'Critical';
        v_alert_type := 'Compressor Failure';
        v_title := 'CRITICAL COMPRESSOR FAILURE: ' || v_shipment.tracking_number;
        v_message := 'Compressor failure detected on vehicle (' || NEW.compressor_status || 
                     '). Current cargo temp: ' || NEW.temperature || '°C. Immediate action required.';
    ELSIF v_delta > 0 THEN
        IF v_delta >= 4.0 OR (v_shipment.product_category = 'Vaccines' AND v_delta >= 3.0) THEN
            v_severity := 'Critical';
            v_title := 'CRITICAL THERMAL EXCURSION: ' || v_shipment.tracking_number;
        ELSE
            v_severity := 'High';
            v_title := 'TEMPERATURE EXCURSION WARNING: ' || v_shipment.tracking_number;
        END IF;

        v_message := v_shipment.product_name || ' temperature reached ' || NEW.temperature || 
                     '°C (allowed: ' || v_min_temp || '°C to ' || v_max_temp || 
                     '°C). Excursion of +' || ROUND(v_delta, 1) || '°C detected.';
    END IF;

    -- 5. If excursion or failure detected, create alert and update shipment
    IF v_delta > 0 OR NEW.compressor_status IN ('Fault', 'Off') THEN
        -- Check if an unresolved alert with same severity already exists to prevent duplicate flooding
        SELECT COUNT(*)
        INTO v_existing_open_alert_count
        FROM alerts
        WHERE shipment_id = NEW.shipment_id
          AND resolved = FALSE
          AND severity = v_severity;

        IF v_existing_open_alert_count = 0 THEN
            INSERT INTO alerts (
                id,
                shipment_id,
                warehouse_id,
                alert_type,
                severity,
                title,
                message,
                resolved,
                created_at
            ) VALUES (
                gen_random_uuid(),
                NEW.shipment_id,
                v_shipment.warehouse_id,
                v_alert_type,
                v_severity,
                v_title,
                v_message,
                FALSE,
                NEW.recorded_at
            );
        END IF;

        -- Automatically update shipment state
        UPDATE shipments
        SET current_status = CASE 
                WHEN v_shipment.current_status IN ('Delivered', 'Liquidated') THEN v_shipment.current_status
                WHEN v_severity = 'Critical' THEN 'Critical Breach'
                ELSE 'Warning'
            END,
            current_temperature = NEW.temperature,
            humidity = NEW.humidity,
            requires_decision = TRUE,
            updated_at = NEW.recorded_at
        WHERE id = NEW.shipment_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_telemetry_logs_alert ON telemetry_logs;
CREATE TRIGGER trg_telemetry_logs_alert
AFTER INSERT ON telemetry_logs
FOR EACH ROW
EXECUTE FUNCTION trigger_process_telemetry_alert();

-- ==============================================================================
-- ANALYTICS VIEWS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- VIEW 1: view_route_risk_analytics
-- Aggregates shipment risk patterns by transport corridor and product category
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_route_risk_analytics AS
SELECT 
    s.origin,
    s.destination,
    s.product_category,
    COUNT(s.id) AS total_shipments,
    COUNT(CASE WHEN s.current_status IN ('In Transit', 'Normal', 'Warning', 'Critical Breach', 'Re-routed') THEN 1 END) AS active_shipments,
    COUNT(CASE WHEN s.spoilage_risk > 25.0 OR s.current_status IN ('Warning', 'Critical Breach') THEN 1 END) AS breached_shipments,
    ROUND(AVG(s.spoilage_risk)::numeric, 2) AS avg_spoilage_risk,
    ROUND(AVG(s.health_score)::numeric, 2) AS avg_health_score,
    ROUND(SUM(s.estimated_financial_loss)::numeric, 2) AS total_financial_loss_at_risk,
    ROUND(SUM(s.estimated_carbon_impact_kg)::numeric, 2) AS total_carbon_impact_kg,
    ROUND(AVG(s.transit_time_hours)::numeric, 2) AS avg_transit_time_hours,
    CASE 
        WHEN AVG(s.spoilage_risk) >= 50.0 THEN 'Critical'
        WHEN AVG(s.spoilage_risk) >= 25.0 THEN 'High'
        WHEN AVG(s.spoilage_risk) >= 10.0 THEN 'Moderate'
        ELSE 'Low'
    END AS risk_level
FROM shipments s
GROUP BY s.origin, s.destination, s.product_category;

-- ------------------------------------------------------------------------------
-- VIEW 2: view_dashboard_kpis
-- Real-time system-wide KPIs matching the Global Control Center specifications
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_dashboard_kpis AS
SELECT 
    COUNT(s.id) AS total_shipments,
    COUNT(CASE WHEN s.current_status IN ('In Transit', 'Normal', 'Warning', 'Critical Breach', 'Re-routed') THEN 1 END) AS active_shipments,
    COUNT(CASE WHEN s.current_status = 'Delivered' THEN 1 END) AS delivered_shipments,
    COUNT(CASE WHEN s.spoilage_risk > 25.0 THEN 1 END) AS high_risk_shipments,
    COUNT(CASE WHEN s.current_status = 'Critical Breach' OR s.spoilage_risk > 60.0 THEN 1 END) AS critical_breach_shipments,
    COALESCE(SUM(CASE WHEN s.current_status = 'Delivered' OR (s.spoilage_risk < 10.0 AND s.current_status = 'Re-routed') THEN s.quantity ELSE 0 END), 0) AS products_saved_units,
    COALESCE(ROUND(SUM(s.shipment_value)::numeric, 2), 0.00) AS total_shipment_value_managed,
    COALESCE(ROUND(SUM(CASE WHEN s.health_score > 80.0 THEN s.shipment_value * 0.85 ELSE 0 END)::numeric, 2), 0.00) AS estimated_loss_prevented_usd,
    COALESCE(ROUND(SUM(s.estimated_financial_loss)::numeric, 2), 0.00) AS estimated_financial_loss_at_risk,
    COALESCE(ROUND(SUM(CASE WHEN s.health_score > 80.0 THEN s.estimated_carbon_impact_kg * 8.5 ELSE 0 END)::numeric, 2), 0.00) AS total_carbon_saved_kg,
    (SELECT COUNT(*) FROM alerts WHERE resolved = FALSE) AS active_open_alerts,
    (SELECT COUNT(*) FROM alerts WHERE resolved = FALSE AND severity = 'Critical') AS critical_alerts_count,
    COALESCE(ROUND(AVG(s.health_score)::numeric, 2), 100.00) AS avg_fleet_health_score
FROM shipments s;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) FOR SUPABASE
-- Enables RLS and grants full access policies for development and authenticated users
-- ==============================================================================
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on warehouses" ON warehouses FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on warehouses" ON warehouses FOR ALL USING (true);

CREATE POLICY "Allow public read access on shipments" ON shipments FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on shipments" ON shipments FOR ALL USING (true);

CREATE POLICY "Allow public read access on telemetry_logs" ON telemetry_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on telemetry_logs" ON telemetry_logs FOR ALL USING (true);

CREATE POLICY "Allow public read access on ai_predictions" ON ai_predictions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ai_predictions" ON ai_predictions FOR ALL USING (true);

CREATE POLICY "Allow public read access on decision_actions" ON decision_actions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on decision_actions" ON decision_actions FOR ALL USING (true);

CREATE POLICY "Allow public read access on alerts" ON alerts FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on alerts" ON alerts FOR ALL USING (true);
