-- ==============================================================================
-- VALTWAY AI: SUPABASE SEED DATA
-- Purpose: Initial telemetry data, active shipments, prediction logs,
--          decision action history, and alerts.
-- ==============================================================================

-- 1. SEED WAREHOUSES
INSERT INTO warehouses (id, code, name, location, total_capacity_pallets, used_capacity_pallets, min_temp_celsius, max_temp_celsius, status, manager)
VALUES 
    ('e0b5f101-1111-4000-8000-000000000101', 'WH-101', 'Frankfurt Cold Hub & Hub Logistics', 'Frankfurt Airport, Germany', 5000, 3850, -85.0, 8.0, 'Active', 'Hans Mueller'),
    ('e0b5f102-2222-4000-8000-000000000102', 'WH-102', 'Chicago Central Refrigerated Depot', 'Chicago IL, USA', 8000, 6200, -25.0, 5.0, 'Active', 'Sarah Jenkins'),
    ('e0b5f103-3333-4000-8000-000000000103', 'WH-103', 'Boston Biologics Distribution Center', 'Boston MA, USA', 3500, 3100, -90.0, 4.0, 'Active', 'David Miller'),
    ('e0b5f104-4444-4000-8000-000000000104', 'WH-104', 'London Heathrow Cold Freight Facility', 'London, United Kingdom', 4000, 1900, -20.0, 10.0, 'Active', 'Emma Watson')
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, location = EXCLUDED.location;

-- 2. SEED SHIPMENTS
INSERT INTO shipments (
    id, tracking_number, warehouse_id, product_category, product_name, quantity, 
    shipment_value, origin, destination, current_location, current_temperature, 
    humidity, transit_time_hours, estimated_arrival, vehicle_number, current_status, 
    spoilage_risk, health_score, remaining_shelf_life_days, estimated_financial_loss, 
    estimated_carbon_impact_kg, recommendation, requires_decision, notes
) VALUES
(
    'c7a10001-0001-4000-8000-000000008842', 'CRY-8842', 'e0b5f103-3333-4000-8000-000000000103',
    'Vaccines', 'mRNA COVID-19 Ultra-Cold Vaccines', 50000, 1250000.00,
    'Frankfurt (FRA)', 'Boston (BOS)', 'Mid-Atlantic Air Corridor (FL380)', -78.2,
    42.0, 6.5, NOW() + INTERVAL '4 hours', 'LH-CARGO-774', 'Normal',
    1.2, 98.8, 24.5, 15000.00, 18.8,
    'Parameters nominal. Maintain current ultra-cold refrigeration protocol.', FALSE,
    'High priority clinical supply chain.'
),
(
    'c7a10002-0002-4000-8000-000000009104', 'CRY-9104', 'e0b5f102-2222-4000-8000-000000000102',
    'Dairy', 'Organic Pasteurized Whole Milk & Butter', 12000, 48000.00,
    'Madison, WI', 'Chicago, IL', 'I-90 Southbound (Near Rockford)', 7.4,
    78.0, 3.8, NOW() + INTERVAL '1.5 hours', 'TRK-MIDWEST-99', 'Warning',
    34.8, 65.2, 16.3, 16704.00, 20.9,
    'WARNING: Temperature excursion detected (+7.4°C). Recommend compressor boost or nearest cold depot redirect.', TRUE,
    'Secondary cooling unit struggling under heatwave.'
),
(
    'c7a10003-0003-4000-8000-000000007719', 'CRY-7719', 'e0b5f104-4444-4000-8000-000000000104',
    'Vaccines', 'Pediatric Polio & MMR Vaccines', 15000, 320000.00,
    'Basel, Switzerland', 'London, UK', 'Calais Cross-Channel Transit Hub', 9.8,
    65.0, 14.2, NOW() + INTERVAL '3 hours', 'EU-EXPRESS-104', 'Critical Breach',
    82.5, 17.5, 4.4, 264000.00, 33.0,
    'CRITICAL BREACH: Temperature reached +9.8°C for >14h. Emergency diversion to nearest cold hub mandatory.', TRUE,
    'Reefer door seal compromised during customs inspection.'
),
(
    'c7a10004-0004-4000-8000-000000006301', 'CRY-6301', 'e0b5f102-2222-4000-8000-000000000102',
    'Quick-Commerce Groceries', 'Premium Hydroponic Strawberries & Greens', 3200, 18500.00,
    'Salinas, CA', 'Denver, CO', 'I-80 Eastbound (Salt Lake Sector)', 8.1,
    88.0, 18.0, NOW() + INTERVAL '6 hours', 'COLD-RUNNER-42', 'Warning',
    49.6, 50.4, 12.6, 9176.00, 11.5,
    'WARNING: Ambient thermal breach. Suggest liquid nitrogen recharge or secondary market clearance.', TRUE,
    'Driver reported reefer intermittent power drop.'
),
(
    'c7a10005-0005-4000-8000-000000005049', 'CRY-5049', 'e0b5f102-2222-4000-8000-000000000102',
    'Biologics', 'Clinical Trial Monoclonal Antibodies', 2500, 890000.00,
    'Indianapolis, IN', 'Dallas, TX', 'Dallas Logistics Park Gateway', 4.1,
    45.0, 19.5, NOW() - INTERVAL '30 minutes', 'AIR-FREIGHT-901', 'Delivered',
    2.1, 97.9, 24.5, 18690.00, 23.4,
    'Shipment successfully received in full cold compliance at Dallas Hub.', FALSE,
    'All temperature compliance logs verified.'
),
(
    'c7a10006-0006-4000-8000-000000004190', 'CRY-4190', 'e0b5f101-1111-4000-8000-000000000101',
    'Vaccines', 'Influenza Quadrivalent Vaccines', 20000, 450000.00,
    'Anchorage, AK', 'Seattle, WA', 'Redirected to Chicago Central Cold Hub', 3.8,
    48.0, 8.0, NOW() + INTERVAL '2 hours', 'PACIFIC-COLD-88', 'Re-routed',
    2.5, 96.0, 24.0, 11250.00, 14.1,
    'ACTION EXECUTED: Rerouted to Chicago Central Cold Hub. Thermal equilibrium restored.', FALSE,
    'Re-route initiated at 08:30 UTC.'
)
ON CONFLICT (tracking_number) DO UPDATE 
SET current_temperature = EXCLUDED.current_temperature,
    spoilage_risk = EXCLUDED.spoilage_risk,
    health_score = EXCLUDED.health_score;

