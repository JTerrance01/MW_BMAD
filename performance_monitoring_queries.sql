-- ===================================================================
-- MixWarz Performance Monitoring Queries
-- ===================================================================
-- Use these queries to monitor database performance over time
-- ===================================================================

-- 1. Check slow running queries (requires pg_stat_statements extension)
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 1000  -- Queries taking more than 1 second on average
ORDER BY mean_time DESC
LIMIT 10;

-- 2. Check table sizes and growth
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_tables 
JOIN pg_stat_user_tables ON pg_tables.tablename = pg_stat_user_tables.relname
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 3. Check index usage efficiency
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_tup_read = 0 THEN 'UNUSED'
        WHEN idx_tup_read < 1000 THEN 'LOW_USAGE'
        ELSE 'GOOD_USAGE'
    END as usage_status
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;

-- 4. Check for tables that might need VACUUM
SELECT 
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    CASE 
        WHEN n_live_tup = 0 THEN 0
        ELSE (n_dead_tup::float / n_live_tup::float) * 100
    END as dead_tuple_percentage
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY dead_tuple_percentage DESC;

-- 5. Competition performance metrics
SELECT 
    'Competitions' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN "Status" = 0 THEN 1 END) as upcoming_competitions,
    COUNT(CASE WHEN "Status" = 1 THEN 1 END) as active_competitions,
    COUNT(CASE WHEN "Status" = 4 THEN 1 END) as completed_competitions
FROM public."Competitions";

-- 6. Submission performance metrics
SELECT 
    'Submissions' as table_name,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN "AdvancedToRound2" = true THEN 1 END) as round2_submissions,
    COUNT(CASE WHEN "IsWinner" = true THEN 1 END) as winning_submissions,
    COUNT(CASE WHEN "IsDisqualified" = true THEN 1 END) as disqualified_submissions
FROM public."Submissions";

-- 7. User activity metrics
SELECT 
    'Users' as table_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN "RegistrationDate" > now() - interval '30 days' THEN 1 END) as new_users_30_days,
    COUNT(CASE WHEN "LastLoginDate" > now() - interval '7 days' THEN 1 END) as active_users_7_days,
    COUNT(CASE WHEN "StripeCustomerId" IS NOT NULL THEN 1 END) as paying_customers
FROM public."AspNetUsers";
