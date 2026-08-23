-- ==============================================================================
-- VALTWAY AI: AUTOMATED SENTINEL ALERTS TRIGGER (POSTGRESQL / SUPABASE)
-- Migration: 20260819000001_automated_alerts_trigger.sql
-- Purpose: Automatically creates alerts and updates shipment status when
--          telemetry breaches thermal thresholds or compressor fails.
-- ==============================================================================

-- 1. Create the PL/pgSQL Alert Processing Trigger Function
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
    -- 1. Fetch parent shipment details
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

-- 2. Attach Trigger to telemetry_logs table
DROP TRIGGER IF EXISTS trg_telemetry_logs_alert ON telemetry_logs;
CREATE TRIGGER trg_telemetry_logs_alert
AFTER INSERT ON telemetry_logs
FOR EACH ROW
EXECUTE FUNCTION trigger_process_telemetry_alert();