-- 3. SEED TIME-SERIES TELEMETRY LOGS
INSERT INTO telemetry_logs (
    shipment_id, recorded_at, temperature, humidity, ambient_temperature, 
    compressor_status, battery, latitude, longitude, speed
) VALUES
-- CRY-8842 Telemetry
('c7a10001-0001-4000-8000-000000008842', NOW() - INTERVAL '6 hours', -78.5, 41.0, -10.0, 'Normal', 98.0, 50.0379, 8.5622, 850.0),
('c7a10001-0001-4000-8000-000000008842', NOW() - INTERVAL '4 hours', -78.1, 41.5, -8.0, 'Normal', 96.0, 53.1200, 0.5000, 840.0),
('c7a10001-0001-4000-8000-000000008842', NOW() - INTERVAL '2 hours', -78.3, 42.0, -5.0, 'Normal', 95.0, 52.5000, -30.0000, 860.0),
('c7a10001-0001-4000-8000-000000008842', NOW(), -78.2, 42.0, -4.0, 'Normal', 94.0, 48.0000, -50.0000, 855.0),

-- CRY-9104 Telemetry
('c7a10002-0002-4000-8000-000000009104', NOW() - INTERVAL '3 hours', 3.2, 72.0, 24.0, 'Normal', 80.0, 43.0731, -89.4012, 95.0),
('c7a10002-0002-4000-8000-000000009104', NOW() - INTERVAL '2 hours', 4.8, 75.0, 28.0, 'Warning', 74.0, 42.7000, -89.0000, 92.0),
('c7a10002-0002-4000-8000-000000009104', NOW() - INTERVAL '1 hour', 6.5, 77.0, 31.0, 'Warning', 68.0, 42.4000, -88.5000, 88.0),
('c7a10002-0002-4000-8000-000000009104', NOW(), 7.4, 78.0, 32.5, 'Fault', 62.0, 42.2711, -89.0940, 85.0),

