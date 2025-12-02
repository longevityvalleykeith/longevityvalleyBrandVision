/**
 * Phase 3 - Unified Database Schema
 * 
 * Single Source of Truth for all database tables.
 * Implements P0 Critical: Database indexes on foreign keys
 * 
 * @module drizzle/schema
 * @version 3.0.0
 */

import {
  mysqlTable,
  bigint,
  varchar,
  json,
  timestamp,
  text,
  int,
  index,
  boolean,
  decimal,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import type {
  GeminiAnalysisOutput,
  DirectorState,
  VisionJobStatus,
  VideoPromptStatus,
} from '../types';

// =============================================================================
// USERS TABLE (Reference for foreign keys)
// =============================================================================

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID or Clerk ID
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  plan: varchar('plan', { length: 50 }).default('free').notNull(),
  creditsRemaining: int('credits_remaining').default(10).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  // P0 Critical: Index on frequently queried columns
  emailIdx: uniqueIndex('idx_users_email').on(table.email),
  planIdx: index('idx_users_plan').on(table.plan),
}));

// =============================================================================
// VISION JOBS TABLE (Phase 3B - Brand Analysis)
// =============================================================================

export const visionJobs = mysqlTable('vision_jobs', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  
  // Foreign key to user
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // Image metadata
  imageUrl: text('image_url').notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  fileSize: int('file_size').notNull(),
  
  // Processing status
  status: varchar('status', { length: 20 })
    .$type<VisionJobStatus>()
    .default('pending')
    .notNull(),
  
  // Gemini analysis output (JSON)
  geminiOutput: json('gemini_output').$type<GeminiAnalysisOutput>(),
  
  // Error tracking
  errorMessage: text('error_message'),
  retryCount: int('retry_count').default(0).notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  processedAt: timestamp('processed_at'),
  deletedAt: timestamp('deleted_at'), // Soft delete support
}, (table) => ({
  // P0 Critical: Indexes on foreign keys and frequently queried columns
  userIdIdx: index('idx_vision_jobs_user_id').on(table.userId),
  statusIdx: index('idx_vision_jobs_status').on(table.status),
  createdAtIdx: index('idx_vision_jobs_created_at').on(table.createdAt),
  // Composite index for user's recent jobs
  userStatusIdx: index('idx_vision_jobs_user_status').on(table.userId, table.status),
}));

// =============================================================================
// VISION JOB VIDEO PROMPTS TABLE (Phase 3C - Director Mode)
// =============================================================================

export const visionJobVideoPrompts = mysqlTable('vision_job_video_prompts', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  
  // Foreign key to vision job
  jobId: int('job_id')
    .notNull()
    .references(() => visionJobs.id, { onDelete: 'cascade' }),
  
  // Director state (JSON blob containing full state machine)
  directorOutput: json('director_output').$type<DirectorState>().notNull(),
  
  // Denormalized status for efficient querying
  status: varchar('status', { length: 50 })
    .$type<VideoPromptStatus>()
    .default('idle')
    .notNull(),
  
  // Remastered image URL (if quality was below threshold)
  remasteredImageUrl: text('remastered_image_url'),
  
  // External API tracking
  klingJobId: varchar('kling_job_id', { length: 100 }),
  
  // Cost tracking
  creditsUsed: decimal('credits_used', { precision: 10, scale: 2 }).default('0'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  // P0 Critical: Index on foreign key
  jobIdIdx: index('idx_video_prompts_job_id').on(table.jobId),
  statusIdx: index('idx_video_prompts_status').on(table.status),
  klingJobIdIdx: index('idx_video_prompts_kling_job_id').on(table.klingJobId),
}));

// =============================================================================
// STYLE PRESETS TABLE (Phase 3C - Configurable Styles)
// =============================================================================

export const stylePresets = mysqlTable('style_presets', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  promptLayer: text('prompt_layer').notNull(),
  hiddenRefUrl: text('hidden_ref_url').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  isPremium: boolean('is_premium').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: int('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index('idx_style_presets_category').on(table.category),
  activeIdx: index('idx_style_presets_active').on(table.isActive),
}));

// =============================================================================
// RATE LIMIT TRACKING TABLE (P0 Critical: Rate limiting support)
// =============================================================================

export const rateLimitBuckets = mysqlTable('rate_limit_buckets', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  
  // Identifier (userId:endpoint or ip:endpoint)
  identifier: varchar('identifier', { length: 255 }).notNull(),
  
  // Endpoint being rate limited
  endpoint: varchar('endpoint', { length: 100 }).notNull(),
  
  // Request count in current window
  requestCount: int('request_count').default(0).notNull(),
  
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

export const auditLogs = mysqlTable('audit_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 36 }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }),
  details: json('details'),
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
