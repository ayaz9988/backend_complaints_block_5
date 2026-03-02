# Database Indexing Strategy

This document outlines the comprehensive indexing strategy implemented for the complaint management system to optimize query performance.

## Overview

The indexing strategy focuses on the most common query patterns in the application:

1. **Status-based filtering** - Most queries filter by status (pending, accepted, refused)
2. **Role-based access control** - Queries filtered by user roles and permissions
3. **Date-based sorting** - Creation and update time sorting
4. **Relationship queries** - Foreign key lookups and joins
5. **Neighborhood filtering** - Geographic-based queries for Mukhtar assignments

## Related Documentation

- [API Documentation](DOCUMENTATION.md) - See how these indexes optimize the API endpoints
- [README](README.md) - Project overview and setup instructions
- [Validation System](VALIDATION.md) - Input validation that works with our database structure

## Indexes by Model

### User Model

- `@@index([role, is_active])` - Role-based filtering with active status
- `@@index([neighborhood])` - Mukhtar neighborhood assignments
- `@@index([email])` - Fast email lookups for authentication

### RefreshToken Model

- `@@index([userId])` - Fast lookup by user
- `@@index([expiresAt])` - Cleanup of expired tokens
- `@@index([revoked, expiresAt])` - Active, non-revoked token queries

### Complaints Model (Main Entity)

**Single Field Indexes:**

- `@@index([complaint_status])` - Filter by status (pending, accepted, refused)
- `@@index([priority])` - Filter by priority (high, mid, low)
- `@@index([neighborhood])` - Filter complaints by neighborhood
- `@@index([complaint_type])` - Filter by complaint type
- `@@index([mukhtarInitialId])` - Filter complaints handled by specific mukhtar
- `@@index([working_on_by])` - Filter complaints being worked on by specific user
- `@@index([is_working_on])` - Filter complaints currently being worked on
- `@@index([createdAt])` - Sort by creation date
- `@@index([updatedAt])` - Sort by last update
- `@@index([deletedAt])` - Soft delete queries

**Composite Indexes:**

- `@@index([complaint_status, priority])` - Status and priority filtering
- `@@index([complaint_status, neighborhood])` - Status and neighborhood filtering
- `@@index([complaint_status, mukhtarInitialId])` - Status and handler filtering
- `@@index([priority, complaint_status])` - Priority and status filtering
- `@@index([neighborhood, complaint_status])` - Neighborhood and status filtering
- `@@index([createdAt, complaint_status])` - Date range and status filtering
- `@@index([updatedAt, complaint_status])` - Last update and status filtering

**Unique Constraints:**

- `@@unique([trackingTag], map: "complaints_tracking_tag_unique_idx")` - Ensure tracking tags are unique

### Announcement Model

- `@@index([status])` - Filter by status (active, inactive)
- `@@index([createdAt])` - Sort by creation date
- `@@index([updatedAt])` - Sort by last update
- `@@index([createdBy])` - Filter announcements by creator
- `@@index([status, createdAt])` - Status and date filtering
- `@@index([status, updatedAt])` - Status and last update filtering

### Achievement Model

- `@@index([status])` - Filter by status (active, inactive)
- `@@index([createdAt])` - Sort by creation date
- `@@index([updatedAt])` - Sort by last update
- `@@index([createdBy])` - Filter achievements by creator
- `@@index([status, createdAt])` - Status and date filtering
- `@@index([status, updatedAt])` - Status and last update filtering

### Initiative Model

- `@@index([status])` - Filter by status (pending, approved, rejected)
- `@@index([neighborhood])` - Filter by neighborhood
- `@@index([location])` - Filter by location
- `@@index([createdAt])` - Sort by creation date
- `@@index([updatedAt])` - Sort by last update
- `@@index([status, createdAt])` - Status and date filtering
- `@@index([status, neighborhood])` - Status and neighborhood filtering
- `@@index([neighborhood, status])` - Neighborhood and status filtering

**Note:** The `rejectionReason` field is not indexed as it is primarily set when status is 'rejected' and is accessed via the initiative record itself.

## Query Performance Examples

### 1. Dashboard Queries (Most Critical)