-- CRY-7719 Telemetry
('c7a10003-0003-4000-8000-000000007719', NOW() - INTERVAL '8 hours', 3.5, 55.0, 18.0, 'Normal', 90.0, 47.5596, 7.5886, 90.0),
('c7a10003-0003-4000-8000-000000007719', NOW() - INTERVAL '5 hours', 6.2, 60.0, 22.0, 'Warning', 78.0, 49.0000, 4.0000, 88.0),
('c7a10003-0003-4000-8000-000000007719', NOW() - INTERVAL '2 hours', 8.5, 63.0, 25.0, 'Fault', 60.0, 50.5000, 2.5000, 75.0),
('c7a10003-0003-4000-8000-000000007719', NOW(), 9.8, 65.0, 26.0, 'Fault', 52.0, 50.9513, 1.8587, 0.0);

-- 4. SEED AI PREDICTIONS
INSERT INTO ai_predictions (
    shipment_id, predicted_at, current_temp, spoilage_risk_percent, 
    remaining_shelf_life_days, health_score, estimated_financial_loss_usd, 
    estimated_carbon_impact_kg, confidence_score_percent, ai_recommendation
) VALUES
(
    'c7a10001-0001-4000-8000-000000008842', NOW(), -78.2, 1.2, 
    24.5, 98.8, 15000.00, 18.8, 98.5,
    'Parameters nominal. Maintain current ultra-cold refrigeration protocol.'
),
(
    'c7a10002-0002-4000-8000-000000009104', NOW(), 7.4, 34.8, 
    16.3, 65.2, 16704.00, 20.9, 96.2,
    'WARNING: Temperature excursion detected (+7.4°C). Recommend compressor boost or nearest cold depot redirect.'
),
(
    'c7a10003-0003-4000-8000-000000007719', NOW(), 9.8, 82.5, 
    4.4, 17.5, 264000.00, 33.0, 97.4,
    'CRITICAL BREACH: Temperature reached +9.8°C for >14h. Emergency diversion to nearest cold hub mandatory.'
);

-- 5. SEED DECISION ACTIONS
INSERT INTO decision_actions (
    shipment_id, action_type, action_status, assigned_warehouse_id, 
    executed_by, notes, executed_at
) VALUES
(
    'c7a10006-0006-4000-8000-000000004190', 'Re-route', 'Executed',
    'e0b5f102-2222-4000-8000-000000000102', 'Hans Mueller (Dispatch Lead)',
    'Emergency diversion executed. Carrier directed to WH-102 (Chicago Depot).',
    NOW() - INTERVAL '4 hours'
);

-- 6. SEED ALERTS
INSERT INTO alerts (
    shipment_id, warehouse_id, alert_type, severity, title, message, resolved, created_at
) VALUES
(
    'c7a10003-0003-4000-8000-000000007719', 'e0b5f104-4444-4000-8000-000000000104',
    'Temperature Alert', 'Critical', 'CRITICAL BREACH: CRY-7719',
    'Pediatric Polio & MMR Vaccines temperature elevated to +9.8°C. Immediate cold storage diversion mandatory.',
    FALSE, NOW() - INTERVAL '1 hour'
),
(
    'c7a10002-0002-4000-8000-000000009104', 'e0b5f102-2222-4000-8000-000000000102',
    'Temperature Alert', 'High', 'EXCURSION WARNING: CRY-9104',
    'Organic Dairy temperature reached +7.4°C. Threshold breached by +3.4°C.',
    FALSE, NOW() - INTERVAL '45 minutes'
),
(
    'c7a10006-0006-4000-8000-000000004190', 'e0b5f102-2222-4000-8000-000000000102',
    'Risk Alert', 'Medium', 'REROUTE RESOLVED: CRY-4190',
    'Shipment CRY-4190 re-routed successfully to WH-102. Thermal baseline restored to +3.8°C.',
    TRUE, NOW() - INTERVAL '4 hours'
);
