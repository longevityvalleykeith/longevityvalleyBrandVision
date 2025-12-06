/**
 * Phase 3 - Unified Database Schema (PostgreSQL)
 *
 * Single Source of Truth for all database tables.
 * Implements P0 Critical: Database indexes on foreign keys
 *
 * @module types/schema
 * @version 3.0.1 - Migrated to PostgreSQL
 */

import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  text,
  integer,
  index,
  boolean,
  numeric,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type {
  GeminiAnalysisOutput,
  DirectorState,
  VisionJobStatus,
  VideoPromptStatus,
} from './index';

// =============================================================================
// USERS TABLE (Reference for foreign keys)
// =============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  plan: varchar('plan', { length: 50 }).default('free').notNull(),
  creditsRemaining: integer('credits_remaining').default(10).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  // P0 Critical: Index on frequently queried columns
  emailIdx: uniqueIndex('idx_users_email').on(table.email),
  planIdx: index('idx_users_plan').on(table.plan),
}));

// =============================================================================
// VISION JOBS TABLE (Phase 3B - Brand Analysis)
// =============================================================================

export const visionJobs = pgTable('vision_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign key to user
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Original Upload metadata
  imageUrl: text('image_url').notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  fileSize: integer('file_size').notNull(),
  fileHash: varchar('file_hash', { length: 64 }), // SHA256 for deduplication

  // Style Reference (Generated - Phase 3C)
  styleReferenceUrl: text('style_reference_url'),
  brandEssencePrompt: text('brand_essence_prompt'),

  // Processing status
  status: varchar('status', { length: 20 })
    .$type<VisionJobStatus>()
    .default('pending')
    .notNull(),

  // Gemini analysis output (JSONB)
  geminiOutput: jsonb('gemini_output').$type<GeminiAnalysisOutput>(),

  // Scores (denormalized for efficient routing queries)
  physicsScore: numeric('physics_score', { precision: 3, scale: 2 }),
  vibeScore: numeric('vibe_score', { precision: 3, scale: 2 }),
  logicScore: numeric('logic_score', { precision: 3, scale: 2 }),
  integrityScore: numeric('integrity_score', { precision: 3, scale: 2 }),

  // Error tracking
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
  deletedAt: timestamp('deleted_at'), // Soft delete support
}, (table) => ({
  // P0 Critical: Indexes on foreign keys and frequently queried columns
  userIdIdx: index('idx_vision_jobs_user_id').on(table.userId),
  statusIdx: index('idx_vision_jobs_status').on(table.status),
  createdAtIdx: index('idx_vision_jobs_created_at').on(table.createdAt),
  // Composite index for user's recent jobs
  userStatusIdx: index('idx_vision_jobs_user_status').on(table.userId, table.status),
  // Routing index for production engine selection
  routingIdx: index('idx_vision_jobs_routing').on(table.physicsScore, table.vibeScore, table.logicScore),
}));

// =============================================================================
// VISION JOB VIDEO PROMPTS TABLE (Phase 3C - Director Mode)
// =============================================================================

export const visionJobVideoPrompts = pgTable('vision_job_video_prompts', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign key to vision job
  jobId: uuid('job_id')
    .notNull()
    .references(() => visionJobs.id, { onDelete: 'cascade' }),

  // Routing Decision
  productionEngine: varchar('production_engine', { length: 20 }).notNull(),
  routingReason: text('routing_reason'), // Why this engine was selected

  // Workflow State
  status: varchar('status', { length: 30 })
    .$type<VideoPromptStatus>()
    .default('scripting' as VideoPromptStatus)
    .notNull(),

  // Scene Data (JSONB array)
  scenesData: jsonb('scenes_data').$type<DirectorState['scenes']>().notNull().$defaultFn(() => []),

  // Conversation Context (for YELLOW flow)
  conversationHistory: jsonb('conversation_history').default('[]'),

  // Remastered image URL (if quality was below threshold)
  remasteredImageUrl: text('remastered_image_url'),

  // External API tracking (supports all engines: Kling, Luma, Gemini Pro)
  externalJobId: varchar('external_job_id', { length: 100 }),

  // Cost tracking
  creditsUsed: numeric('credits_used', { precision: 10, scale: 2 }).default('0'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  // P0 Critical: Index on foreign key
  jobIdIdx: index('idx_video_prompts_job_id').on(table.jobId),
  statusIdx: index('idx_video_prompts_status').on(table.status),
  engineIdx: index('idx_video_prompts_engine').on(table.productionEngine),
}));

// =============================================================================
// STYLE PRESETS TABLE (Phase 3C - Configurable Styles)
// =============================================================================

export const stylePresets = pgTable('style_presets', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  promptLayer: text('prompt_layer').notNull(),
  hiddenRefUrl: text('hidden_ref_url').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  isPremium: boolean('is_premium').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('idx_style_presets_category').on(table.category),
  activeIdx: index('idx_style_presets_active').on(table.isActive),
}));

// =============================================================================
// RATE LIMIT TRACKING TABLE (P0 Critical: Rate limiting support)
// =============================================================================

export const rateLimitBuckets = pgTable('rate_limit_buckets', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Identifier (userId:endpoint or ip:endpoint)
  identifier: varchar('identifier', { length: 255 }).notNull(),

  // Endpoint being rate limited
  endpoint: varchar('endpoint', { length: 100 }).notNull(),

  // Request count in current window
  requestCount: integer('request_count').default(0).notNull(),

  // Window start time
  windowStart: timestamp('window_start').notNull(),

  // Window end time
  windowEnd: timestamp('window_end').notNull(),
}, (table) => ({
  identifierIdx: uniqueIndex('idx_rate_limit_identifier').on(table.identifier, table.endpoint),
  windowEndIdx: index('idx_rate_limit_window_end').on(table.windowEnd),
}));

// =============================================================================
// AUDIT LOG TABLE (For debugging and compliance)
// =============================================================================

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_audit_logs_user_id').on(table.userId),
  actionIdx: index('idx_audit_logs_action').on(table.action),
  entityIdx: index('idx_audit_logs_entity').on(table.entityType, table.entityId),
  createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
}));

// =============================================================================
// RELATIONS
// =============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  visionJobs: many(visionJobs),
}));

export const visionJobsRelations = relations(visionJobs, ({ one, many }) => ({
  user: one(users, {
    fields: [visionJobs.userId],
    references: [users.id],
  }),
  videoPrompts: many(visionJobVideoPrompts),
}));

export const visionJobVideoPromptsRelations = relations(visionJobVideoPrompts, ({ one }) => ({
  visionJob: one(visionJobs, {
    fields: [visionJobVideoPrompts.jobId],
    references: [visionJobs.id],
  }),
}));

// =============================================================================
// TYPE EXPORTS FOR QUERIES
// =============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type VisionJob = typeof visionJobs.$inferSelect;
export type NewVisionJob = typeof visionJobs.$inferInsert;

export type VisionJobVideoPrompt = typeof visionJobVideoPrompts.$inferSelect;
export type NewVisionJobVideoPrompt = typeof visionJobVideoPrompts.$inferInsert;

export type StylePreset = typeof stylePresets.$inferSelect;
export type NewStylePreset = typeof stylePresets.$inferInsert;

export type RateLimitBucket = typeof rateLimitBuckets.$inferSelect;
export type NewRateLimitBucket = typeof rateLimitBuckets.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
