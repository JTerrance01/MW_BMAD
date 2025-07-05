#!/bin/bash

# ===================================================================
# MixWarz Performance Optimization Script
# ===================================================================
# This script applies comprehensive performance optimizations to the
# MixWarz application, including database indexes and other optimizations.
# 
# Usage: ./apply_performance_optimizations.sh
# ===================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/performance_indexes.sql"
LOG_FILE="$SCRIPT_DIR/performance_optimization.log"

# Database configuration (can be overridden by environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mixwarz}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}===================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================================${NC}"
}

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to check if PostgreSQL is accessible
check_postgres_connection() {
    print_status "Checking PostgreSQL connection..."
    
    if command -v psql >/dev/null 2>&1; then
        print_status "PostgreSQL client (psql) found"
    else
        print_error "PostgreSQL client (psql) not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    # Test connection
    if [ -n "$DB_PASSWORD" ]; then
        export PGPASSWORD="$DB_PASSWORD"
    fi
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        print_status "Successfully connected to PostgreSQL database"
        log_message "Database connection successful"
    else
        print_error "Failed to connect to PostgreSQL database"
        print_error "Connection details: Host=$DB_HOST, Port=$DB_PORT, Database=$DB_NAME, User=$DB_USER"
        exit 1
    fi
}

# Function to create database backup
create_backup() {
    print_status "Creating database backup before applying optimizations..."
    
    BACKUP_FILE="$SCRIPT_DIR/mixwarz_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if [ -n "$DB_PASSWORD" ]; then
        export PGPASSWORD="$DB_PASSWORD"
    fi
    
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"; then
        print_status "Database backup created: $BACKUP_FILE"
        log_message "Database backup created: $BACKUP_FILE"
    else
        print_error "Failed to create database backup"
        exit 1
    fi
}

# Function to apply database indexes
apply_database_indexes() {
    print_status "Applying database performance indexes..."
    
    if [ ! -f "$SQL_FILE" ]; then
        print_error "SQL file not found: $SQL_FILE"
        exit 1
    fi
    
    if [ -n "$DB_PASSWORD" ]; then
        export PGPASSWORD="$DB_PASSWORD"
    fi
    
    print_status "Executing SQL file: $SQL_FILE"
    log_message "Starting database index application"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE" 2>&1 | tee -a "$LOG_FILE"; then
        print_status "Database indexes applied successfully"
        log_message "Database indexes applied successfully"
    else
        print_error "Failed to apply database indexes"
        log_message "Failed to apply database indexes"
        exit 1
    fi
}

# Function to update PostgreSQL configuration
optimize_postgres_config() {
    print_status "Checking PostgreSQL configuration recommendations..."
    
    # Note: These are recommendations that should be applied to postgresql.conf
    # The actual application depends on the PostgreSQL installation and permissions
    
    cat << EOF

==================================================================
PostgreSQL Configuration Recommendations
==================================================================
Add these settings to your postgresql.conf file for optimal performance:

# Memory Settings
shared_buffers = 256MB                    # 25% of RAM for small to medium databases
effective_cache_size = 1GB                # 75% of RAM
work_mem = 4MB                            # Memory for sort operations
maintenance_work_mem = 64MB               # Memory for maintenance operations

# Connection Settings
max_connections = 200                     # Adjust based on your needs

# Query Planner Settings
random_page_cost = 1.1                    # For SSD storage
effective_io_concurrency = 200            # For SSD storage

# Write Ahead Log Settings
wal_buffers = 16MB                        # Write-ahead log buffer size
checkpoint_completion_target = 0.9        # Checkpoint completion target

# Background Writer Settings
bgwriter_delay = 200ms                    # Background writer delay
bgwriter_lru_maxpages = 100              # Background writer LRU pages

# Logging Settings (for performance monitoring)
log_statement = 'none'                    # Don't log all statements
log_min_duration_statement = 1000         # Log queries taking > 1 second
log_checkpoints = on                      # Log checkpoint activity
log_connections = on                      # Log connections
log_disconnections = on                   # Log disconnections
log_lock_waits = on                       # Log lock waits

After making these changes, restart PostgreSQL:
sudo systemctl restart postgresql

==================================================================

EOF
    
    log_message "PostgreSQL configuration recommendations displayed"
}

