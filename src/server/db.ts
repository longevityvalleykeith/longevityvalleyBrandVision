/**
 * Phase 3 - Database Connection & Utilities
 *
 * @module drizzle/db
 * @version 3.0.1 - Migrated to PostgreSQL
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../types/schema';

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

let connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Strip unsupported query parameters (e.g., ?pgbouncer=true)
// The postgres client doesn't recognize these, but Supabase includes them in the URL
connectionString = connectionString.replace(/\?pgbouncer=true/g, '');

const queryClient = postgres(connectionString, {
  prepare: false, // CRITICAL: Required for Supabase Transaction Mode (Port 6543 pgbouncer)
  max: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// =============================================================================
// CONNECTION HEALTH CHECK
// =============================================================================

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await queryClient`SELECT 1 as health_check`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// =============================================================================
// TRANSACTION HELPER
// =============================================================================

export type TransactionClient = typeof db;

/**
 * Execute operations within a transaction
 */
export async function withTransaction<T>(
  callback: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  // Note: Drizzle's transaction API - adjust based on actual version
  return await db.transaction(async (tx) => {
    return await callback(tx as unknown as TransactionClient);
  });
}

// =============================================================================
// CLEANUP
// =============================================================================

export async function closeDatabaseConnection(): Promise<void> {
  await queryClient.end();
}

// =============================================================================
// MIGRATION UTILITIES
// =============================================================================

/**
 * Check if a table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await queryClient`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      AND tablename = ${tableName}
    `;
    return result.length > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Get table row count (for health checks)
 */
export async function getTableCount(tableName: string): Promise<number> {
  try {
    // Use sql.unsafe for dynamic table names (safe in this context as it's only used for admin/health checks)
    const result = await queryClient.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
    return Number(result[0]?.count || 0);
  } catch (error) {
    console.error(`Error getting count for table ${tableName}:`, error);
    return 0;
  }
}
