-- Index Performance Validation Queries
-- Run these queries after applying the migration to validate index usage

-- ========================================
-- 1. COMPLAINTS MODEL INDEX VALIDATION
-- ========================================

-- Test status-based filtering (should use complaint_status index)
EXPLAIN ANALYZE SELECT * FROM complaints 
WHERE complaint_status = 'pending' 
ORDER BY createdAt DESC 
LIMIT 20;

-- Test priority filtering (should use priority index)
EXPLAIN ANALYZE SELECT * FROM complaints 
WHERE priority = 'high' 
ORDER BY createdAt DESC;

-- Test composite index: status + priority
EXPLAIN ANALYZE SELECT * FROM complaints 
WHERE complaint_status = 'pending' 
AND priority = 'high'
ORDER BY createdAt DESC;

-- Test neighborhood filtering (should use neighborhood index)
EXPLAIN ANALYZE SELECT * FROM complaints 
WHERE neighborhood = 'Al-Midan' 
AND complaint_status = 'accepted';

-- Test mukhtar assignment filtering (should use mukhtarInitialId index)
EXPLAIN ANALYZE SELECT * FROM complaints 
WHERE mukhtarInitialId = 'some-user-id' 
AND complaint_status = 'accepted';

-- Test working on filtering (should use working_on_by index)
EXPLAIN ANALYZE SELECT * FROM complaints 
WHERE is_working_on = true 
AND working_on_by = 'some-user-id';

-- Test date range queries (should use createdAt/updatedAt indexes)
EXPLAIN ANALYZE SELECT * FROM complaints 
WHERE createdAt >= NOW() - INTERVAL '30 days'
ORDER BY createdAt DESC;

-- Test complaint type filtering (should use complaint_type index)
EXPLAIN ANALYZE SELECT * FROM complaints 
WHERE complaint_type = 'Infrastructure' 
AND complaint_status = 'pending';

-- ========================================
-- 2. USER MODEL INDEX VALIDATION
-- ========================================

-- Test role-based filtering (should use role + is_active composite index)
EXPLAIN ANALYZE SELECT * FROM "User" 
WHERE role = 'mukhtar' 
AND is_active = true;

-- Test neighborhood filtering for mukhtars (should use neighborhood index)
EXPLAIN ANALYZE SELECT * FROM "User" 
WHERE role = 'mukhtar' 
AND neighborhood = 'Al-Midan';

-- Test email lookup (should use email index)
EXPLAIN ANALYZE SELECT * FROM "User" 
WHERE email = 'test@example.com';

-- ========================================
-- 3. ANNOUNCEMENT MODEL INDEX VALIDATION
-- ========================================

-- Test status filtering (should use status index)
EXPLAIN ANALYZE SELECT * FROM Announcement 
WHERE status = 'active' 
ORDER BY createdAt DESC;

-- Test composite index: status + date
EXPLAIN ANALYZE SELECT * FROM Announcement 
WHERE status = 'active' 
AND createdAt >= NOW() - INTERVAL '7 days'
ORDER BY createdAt DESC;

-- ========================================
-- 4. ACHIEVEMENT MODEL INDEX VALIDATION
-- ========================================

-- Test status filtering (should use status index)
EXPLAIN ANALYZE SELECT * FROM Achievement 
WHERE status = 'active' 
ORDER BY createdAt DESC;

-- ========================================
-- 5. INITIATIVE MODEL INDEX VALIDATION
-- ========================================

-- Test status filtering (should use status index)
EXPLAIN ANALYZE SELECT * FROM Initiative 
WHERE status = 'pending' 
ORDER BY createdAt DESC;

-- Test composite index: status + neighborhood
EXPLAIN ANALYZE SELECT * FROM Initiative 
WHERE status = 'pending' 
AND neighborhood = 'Al-Midan';

-- ========================================
-- 6. REFRESH TOKEN MODEL INDEX VALIDATION
-- ========================================

-- Test user lookup (should use userId index)
EXPLAIN ANALYZE SELECT * FROM RefreshToken 
WHERE userId = 'some-user-id' 
AND revoked = false 
AND expiresAt > NOW();

-- Test expired token cleanup (should use expiresAt index)
EXPLAIN ANALYZE SELECT * FROM RefreshToken 
WHERE expiresAt < NOW();

-- ========================================
-- 7. INDEX USAGE STATISTICS
-- ========================================

-- Check which indexes are being used most frequently
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE tablename IN ('complaints', 'User', 'Announcement', 'Achievement', 'Initiative', 'RefreshToken')
ORDER BY idx_scan DESC;

-- Check index bloat (unused indexes)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
AND schemaname = 'public'
AND tablename IN ('complaints', 'User', 'Announcement', 'Achievement', 'Initiative', 'RefreshToken');

-- ========================================
-- 8. TABLE AND INDEX SIZE ANALYSIS
-- ========================================

-- Show table sizes with index overhead
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size,
    pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
    pg_size_pretty(pg_total_relation_size(tablename::regclass) - pg_relation_size(tablename::regclass)) as index_size,
    pg_size_pretty(pg_total_relation_size(tablename::regclass) - pg_relation_size(tablename::regclass)) as index_overhead
FROM pg_tables 
WHERE tablename IN ('complaints', 'User', 'Announcement', 'Achievement', 'Initiative', 'RefreshToken')
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- ========================================
-- 9. PERFORMANCE BENCHMARK QUERIES
-- ========================================

-- Dashboard query performance test (most critical)
-- Manager/Admin dashboard: All complaints by status
\timing on
SELECT COUNT(*) FROM complaints WHERE complaint_status = 'pending';
SELECT COUNT(*) FROM complaints WHERE complaint_status = 'accepted';
SELECT COUNT(*) FROM complaints WHERE complaint_status = 'refused';
\timing off

-- Mukhtar dashboard performance test
\timing on
SELECT COUNT(*) FROM complaints WHERE mukhtarInitialId IS NOT NULL AND complaint_status = 'accepted';
\timing off

-- Neighborhood filtering performance
\timing on
SELECT COUNT(*) FROM complaints WHERE neighborhood = 'Al-Midan';
\timing off

-- ========================================
-- 10. INDEX REBUILD RECOMMENDATIONS
-- ========================================

-- Check for indexes that might need rebuilding (high fragmentation)
SELECT 
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_tup_read > 0 THEN 
            ROUND((idx_tup_fetch::numeric / idx_tup_read) * 100, 2)
        ELSE 0 
    END as efficiency_percent
FROM pg_stat_user_indexes 
WHERE tablename IN ('complaints', 'User', 'Announcement', 'Achievement', 'Initiative', 'RefreshToken')
ORDER BY efficiency_percent ASC;

-- Note: Indexes with low efficiency might benefit from rebuilding
-- Rebuild syntax (run if needed):
-- REINDEX INDEX index_name;