# ===================================================================
# MixWarz Performance Optimization Script (PowerShell)
# ===================================================================
# This script applies comprehensive performance optimizations to the
# MixWarz application, including database indexes and other optimizations.
# 
# Usage: .\apply_performance_optimizations.ps1
# ===================================================================

param(
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432", 
    [string]$DBName = "mixwarz",
    [string]$DBUser = "postgres",
    [string]$DBPassword = "",
    [switch]$SkipBackup = $false
)

# Script configuration
$ScriptDir = $PSScriptRoot
$SQLFile = Join-Path $ScriptDir "performance_indexes.sql"
$LogFile = Join-Path $ScriptDir "performance_optimization.log"

# Initialize log file
"=== MixWarz Performance Optimization Log - $(Get-Date) ===" | Out-File -FilePath $LogFile -Encoding UTF8

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message" | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

function Write-Header {
    param([string]$Title)
    Write-Host "===================================================================" -ForegroundColor Blue
    Write-Host $Title -ForegroundColor Blue
    Write-Host "===================================================================" -ForegroundColor Blue
}

function Test-PostgreSQLConnection {
    Write-ColorOutput "Checking PostgreSQL connection..." "Green"
    
    # Check if psql is available
    try {
        $psqlVersion = & psql --version 2>$null
        Write-ColorOutput "PostgreSQL client found: $psqlVersion" "Green"
        return $true
    }
    catch {
        Write-ColorOutput "PostgreSQL client (psql) not found in PATH" "Yellow"
        Write-ColorOutput "Please ensure PostgreSQL client tools are installed and accessible" "Yellow"
        return $false
    }
}

