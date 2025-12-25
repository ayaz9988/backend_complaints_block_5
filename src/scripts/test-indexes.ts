import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

// Load environment variables
dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function testIndexPerformance() {
  console.log("🔍 Testing Index Performance...\n");

  try {
    // Test complaints status filtering
    console.log("1. Testing complaints status filtering...");
    const statusQuery = await prisma.$queryRaw`
      EXPLAIN ANALYZE
      SELECT * FROM complaints
      WHERE complaint_status = 'pending'
      ORDER BY "createdAt" DESC
      LIMIT 20
    `;
    console.log(
      "Status query execution plan:",
      JSON.stringify(statusQuery, null, 2),
    );

    // Test priority filtering
    console.log("\n2. Testing complaints priority filtering...");
    const priorityQuery = await prisma.$queryRaw`
      EXPLAIN ANALYZE
      SELECT * FROM complaints
      WHERE priority = 'high'
      ORDER BY "createdAt" DESC
    `;
    console.log(
      "Priority query execution plan:",
      JSON.stringify(priorityQuery, null, 2),
    );

    // Test composite index: status + priority
    console.log("\n3. Testing composite index (status + priority)...");
    const compositeQuery = await prisma.$queryRaw`
      EXPLAIN ANALYZE
      SELECT * FROM complaints
      WHERE complaint_status = 'pending'
      AND priority = 'high'
      ORDER BY "createdAt" DESC
    `;
    console.log(
      "Composite query execution plan:",
      JSON.stringify(compositeQuery, null, 2),
    );

    // Test neighborhood filtering
    console.log("\n4. Testing neighborhood filtering...");
    const neighborhoodQuery = await prisma.$queryRaw`
      EXPLAIN ANALYZE
      SELECT * FROM complaints
      WHERE neighborhood = 'Al-Midan'
      AND complaint_status = 'accepted'
    `;
    console.log(
      "Neighborhood query execution plan:",
      JSON.stringify(neighborhoodQuery, null, 2),
    );

    // Test user role filtering
    console.log("\n5. Testing user role filtering...");
    const userRoleQuery = await prisma.$queryRaw`
      EXPLAIN ANALYZE
      SELECT * FROM "User"
      WHERE role = 'mukhtar'
      AND is_active = true
    `;
    console.log(
      "User role query execution plan:",
      JSON.stringify(userRoleQuery, null, 2),
    );

    // Test index usage statistics
    console.log("\n6. Checking index usage statistics...");
    const indexStats = await prisma.$queryRaw`
      SELECT
        schemaname,
        relname as tablename,
        indexrelname as indexname,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes
      WHERE relname IN ('complaints', 'User', 'Announcement', 'Achievement', 'Initiative', 'RefreshToken')
      ORDER BY idx_scan DESC
    `;
    console.log(
      "Index usage statistics:",
      JSON.stringify(
        indexStats,
        (key, value) => (typeof value === "bigint" ? value.toString() : value),
        2,
      ),
    );

    // Test table and index sizes
    console.log("\n7. Checking table and index sizes...");
    const sizeAnalysis = await prisma.$queryRaw`
      SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size,
        pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
        pg_size_pretty(pg_total_relation_size(tablename::regclass) - pg_relation_size(tablename::regclass)) as index_size
      FROM pg_tables
      WHERE tablename IN ('complaints', '"User"', '"Announcement"', '"Achievement"', '"Initiative"', '"RefreshToken"')
      ORDER BY pg_total_relation_size(tablename::regclass) DESC
    `;
    console.log(
      "Table and index sizes:",
      JSON.stringify(
        sizeAnalysis,
        (key, value) => (typeof value === "bigint" ? value.toString() : value),
        2,
      ),
    );

    console.log("\n✅ Index performance testing completed successfully!");
    console.log("\n📊 Key metrics to monitor:");
    console.log("- Index scans: Higher is better (indexes are being used)");
    console.log("- Execution time: Should be < 100ms for dashboard queries");
    console.log("- Index size: Monitor for excessive growth");
  } catch (error) {
    console.error("❌ Error testing index performance:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testIndexPerformance().catch(console.error);
