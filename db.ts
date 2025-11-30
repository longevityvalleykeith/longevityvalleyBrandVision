/**
 * Phase 3 - Database Connection & Utilities
 * 
 * @module drizzle/db
 * @version 3.0.0
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

const poolConnection = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'phase3',
  
  // Connection pool settings
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
  queueLimit: 0,
  
  // Timeout settings
  connectTimeout: 10000,
  
  // Enable prepared statements for security
  namedPlaceholders: true,
});

export const db = drizzle(poolConnection, { 
  schema, 
  mode: 'default',
  logger: process.env.NODE_ENV === 'development',
});

// =============================================================================
// CONNECTION HEALTH CHECK
// =============================================================================

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const connection = await poolConnection.getConnection();
    await connection.ping();
    connection.release();
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
  await poolConnection.end();
}

// =============================================================================
// MIGRATION UTILITIES
// =============================================================================

/**
 * Check if a table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const connection = await poolConnection.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [process.env.DATABASE_NAME, tableName]
    );
    return Array.isArray(rows) && rows.length > 0;
  } finally {
    connection.release();
  }
}

/**
 * Get table row count (for health checks)
 */
export async function getTableCount(tableName: string): Promise<number> {
  const connection = await poolConnection.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT COUNT(*) as count FROM ??`,
      [tableName]
    );
    return (rows as any)[0]?.count || 0;
  } finally {
    connection.release();
  }
}