```sql
-- Manager/Admin dashboard: All complaints by status and priority
SELECT * FROM complaints
WHERE complaint_status = 'pending'
ORDER BY priority DESC, createdAt DESC;

-- Mukhtar dashboard: Complaints assigned to specific mukhtar
SELECT * FROM complaints
WHERE mukhtarInitialId = 'user-id'
AND complaint_status = 'accepted'
ORDER BY updatedAt DESC;

-- Neighborhood view: All complaints in specific neighborhood
SELECT * FROM complaints
WHERE neighborhood = 'Al-Midan'
AND complaint_status IN ('pending', 'accepted')
ORDER BY createdAt DESC;
```

### 2. Status-Based Filtering

```sql
-- Get all high-priority pending complaints
SELECT * FROM complaints
WHERE complaint_status = 'pending'
AND priority = 'high'
ORDER BY createdAt;

-- Get all complaints currently being worked on
SELECT * FROM complaints
WHERE is_working_on = true
AND working_on_by = 'user-id';
```

### 3. Date Range Queries

```sql
-- Get complaints created in the last 30 days
SELECT * FROM complaints
WHERE createdAt >= NOW() - INTERVAL '30 days'
ORDER BY createdAt DESC;

-- Get recently updated complaints
SELECT * FROM complaints
WHERE updatedAt >= NOW() - INTERVAL '7 days'
ORDER BY updatedAt DESC;
```

### 4. Role-Based Access Control

```sql
-- Get all active users by role
SELECT * FROM User
WHERE role = 'mukhtar'
AND is_active = true;

-- Get all announcements visible to users
SELECT * FROM Announcement
WHERE status = 'active'
ORDER BY createdAt DESC;
```

## Performance Monitoring

### Key Metrics to Monitor

1. **Query Response Time**: Target < 100ms for dashboard queries
2. **Index Usage**: Ensure indexes are being used (check with EXPLAIN ANALYZE)
3. **Index Size**: Monitor disk space usage by indexes
4. **Write Performance**: Ensure indexes don't significantly slow down INSERT/UPDATE operations

### Monitoring Queries

```sql
-- Check index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('complaints', 'User', 'Announcement', 'Achievement', 'Initiative')
ORDER BY idx_tup_read DESC;

-- Check table sizes with and without indexes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size,
    pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
    pg_size_pretty(pg_total_relation_size(tablename::regclass) - pg_relation_size(tablename::regclass)) as index_size
FROM pg_tables
WHERE tablename IN ('complaints', 'User', 'Announcement', 'Achievement', 'Initiative');
```

## Maintenance Recommendations

### 1. Regular Index Rebuilding

```sql
-- Rebuild indexes periodically (monthly recommended)
REINDEX TABLE complaints;
REINDEX TABLE User;
REINDEX TABLE Announcement;
REINDEX TABLE Achievement;
REINDEX TABLE Initiative;
```

### 2. Index Monitoring

- Monitor index usage statistics monthly
- Remove unused indexes to save disk space
- Add new indexes for emerging query patterns

### 3. Query Optimization

- Use EXPLAIN ANALYZE for slow queries
- Consider partial indexes for filtered queries
- Review composite index column order based on selectivity

## Index Naming Convention

All indexes follow PostgreSQL's default naming convention with custom names for unique constraints:

- Single field indexes: `tablename_columnname_idx`
- Composite indexes: `tablename_column1_column2_idx`
- Unique constraints: Custom names with descriptive suffixes

## Future Considerations

1. **Partial Indexes**: Consider for queries with common WHERE clauses
2. **Covering Indexes**: For read-heavy workloads, consider including frequently accessed columns
3. **Partitioning**: For complaints table if it grows beyond 10M records
4. **Materialized Views**: For complex dashboard aggregations

## Testing the Indexes

After applying the migration, test the following scenarios:

1. **Load Test**: Simulate concurrent dashboard requests
2. **Query Analysis**: Use EXPLAIN ANALYZE on critical queries
3. **Index Verification**: Confirm indexes are being used
4. **Performance Baseline**: Measure before and after performance

## Integration with System Components

These indexes work in conjunction with:

- **API Endpoints** ([DOCUMENTATION.md](DOCUMENTATION.md)) - Optimized queries for dashboard and management operations
- **Validation System** ([VALIDATION.md](VALIDATION.md)) - Ensures data integrity that supports efficient indexing
- **Database Schema** ([Prisma Schema](prisma/schema.prisma)) - The foundation for our indexing strategy

This indexing strategy should significantly improve query performance for the most common operations in the complaint management system while maintaining reasonable write performance.