# Function to analyze database performance
analyze_database_performance() {
    print_status "Analyzing database performance..."
    
    if [ -n "$DB_PASSWORD" ]; then
        export PGPASSWORD="$DB_PASSWORD"
    fi
    
    # Run VACUUM ANALYZE to update statistics
    print_status "Running VACUUM ANALYZE to update table statistics..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "VACUUM ANALYZE;" 2>&1 | tee -a "$LOG_FILE"
    
    # Check table sizes
    print_status "Checking table sizes..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10;
    " 2>&1 | tee -a "$LOG_FILE"
    
    # Check index usage
    print_status "Checking index usage statistics..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            schemaname,
            tablename,
            indexname,
            idx_tup_read,
            idx_tup_fetch,
            CASE 
                WHEN idx_tup_read = 0 THEN 'UNUSED'
                ELSE 'USED'
            END as usage_status
        FROM pg_stat_user_indexes 
        ORDER BY idx_tup_read DESC
        LIMIT 20;
    " 2>&1 | tee -a "$LOG_FILE"
    
    log_message "Database performance analysis completed"
}

# Function to check .NET application configuration
check_dotnet_config() {
    print_status "Checking .NET application configuration..."
    
    APPSETTINGS_FILE="$SCRIPT_DIR/src/MixWarz.API/appsettings.json"
    
    if [ -f "$APPSETTINGS_FILE" ]; then
        print_status "Found appsettings.json file"
        
        # Check for common performance settings
        if grep -q "CommandTimeout" "$APPSETTINGS_FILE"; then
            print_status "Database command timeout is configured"
        else
            print_warning "Consider adding CommandTimeout to your database connection string"
        fi
        
        if grep -q "Pooling" "$APPSETTINGS_FILE"; then
            print_status "Connection pooling is configured"
        else
            print_warning "Consider enabling connection pooling in your database connection string"
        fi
    else
        print_warning "appsettings.json file not found at expected location"
    fi
    
    cat << EOF

==================================================================
.NET Application Performance Recommendations
==================================================================
1. Connection String Optimizations:
   - Add "Pooling=true" to enable connection pooling
   - Set "CommandTimeout=30" for appropriate timeout
   - Consider "MaxPoolSize=100" for high-traffic applications

2. Entity Framework Optimizations:
   - Use AsNoTracking() for read-only queries
   - Implement proper pagination with Skip/Take
   - Use Select() to fetch only needed columns
   - Consider compiled queries for frequently executed queries

3. Caching Strategies:
   - Implement Redis caching for frequently accessed data
   - Use memory caching for small, frequently accessed data
   - Consider output caching for static content

4. Background Services:
   - Use IHostedService for background tasks
   - Implement proper error handling and logging
   - Consider using Hangfire for complex background jobs

==================================================================

EOF
    
    log_message ".NET application configuration recommendations displayed"
}

