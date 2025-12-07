/**
 * Apply Phase 4 Migration
 *
 * Adds creative_profile column to users table and creates learning_events table.
 *
 * @module scripts/apply-phase4-migration
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function applyMigration() {
  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    // Step 1: Add creative_profile column to users table
    console.log('Step 1: Adding creative_profile column to users table...');
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS creative_profile JSONB
    `);
    console.log('  creative_profile column added (or already exists)');

    // Step 2: Create learning_events table
    console.log('Step 2: Creating learning_events table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS learning_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        job_id UUID NOT NULL REFERENCES vision_jobs(id) ON DELETE CASCADE,
        raw_scores JSONB NOT NULL,
        director_pitches JSONB NOT NULL,
        selected_director_id VARCHAR(50) NOT NULL,
        learning_delta JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('  learning_events table created (or already exists)');

    // Step 3: Create indexes
    console.log('Step 3: Creating indexes...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_learning_events_user_id ON learning_events(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_learning_events_job_id ON learning_events(job_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_learning_events_director ON learning_events(selected_director_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_learning_events_created_at ON learning_events(created_at)
    `);
    console.log('  Indexes created');

    console.log('\n');
    console.log('Migration applied successfully!');
    console.log('Phase 4 database schema is ready.');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
