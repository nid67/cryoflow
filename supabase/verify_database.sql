-- ==============================================================================
-- VALTWAY AI: SUPABASE VERIFICATION SCRIPT (PostgreSQL)
-- Execute this script in the Supabase SQL Editor to verify the deployment.
-- ==============================================================================

-- 1. VERIFY ALL 6 TABLES EXIST
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('warehouses', 'shipments', 'telemetry_logs', 'ai_predictions', 'decision_actions', 'alerts')
ORDER BY table_name;

-- 2. VERIFY FOREIGN KEYS
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 3. VERIFY INDEXES (Including Mandatory Telemetry Time-Series Index)
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('warehouses', 'shipments', 'telemetry_logs', 'ai_predictions', 'decision_actions', 'alerts')
ORDER BY tablename, indexname;

-- 4. VERIFY AUTOMATED ALERT TRIGGERS
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('telemetry_logs', 'shipments', 'warehouses')
ORDER BY event_object_table, trigger_name;

-- 5. VERIFY ANALYTICS VIEWS
SELECT 
    table_name AS view_name, 
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('view_route_risk_analytics', 'view_dashboard_kpis');

-- 6. TEST QUERY ON ANALYTICS VIEWS
SELECT * FROM view_dashboard_kpis;
SELECT * FROM view_route_risk_analytics;