# Function to generate performance monitoring queries
generate_monitoring_queries() {
    print_status "Generating performance monitoring queries..."
    
    MONITORING_FILE="$SCRIPT_DIR/performance_monitoring_queries.sql"
    
    cat << 'EOF' > "$MONITORING_FILE"
-- ===================================================================
-- MixWarz Performance Monitoring Queries
-- ===================================================================
-- Use these queries to monitor database performance over time
-- ===================================================================

-- 1. Check slow running queries
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

-- 5. Check database connections
SELECT 
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    CASE 
        WHEN (blks_read + blks_hit) = 0 THEN 0
        ELSE (blks_hit::float / (blks_read + blks_hit)::float) * 100
    END as cache_hit_ratio
FROM pg_stat_database
WHERE datname = 'mixwarz';

-- 6. Check for lock waits
SELECT 
    pg_stat_activity.pid,
    pg_stat_activity.query,
    pg_stat_activity.state,
    pg_stat_activity.wait_event_type,
    pg_stat_activity.wait_event,
    pg_stat_activity.query_start,
    now() - pg_stat_activity.query_start as query_duration
FROM pg_stat_activity
WHERE pg_stat_activity.state != 'idle'
    AND pg_stat_activity.wait_event_type IS NOT NULL
ORDER BY query_duration DESC;

-- 7. Check most active tables
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
ORDER BY (seq_tup_read + idx_tup_fetch) DESC
LIMIT 10;

-- 8. Competition performance metrics
SELECT 
    'Competitions' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN "Status" = 0 THEN 1 END) as upcoming_competitions,
    COUNT(CASE WHEN "Status" = 1 THEN 1 END) as active_competitions,
    COUNT(CASE WHEN "Status" = 4 THEN 1 END) as completed_competitions
FROM public."Competitions";

-- 9. Submission performance metrics
SELECT 
    'Submissions' as table_name,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN "AdvancedToRound2" = true THEN 1 END) as round2_submissions,
    COUNT(CASE WHEN "IsWinner" = true THEN 1 END) as winning_submissions,
    COUNT(CASE WHEN "IsDisqualified" = true THEN 1 END) as disqualified_submissions
FROM public."Submissions";

-- 10. User activity metrics
SELECT 
    'Users' as table_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN "RegistrationDate" > now() - interval '30 days' THEN 1 END) as new_users_30_days,
    COUNT(CASE WHEN "LastLoginDate" > now() - interval '7 days' THEN 1 END) as active_users_7_days,
    COUNT(CASE WHEN "StripeCustomerId" IS NOT NULL THEN 1 END) as paying_customers
FROM public."AspNetUsers";

EOF
    
    print_status "Performance monitoring queries saved to: $MONITORING_FILE"
    log_message "Performance monitoring queries generated"
}

# Main execution function
main() {
    print_header "MixWarz Performance Optimization Script"
    
    # Initialize log file
    echo "=== MixWarz Performance Optimization Log - $(date) ===" > "$LOG_FILE"
    log_message "Performance optimization script started"
    
    # Check if running as root (not recommended for database operations)
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root is not recommended for database operations"
    fi
    
    # Display environment information
    print_status "Environment Information:"
    echo "  - Database Host: $DB_HOST"
    echo "  - Database Port: $DB_PORT"
    echo "  - Database Name: $DB_NAME"
    echo "  - Database User: $DB_USER"
    echo "  - Script Directory: $SCRIPT_DIR"
    echo "  - Log File: $LOG_FILE"
    echo ""
    
    # Execute optimization steps
    check_postgres_connection
    
    # Ask for confirmation before proceeding
    read -p "Do you want to create a database backup before applying optimizations? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_backup
    else
        print_warning "Skipping database backup (not recommended for production)"
    fi
    
    apply_database_indexes
    analyze_database_performance
    optimize_postgres_config
    check_dotnet_config
    generate_monitoring_queries
    
    print_header "Performance Optimization Complete"
    print_status "All optimizations have been applied successfully!"
    print_status "Log file: $LOG_FILE"
    print_status "Monitoring queries: $SCRIPT_DIR/performance_monitoring_queries.sql"
    
    echo ""
    print_status "Next Steps:"
    echo "1. Review the PostgreSQL configuration recommendations above"
    echo "2. Monitor query performance using the generated monitoring queries"
    echo "3. Consider implementing the .NET application optimizations"
    echo "4. Schedule regular VACUUM ANALYZE operations"
    echo "5. Monitor index usage and remove unused indexes if necessary"
    
    log_message "Performance optimization script completed successfully"
}

# Execute main function
main "$@" 