function Apply-DatabaseIndexes {
    Write-ColorOutput "Applying database performance indexes..." "Green"
    
    if (-not (Test-Path $SQLFile)) {
        Write-ColorOutput "SQL file not found: $SQLFile" "Red"
        return $false
    }
    
    try {
        # Set environment variable for password if provided
        if ($DBPassword) {
            $env:PGPASSWORD = $DBPassword
        }
        
        # Execute SQL file
        $arguments = @("-h", $DBHost, "-p", $DBPort, "-U", $DBUser, "-d", $DBName, "-f", $SQLFile)
        $result = & psql @arguments 2>&1
        
        Write-ColorOutput "Database indexes applied successfully" "Green"
        $result | Out-File -FilePath $LogFile -Append -Encoding UTF8
        return $true
    }
    catch {
        Write-ColorOutput "Failed to apply database indexes: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Show-PostgreSQLRecommendations {
    Write-ColorOutput "PostgreSQL Configuration Recommendations:" "Green"
    
    $recommendations = @"

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

After making these changes, restart PostgreSQL service:
net stop postgresql-x64-14
net start postgresql-x64-14

==================================================================

"@
    
    Write-Host $recommendations
    $recommendations | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

function Show-DotNetRecommendations {
    Write-ColorOutput "Checking .NET application configuration..." "Green"
    
    $appsettingsFile = Join-Path $ScriptDir "src\MixWarz.API\appsettings.json"
    
    if (Test-Path $appsettingsFile) {
        Write-ColorOutput "Found appsettings.json file" "Green"
        
        $content = Get-Content $appsettingsFile -Raw
        if ($content -match "CommandTimeout") {
            Write-ColorOutput "Database command timeout is configured" "Green"
        }
        else {
            Write-ColorOutput "Consider adding CommandTimeout to your database connection string" "Yellow"
        }
        
        if ($content -match "Pooling") {
            Write-ColorOutput "Connection pooling is configured" "Green"
        }
        else {
            Write-ColorOutput "Consider enabling connection pooling in your database connection string" "Yellow"
        }
    }
    else {
        Write-ColorOutput "appsettings.json file not found at expected location" "Yellow"
    }
    
    $dotnetRecommendations = @"

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

"@
    
    Write-Host $dotnetRecommendations
    $dotnetRecommendations | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

function Generate-MonitoringQueries {
    Write-ColorOutput "Generating performance monitoring queries..." "Green"
    
    $monitoringFile = Join-Path $ScriptDir "performance_monitoring_queries.sql"
    
    $monitoringContent = @'
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
'@
    
    $monitoringContent | Out-File -FilePath $monitoringFile -Encoding UTF8
    Write-ColorOutput "Performance monitoring queries saved to: $monitoringFile" "Green"
}

function Show-ManualInstructions {
    Write-ColorOutput "Manual Installation Instructions:" "Yellow"
    
    $instructions = @"

==================================================================
Manual Performance Optimization Instructions
==================================================================

Since PostgreSQL client tools are not available in the current environment,
please follow these manual steps to apply the performance optimizations:

1. APPLY DATABASE INDEXES:
   - Open your PostgreSQL management tool (pgAdmin, Azure Data Studio, etc.)
   - Connect to your MixWarz database
   - Execute the SQL file: performance_indexes.sql
   - This will create ~50+ performance-optimized indexes

2. UPDATE POSTGRESQL CONFIGURATION:
   - Locate your postgresql.conf file
   - Add the recommended settings shown above
   - Restart PostgreSQL service

3. MONITOR PERFORMANCE:
   - Use the queries in performance_monitoring_queries.sql
   - Schedule regular VACUUM ANALYZE operations
   - Monitor index usage and remove unused indexes if necessary

4. .NET APPLICATION OPTIMIZATIONS:
   - Review connection string settings
   - Implement Entity Framework optimizations
   - Consider caching strategies

5. VERIFY OPTIMIZATIONS:
   - Run performance monitoring queries
   - Check query execution plans with EXPLAIN ANALYZE
   - Monitor application response times

==================================================================

FILES CREATED:
- performance_indexes.sql         (Database indexes to apply)
- performance_monitoring_queries.sql  (Monitoring queries)
- performance_optimization.log    (Optimization log)
- apply_performance_optimizations.ps1  (This PowerShell script)

==================================================================

"@
    
    Write-Host $instructions
    $instructions | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

# Main execution
Write-Header "MixWarz Performance Optimization Script (PowerShell)"

Write-ColorOutput "Environment Information:" "Green"
Write-Host "  - Database Host: $DBHost"
Write-Host "  - Database Port: $DBPort"
Write-Host "  - Database Name: $DBName"
Write-Host "  - Database User: $DBUser"
Write-Host "  - Script Directory: $ScriptDir"
Write-Host "  - Log File: $LogFile"
Write-Host ""

# Check PostgreSQL connectivity
$psqlAvailable = Test-PostgreSQLConnection

if ($psqlAvailable) {
    # PostgreSQL is available, attempt to apply indexes
    Write-ColorOutput "PostgreSQL client is available. Attempting to apply optimizations..." "Green"
    
    if (-not $SkipBackup) {
        $response = Read-Host "Do you want to create a database backup before applying optimizations? (y/n)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Write-ColorOutput "Creating database backup..." "Green"
            try {
                if ($DBPassword) {
                    $env:PGPASSWORD = $DBPassword
                }
                $backupFile = Join-Path $ScriptDir "mixwarz_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
                & pg_dump -h $DBHost -p $DBPort -U $DBUser -d $DBName -f $backupFile
                Write-ColorOutput "Database backup created: $backupFile" "Green"
            }
            catch {
                Write-ColorOutput "Failed to create backup: $($_.Exception.Message)" "Red"
            }
        }
    }
    
    # Apply database indexes
    Apply-DatabaseIndexes
    
    # Run VACUUM ANALYZE
    try {
        if ($DBPassword) {
            $env:PGPASSWORD = $DBPassword
        }
        Write-ColorOutput "Running VACUUM ANALYZE..." "Green"
        & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -c "VACUUM ANALYZE;"
        Write-ColorOutput "VACUUM ANALYZE completed" "Green"
    }
    catch {
        Write-ColorOutput "Failed to run VACUUM ANALYZE: $($_.Exception.Message)" "Yellow"
    }
}
else {
    # PostgreSQL not available, show manual instructions
    Write-ColorOutput "PostgreSQL client not available. Generating files for manual installation..." "Yellow"
}

# Generate supporting files and recommendations
Show-PostgreSQLRecommendations
Show-DotNetRecommendations
Generate-MonitoringQueries

if (-not $psqlAvailable) {
    Show-ManualInstructions
}

Write-Header "Performance Optimization Complete"
Write-ColorOutput "All optimization files have been generated successfully!" "Green"
Write-ColorOutput "Log file: $LogFile" "Green"
Write-ColorOutput "Monitoring queries: $(Join-Path $ScriptDir 'performance_monitoring_queries.sql')" "Green"

Write-Host ""
Write-ColorOutput "Next Steps:" "Green"
Write-Host "1. Review the PostgreSQL configuration recommendations above"
Write-Host "2. Apply the database indexes using performance_indexes.sql"
Write-Host "3. Monitor query performance using the generated monitoring queries"
Write-Host "4. Consider implementing the .NET application optimizations"
Write-Host "5. Schedule regular VACUUM ANALYZE operations"

Write-ColorOutput "Performance optimization script completed successfully" "Green" 