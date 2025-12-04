# Architecture Snapshot

**Generated**: 2025-12-04T12:07:02.315Z
**Project**: Longevity Valley Brand Content Factory
**Phase**: 3B + 3C (Brand Analysis + Video Director Mode)

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Core Configuration Files](#core-configuration-files)
3. [Type System](#type-system)
4. [Development Specification](#development-specification)
5. [Environment Template](#environment-template)

---

## 1. Project Structure

```
└── Longevity Valley Brand Vision
    ├── docs
    │   ├── ARCH_SNAPSHOT.md
    │   ├── SCHEMA_INTEGRITY_REPORT.md
    │   ├── SECURITY_VERIFICATION_REPORT.md
    │   └── TEST_REPORT.md
    ├── scripts
    │   └── generate-arch-report.ts
    ├── src
    │   ├── app
    │   │   ├── api
    │   │   │   └── trpc
    │   │   │       └── [trpc]
    │   │   │           └── route.ts
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   └── providers.tsx
    │   ├── client
    │   │   ├── DirectorMode.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   └── useDirector.ts
    │   ├── server
    │   │   ├── database.ts
    │   │   ├── db.ts
    │   │   ├── deepseekDirector.ts
    │   │   ├── directorRouter.ts
    │   │   ├── fileValidation.ts
    │   │   ├── fluxPreviewer.ts
    │   │   ├── index.ts
    │   │   ├── rateLimit.ts
    │   │   ├── stylePresets.ts
    │   │   ├── supabase.ts
    │   │   ├── trpc.ts
    │   │   └── visionRouter.ts
    │   └── types
    │       ├── index.ts
    │       ├── schema.ts
    │       └── validation.ts
    ├── supabase
    │   ├── .temp
    │   │   └── cli-latest
    │   ├── functions
    │   │   ├── tests
    │   │   │   └── director-flow.ts
    │   │   └── README.md
    │   ├── migrations
    │   │   ├── 001_initial_schema.sql
    │   │   ├── 002_rls_policies.sql
    │   │   ├── 003_storage_buckets.sql
    │   │   └── 004_seed_data.sql
    │   └── config.toml
    ├── .DS_Store
    ├── .env.example
    ├── .env.local
    ├── .gitignore
    ├── drizzle.config.ts
    ├── FINAL-DEV_SPEC_v2.md
    ├── next-env.d.ts
    ├── next.config.mjs
    ├── package-lock.json
    ├── package.json
    ├── PROJECT_STATUS.md
    ├── push.sh
    ├── README.md
    ├── TECH_DEBT.md
    ├── tsconfig.json
    ├── tsconfig.tsbuildinfo
    ├── VERIFICATION_REPORT.md
    └── vitest.config.ts
```

---

## 2. Core Configuration Files

### package.json

```json
{
  "name": "phase3-brand-content-factory",
  "version": "3.0.0",
  "description": "Brand Content Factory - Phase 3B (Brand Analysis) + Phase 3C (Video Director Mode)",
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "report:arch": "tsx scripts/generate-arch-report.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.86.0",
    "@tanstack/react-query": "^5.17.0",
    "@trpc/client": "^11.0.0-next.0",
    "@trpc/react-query": "^11.0.0-next.0",
    "@trpc/server": "^11.0.0-next.0",
    "dotenv": "^17.2.3",
    "drizzle-orm": "^0.44.7",
    "next": "^14.1.0",
    "openai": "^4.24.0",
    "postgres": "^3.4.7",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "superjson": "^2.2.1",
    "uuid": "^9.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/uuid": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "drizzle-kit": "^0.20.10",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.1.0",
    "glob": "^13.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}

```

### drizzle.config.ts

```ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default {
  schema: './src/types/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;

```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"],
      "@/types/*": ["./types/*"],
      "@/drizzle/*": ["./drizzle/*"],
      "@/server/*": ["./server/*"],
      "@/client/*": ["./client/*"]
    },
    "baseUrl": ".",
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}

```

---

## 3. Type System

### src/types/schema.ts

```typescript
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

  // Image metadata
  imageUrl: text('image_url').notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  fileSize: integer('file_size').notNull(),

  // Processing status
  status: varchar('status', { length: 20 })
    .$type<VisionJobStatus>()
    .default('pending')
    .notNull(),

  // Gemini analysis output (JSONB)
  geminiOutput: jsonb('gemini_output').$type<GeminiAnalysisOutput>(),

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

  // Director state (JSONB blob containing full state machine)
  directorOutput: jsonb('director_output').$type<DirectorState>().notNull(),

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
  creditsUsed: numeric('credits_used', { precision: 10, scale: 2 }).default('0'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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

```

---

## 4. Development Specification

### FINAL-DEV_SPEC_v2.md

```markdown
# 📜 FINAL-DEV_SPEC.md: Longevity Valley Architecture (v2.0)

**Authority:** Gemini (CTO)  
**Stack:** Next.js 15 + Supabase (Postgres/Realtime/Storage) + tRPC (v11)  
**Testing Strategy:** Headless-First (Deno/Vitest)  
**Last Updated:** December 2, 2025

---

## 0. Document Control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 30, 2025 | Initial architecture |
| 2.0 | Dec 2, 2025 | Added security section, error handling, Flux fallback, style_reference workflow |

---

## 1. AI Agent Roles & Responsibilities

### **The Strategist: Gemini 2.0/3.0 Pro**
* **Role:** **Brand DNA Extraction + Style Reference Generation**
* **Input:** Raw Image / Brand Assets
* **Output:** 
  - Brand Strategy JSON (Physics Score, Vibe Score, Logic Score)
  - `style_reference_url` (Optimized derivative for downstream agents)
  - `integrity_score` (0.0 - 1.0)
* **Safety:** **Integrity Filter**. Score < 0.4 = Job flagged for review.

### **The Technical Director: DeepSeek V3**
* **Role:** **Cinematography & Production Routing**
* **Input:** 
  - Brand Strategy JSON
  - `style_reference_url`
  - `SKILL.md` Logic (cinematography rules)
* **Task:**
  1. Determine **Production Route** (Kling vs. Luma vs. Gemini Pro)
  2. Write **Technical Script** (Camera angles, lighting, motion)
  3. Generate **Invariant Tokens** (visual anchors that must persist)
* **Output:** Storyboard JSON with routing decision

### **The Artistic Director: Flux (via Fal.ai)**
* **Role:** **Rapid Visual Prototyping**
* **Model:** `fal-ai/flux/schnell` (Preview) / `fal-ai/flux/dev` (Remaster)
* **Input:**
  - Technical Script from DeepSeek
  - `style_reference_url` (for style consistency)
* **Task:** Generate static image previews from the Technical Script
* **Why Flux:** Sub-4s latency, proven Fal.ai integration, no GCP dependency

> **Future:** Migrate to Imagen 3 Fast when Vertex AI access is acquired.

### **The Production Engines (Dynamic Routing)**

| Engine | Use Case | Trigger Condition |
|--------|----------|-------------------|
| **Kling AI** | High physics/liquid dynamics | `physics_score > 0.7` |
| **Luma Dream Machine** | "Vibe" transfer, aesthetic motion | `vibe_score > 0.7` |
| **Gemini 3 Pro (Video)** | High logic/text requirements | `logic_score > 0.7` |

**Routing Priority:** Physics > Vibe > Logic (if multiple scores are high)

---

## 2. The Style Reference Pipeline (Maximum Semantic Fidelity)

### Problem Statement
Raw user uploads often contain noise (backgrounds, text overlays, compression artifacts) that cause **semantic drift** when passed directly to generation models.

### Solution: The "Brand Essence Distillation" Process

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STYLE REFERENCE GENERATION FLOW                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [User Upload]                                                           │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 1: GEMINI ANALYSIS                                        │    │
│  │  ───────────────────────────                                     │    │
│  │  • Extract Brand DNA (colors, mood, subject)                     │    │
│  │  • Calculate Scores (physics, vibe, logic)                       │    │
│  │  • Generate `brand_essence_prompt` (distilled description)       │    │
│  │  • Output: JSON + integrity_score                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 2: STYLE REFERENCE SYNTHESIS                              │    │
│  │  ──────────────────────────────────                              │    │
│  │  • Input: Original image + brand_essence_prompt                  │    │
│  │  • Process: Flux-Dev img2img (strength: 0.3-0.5)                 │    │
│  │  • Output: Clean, noise-free style reference                     │    │
│  │  • Store: Supabase Storage → `style_reference_url`               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ├──────────────────────┬──────────────────────┐                   │
│       ▼                      ▼                      ▼                   │
│  [DeepSeek]            [Flux Preview]         [Production]              │
│  Technical             Artistic               Engine Input              │
│  Director              Director               (Kling/Luma)              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Style Reference Specification

```typescript
interface StyleReference {
  /** Original user upload URL */
  original_url: string;
  
  /** Processed style reference (noise-free derivative) */
  style_reference_url: string;
  
  /** Distilled brand description for prompt injection */
  brand_essence_prompt: string;
  
  /** Dominant colors extracted (hex) */
  color_palette: string[];
  
  /** Visual anchors that must persist across all outputs */
  invariant_elements: string[];
  
  /** Processing metadata */
  processing: {
    method: 'flux-dev-img2img';
    strength: number;  // 0.3-0.5 recommended
    seed: number;      // For reproducibility
  };
}
```

### Why This Works
1. **Noise Reduction:** img2img at low strength removes artifacts while preserving essence
2. **Consistency:** Same `style_reference_url` feeds all downstream agents
3. **Reproducibility:** Stored seed allows regeneration if needed
4. **Semantic Anchor:** `brand_essence_prompt` provides textual grounding

---

## 3. Database Schema (Supabase SSOT)

### Table: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  plan VARCHAR(50) DEFAULT 'free' NOT NULL,
  credits_remaining INTEGER DEFAULT 10 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);
```

### Table: `vision_jobs` (Phase 3B - Brand Analysis)
```sql
CREATE TABLE vision_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Original Upload
  image_url TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash VARCHAR(64),  -- SHA256 for deduplication
  
  -- Style Reference (Generated)
  style_reference_url TEXT,
  brand_essence_prompt TEXT,
  
  -- Analysis Results
  status VARCHAR(20) DEFAULT 'pending' NOT NULL
    CHECK (status IN ('pending', 'analyzing', 'completed', 'flagged', 'failed')),
  analysis_data JSONB,  -- Full Gemini output
  
  -- Scores (denormalized for efficient routing queries)
  physics_score DECIMAL(3,2),
  vibe_score DECIMAL(3,2),
  logic_score DECIMAL(3,2),
  integrity_score DECIMAL(3,2),
  
  -- Error Tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- P0 Critical: Indexes on foreign keys and query columns
CREATE INDEX idx_vision_jobs_user_id ON vision_jobs(user_id);
CREATE INDEX idx_vision_jobs_status ON vision_jobs(status);
CREATE INDEX idx_vision_jobs_created_at ON vision_jobs(created_at DESC);
CREATE INDEX idx_vision_jobs_user_status ON vision_jobs(user_id, status);
CREATE INDEX idx_vision_jobs_routing ON vision_jobs(physics_score, vibe_score, logic_score);
```

### Table: `vision_job_video_prompts` (Phase 3C - The Director)
```sql
CREATE TABLE vision_job_video_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES vision_jobs(id) ON DELETE CASCADE,
  
  -- Routing Decision
  production_engine VARCHAR(20) NOT NULL
    CHECK (production_engine IN ('KLING', 'LUMA', 'GEMINI_PRO')),
  routing_reason TEXT,  -- Why this engine was selected
  
  -- Workflow State
  status VARCHAR(30) DEFAULT 'scripting' NOT NULL
    CHECK (status IN ('scripting', 'preview_generation', 'review', 'rendering', 'completed', 'failed')),
  
  -- Scene Data (JSONB array)
  scenes_data JSONB NOT NULL DEFAULT '[]',
  
  -- Conversation Context (for YELLOW flow)
  conversation_history JSONB DEFAULT '[]',
  
  -- External API Tracking
  external_job_id VARCHAR(100),  -- Kling/Luma job ID
  
  -- Cost Tracking
  credits_used DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_video_prompts_job_id ON vision_job_video_prompts(job_id);
CREATE INDEX idx_video_prompts_status ON vision_job_video_prompts(status);
CREATE INDEX idx_video_prompts_engine ON vision_job_video_prompts(production_engine);
```

### Table: `rate_limit_buckets` (P0 Critical)
```sql
CREATE TABLE rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL,  -- user_id:endpoint or ip:endpoint
  endpoint VARCHAR(100) NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  
  UNIQUE(identifier, endpoint)
);

CREATE INDEX idx_rate_limit_identifier ON rate_limit_buckets(identifier, endpoint);
CREATE INDEX idx_rate_limit_window_end ON rate_limit_buckets(window_end);
```

### Table: `audit_logs`
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### Scene Data Schema
```typescript
interface SceneData {
  id: string;  // UUID
  sequence_index: number;
  
  // From DeepSeek (Technical Director)
  cinematography_prompt: string;
  camera_movement: string;
  lighting_notes: string;
  invariant_token: string;  // Visual anchor
  
  // From Flux (Artistic Director)
  preview_image_url: string | null;
  preview_seed: number | null;
  
  // Traffic Light System
  traffic_light: 'PENDING' | 'GREEN' | 'YELLOW' | 'RED';
  user_feedback: string | null;
  
  // Production Output
  final_video_url: string | null;
  
  // Metadata
  attempt_count: number;
  created_at: string;
  updated_at: string;
}
```

---

## 4. The "Financial Firewall" Workflow

### State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DIRECTOR STATE MACHINE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐                                                           │
│  │ SCRIPTING │ ◄─────────────────────────────────────────┐              │
│  └─────┬────┘                                            │              │
│        │ DeepSeek generates script + routing             │              │
│        ▼                                                 │              │
│  ┌─────────────────────┐                                 │              │
│  │ PREVIEW_GENERATION  │                                 │              │
│  └─────────┬───────────┘                                 │              │
│            │ Flux generates 3 scene previews             │              │
│            ▼                                             │              │
│  ┌─────────────────────┐                                 │              │
│  │       REVIEW        │ ◄───────────────────┐           │              │
│  │  (Traffic Light)    │                     │           │              │
│  └─────────┬───────────┘                     │           │              │
│            │                                 │           │              │
│    ┌───────┼───────┬─────────────────┐       │           │              │
│    │       │       │                 │       │           │              │
│    ▼       ▼       ▼                 │       │           │              │
│   🟢      🟡       🔴                │       │           │              │
│  GREEN   YELLOW    RED               │       │           │              │
│    │       │       │                 │       │           │              │
│    │       │       └─────────────────┼───────┼───────────┘              │
│    │       │         Re-roll script  │       │  Re-roll scene           │
│    │       │                         │       │                          │
│    │       ▼                         │       │                          │
│    │  ┌────────────────┐             │       │                          │
│    │  │ YELLOW CONTEXT │             │       │                          │
│    │  │    (Gemini)    │─────────────┘       │                          │
│    │  └────────────────┘                     │                          │
│    │    Conversational edit                  │                          │
│    │                                         │                          │
│    ▼                                         │                          │
│  ┌─────────────────────┐                     │                          │
│  │     RENDERING       │                     │                          │
│  │  (Kling/Luma/Gemini)│                     │                          │
│  └─────────┬───────────┘                     │                          │
│            │                                 │                          │
│            ▼                                 │                          │
│  ┌─────────────────────┐                     │                          │
│  │     COMPLETED       │                     │                          │
│  └─────────────────────┘                     │                          │
│                                                                          │
│  ┌─────────────────────┐                                                │
│  │       FAILED        │ ◄── Error at any stage (with retry logic)      │
│  └─────────────────────┘                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Traffic Light Actions

| Status | Action | Agent Involved | Cost |
|--------|--------|----------------|------|
| 🟢 **GREEN** | Approve → Dispatch to production | Production Engine | $$ |
| 🟡 **YELLOW** | Conversational edit | Gemini 3 Pro | $ |
| 🔴 **RED** | Full re-roll of scene | DeepSeek + Flux | $ |

### YELLOW Flow: Conversational Context

When user selects YELLOW and provides feedback (e.g., "Make it warmer"), Gemini 3 Pro receives:

```typescript
interface YellowContextPayload {
  // Original brand context
  brand_essence_prompt: string;
  style_reference_url: string;
  
  // Current scene state
  current_scene: SceneData;
  
  // Historical context
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  
  // All user uploads (for reference)
  user_assets: Array<{
    url: string;
    type: 'image' | 'video';
    uploaded_at: string;
  }>;
  
  // Previous prompts used
  prompt_history: Array<{
    prompt: string;
    result_url: string;
    feedback: string | null;
  }>;
  
  // Current feedback
  user_feedback: string;
}
```

**Gemini's Task:** Generate an adjusted `cinematography_prompt` that incorporates the feedback while maintaining brand consistency.

---

## 5. Security & Validation (P0 Critical)

### 5.1 Input Validation (Zod Schemas)

All API inputs MUST be validated using Zod schemas before processing.

```typescript
// types/validation.ts

import { z } from 'zod';

// Sanitized string - removes control characters
const sanitizedString = z.string().transform((val) => 
  val.trim().replace(/[\x00-\x1F\x7F]/g, '')
);

// File upload validation
export const FileUploadSchema = z.object({
  filename: sanitizedString.min(1).max(255),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().int().positive().max(10 * 1024 * 1024), // 10MB
  data: z.string(), // base64
});

// Director init validation
export const InitDirectorSchema = z.object({
  jobId: z.string().uuid(),
  forceRemaster: z.boolean().default(false),
  preferredEngine: z.enum(['KLING', 'LUMA', 'GEMINI_PRO']).optional(),
});

// Refine action validation
export const RefineActionSchema = z.object({
  sceneId: z.string().uuid(),
  status: z.enum(['YELLOW', 'RED']),
  feedback: sanitizedString.max(500).optional(),
}).refine(
  (data) => data.status !== 'YELLOW' || (data.feedback && data.feedback.length > 0),
  { message: 'Feedback required for YELLOW status' }
);
```

### 5.2 File Upload Security

**Magic Byte Validation:** All uploads MUST be validated against their declared MIME type.

```typescript
const MAGIC_BYTES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // + WEBP at offset 8
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  
  return signatures.some(sig => 
    sig.every((byte, i) => buffer[i] === byte)
  );
}
```

**Additional Checks:**
- File size limit: 10MB
- Filename sanitization (remove path traversal, null bytes)
- SHA256 hash for deduplication

### 5.3 Rate Limiting

| Endpoint Type | Limit | Window | Identifier |
|---------------|-------|--------|------------|
| Upload | 20 req | 60s | user_id |
| Generate (DeepSeek/Flux) | 10 req | 60s | user_id |
| Refine | 30 req | 60s | user_id |
| Production (Kling/Luma) | 5 req | 60s | user_id |
| General API | 100 req | 60s | user_id or IP |

**Implementation:** Sliding window algorithm with Supabase persistence for distributed rate limiting.

### 5.4 Error Boundaries (React)

All React components MUST be wrapped in error boundaries:

```tsx
// Required error boundary structure
<ErrorBoundary
  fallback={(error, reset) => <ErrorFallback error={error} onReset={reset} />}
  onError={(error) => logToMonitoring(error)}
>
  <DirectorMode />
</ErrorBoundary>
```

### 5.5 Database Security

- All foreign key columns indexed (see schema above)
- Soft deletes (`deleted_at`) - no permanent deletion
- Row Level Security (RLS) policies:

```sql
-- Users can only access their own jobs
ALTER TABLE vision_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs" ON vision_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON vision_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 6. Error Handling & Fallback Strategy

### 6.1 Production Engine Fallbacks

```typescript
const ENGINE_FALLBACK_CHAIN = {
  'KLING': ['LUMA', 'GEMINI_PRO'],
  'LUMA': ['GEMINI_PRO', 'KLING'],
  'GEMINI_PRO': ['LUMA', 'KLING'],
};

async function dispatchToProduction(scene: SceneData, primaryEngine: ProductionEngine) {
  const engines = [primaryEngine, ...ENGINE_FALLBACK_CHAIN[primaryEngine]];
  
  for (const engine of engines) {
    try {
      return await callProductionEngine(engine, scene);
    } catch (error) {
      logError(`${engine} failed`, error);
      
      if (isRetryable(error)) {
        await delay(exponentialBackoff(attempt));
        continue;
      }
      
      // Try next engine in chain
      continue;
    }
  }
  
  throw new Error('All production engines failed');
}
```

### 6.2 Retry Configuration

| Service | Max Retries | Backoff | Timeout |
|---------|-------------|---------|---------|
| Gemini Analysis | 3 | Exponential (2s base) | 60s |
| DeepSeek Script | 3 | Exponential (2s base) | 30s |
| Flux Preview | 3 | Exponential (1s base) | 20s |
| Kling Production | 2 | Fixed (30s) | 300s |
| Luma Production | 2 | Fixed (30s) | 300s |

### 6.3 Error States & Recovery

```typescript
type ErrorState = {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  fallback_available: boolean;
  user_action: 'RETRY' | 'CONTACT_SUPPORT' | 'CHANGE_ENGINE';
};

const ERROR_HANDLERS: Record<string, ErrorState> = {
  'KLING_TIMEOUT': {
    code: 'PRODUCTION_TIMEOUT',
    message: 'Video generation is taking longer than expected',
    retryable: true,
    fallback_available: true,
    user_action: 'RETRY',
  },
  'LUMA_RATE_LIMIT': {
    code: 'EXTERNAL_RATE_LIMIT',
    message: 'Production service is busy. Trying alternate engine.',
    retryable: false,
    fallback_available: true,
    user_action: 'CHANGE_ENGINE',
  },
  'FLUX_GENERATION_FAILED': {
    code: 'PREVIEW_FAILED',
    message: 'Preview generation failed. Please try again.',
    retryable: true,
    fallback_available: false,
    user_action: 'RETRY',
  },
};
```

### 6.4 Circuit Breaker

Prevent cascade failures when external services are down:

```typescript
interface CircuitBreakerConfig {
  failureThreshold: 5;      // Failures before opening
  resetTimeout: 60000;      // ms before trying again
  monitorWindow: 120000;    // ms to track failures
}

// Circuit states: CLOSED (normal) → OPEN (blocked) → HALF_OPEN (testing)
```

---

## 7. Headless TDD Requirements

### Test File: `supabase/functions/tests/director-flow.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient } from './utils/test-client';

describe('Director Flow - Headless Tests', () => {
  
  // =========================================================================
  // TEST 1: Routing Logic
  // =========================================================================
  describe('Production Engine Routing', () => {
    it('should route high-physics content to Kling', async () => {
      const mockAnalysis = {
        physics_score: 0.85,
        vibe_score: 0.3,
        logic_score: 0.2,
      };
      
      const result = await determineProductionEngine(mockAnalysis);
      expect(result.engine).toBe('KLING');
      expect(result.reason).toContain('physics');
    });

    it('should route high-vibe content to Luma', async () => {
      const mockAnalysis = {
        physics_score: 0.2,
        vibe_score: 0.9,
        logic_score: 0.3,
      };
      
      const result = await determineProductionEngine(mockAnalysis);
      expect(result.engine).toBe('LUMA');
    });

    it('should route high-logic content to Gemini Pro', async () => {
      const mockAnalysis = {
        physics_score: 0.3,
        vibe_score: 0.2,
        logic_score: 0.85,
      };
      
      const result = await determineProductionEngine(mockAnalysis);
      expect(result.engine).toBe('GEMINI_PRO');
    });

    it('should prioritize physics when multiple scores are high', async () => {
      const mockAnalysis = {
        physics_score: 0.8,
        vibe_score: 0.8,
        logic_score: 0.8,
      };
      
      const result = await determineProductionEngine(mockAnalysis);
      expect(result.engine).toBe('KLING');
    });
  });

  // =========================================================================
  // TEST 2: Preview Generation
  // =========================================================================
  describe('Flux Preview Generation', () => {
    it('should generate valid preview URLs', async () => {
      const mockScript = {
        cinematography_prompt: 'Product hero shot, slow orbit, soft lighting',
        style_reference_url: 'https://storage.example.com/style_ref.jpg',
      };
      
      const result = await generateFluxPreview(mockScript);
      
      expect(result.preview_image_url).toMatch(/^https:\/\//);
      expect(result.preview_seed).toBeTypeOf('number');
    });

    it('should handle Flux API failure with retry', async () => {
      // Mock first two calls to fail
      mockFluxApi.failNextCalls(2);
      
      const result = await generateFluxPreview(mockScript);
      
      expect(result.preview_image_url).toBeTruthy();
      expect(mockFluxApi.callCount).toBe(3);
    });
  });

  // =========================================================================
  // TEST 3: Integrity Filter (Safety)
  // =========================================================================
  describe('Integrity Filter', () => {
    it('should flag low-integrity inputs', async () => {
      const mockAnalysis = {
        integrity_score: 0.35,  // Below 0.4 threshold
      };
      
      const result = await processAnalysis(mockAnalysis);
      
      expect(result.status).toBe('flagged');
      expect(result.flagged_reason).toContain('integrity');
    });

    it('should allow high-integrity inputs', async () => {
      const mockAnalysis = {
        integrity_score: 0.85,
      };
      
      const result = await processAnalysis(mockAnalysis);
      
      expect(result.status).not.toBe('flagged');
    });
  });

  // =========================================================================
  // TEST 4: Style Reference Generation
  // =========================================================================
  describe('Style Reference Pipeline', () => {
    it('should generate style reference from original image', async () => {
      const mockJob = {
        image_url: 'https://storage.example.com/original.jpg',
        brand_essence_prompt: 'Premium health product, clean aesthetic',
      };
      
      const result = await generateStyleReference(mockJob);
      
      expect(result.style_reference_url).toBeTruthy();
      expect(result.style_reference_url).not.toBe(mockJob.image_url);
      expect(result.processing.method).toBe('flux-dev-img2img');
      expect(result.processing.strength).toBeGreaterThanOrEqual(0.3);
      expect(result.processing.strength).toBeLessThanOrEqual(0.5);
    });
  });

  // =========================================================================
  // TEST 5: YELLOW Flow Context
  // =========================================================================
  describe('YELLOW Conversational Edit', () => {
    it('should maintain context across edits', async () => {
      const initialScene = await createTestScene();
      
      // First YELLOW edit
      const edit1 = await processYellowFeedback(initialScene.id, 'Make it warmer');
      expect(edit1.conversation_history).toHaveLength(2); // user + assistant
      
      // Second YELLOW edit
      const edit2 = await processYellowFeedback(initialScene.id, 'Add more motion');
      expect(edit2.conversation_history).toHaveLength(4);
      
      // Verify context is preserved
      expect(edit2.conversation_history[0].content).toContain('warmer');
    });
  });

  // =========================================================================
  // TEST 6: Error Handling & Fallbacks
  // =========================================================================
  describe('Production Engine Fallbacks', () => {
    it('should fallback to Luma when Kling fails', async () => {
      mockKlingApi.simulateFailure();
      
      const result = await dispatchToProduction(mockScene, 'KLING');
      
      expect(result.engine_used).toBe('LUMA');
      expect(result.fallback_triggered).toBe(true);
    });

    it('should open circuit breaker after repeated failures', async () => {
      mockKlingApi.simulateFailure();
      
      // Trigger 5 failures
      for (let i = 0; i < 5; i++) {
        await dispatchToProduction(mockScene, 'KLING').catch(() => {});
      }
      
      // Circuit should be open
      const circuitState = getCircuitState('KLING');
      expect(circuitState).toBe('OPEN');
    });
  });

  // =========================================================================
  // TEST 7: Rate Limiting
  // =========================================================================
  describe('Rate Limiting', () => {
    it('should block requests exceeding limit', async () => {
      const userId = 'test-user-123';
      
      // Send 11 requests (limit is 10)
      for (let i = 0; i < 10; i++) {
        await makeGenerateRequest(userId);
      }
      
      // 11th request should fail
      await expect(makeGenerateRequest(userId)).rejects.toThrow('TOO_MANY_REQUESTS');
    });
  });

  // =========================================================================
  // TEST 8: Input Validation
  // =========================================================================
  describe('Input Validation', () => {
    it('should reject invalid file types', async () => {
      const invalidUpload = {
        filename: 'test.exe',
        mimeType: 'application/x-executable',
        data: 'base64data',
      };
      
      await expect(uploadFile(invalidUpload)).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should sanitize filenames', async () => {
      const maliciousUpload = {
        filename: '../../../etc/passwd.jpg',
        mimeType: 'image/jpeg',
        data: validJpegBase64,
      };
      
      const result = await uploadFile(maliciousUpload);
      expect(result.stored_filename).not.toContain('..');
    });
  });
});
```

---

## 8. API Endpoints (tRPC)

### Router Structure

```typescript
// server/routers/index.ts
export const appRouter = router({
  health: healthRouter,
  vision: visionRouter,      // Phase 3B
  director: directorRouter,  // Phase 3C
});

// Key endpoints:
// vision.uploadImage
// vision.getJob
// vision.listJobs
// director.initDirector
// director.refineStoryboard
// director.approveScene
// director.approveProduction
// director.getState
```

---

## 9. Environment Variables

```bash
# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI Services
GEMINI_API_KEY=xxx
DEEPSEEK_API_KEY=xxx
FAL_API_KEY=xxx

# Production Engines
KLING_API_KEY=xxx
LUMA_API_KEY=xxx

# Rate Limiting
RATE_LIMIT_ENABLED=true

# Feature Flags
ENABLE_IMAGEN3=false  # Set true when Vertex AI access acquired
```

---

## 10. Migration Checklist

- [ ] Create Supabase project
- [ ] Run schema migrations
- [ ] Configure RLS policies
- [ ] Set up Supabase Storage buckets
- [ ] Configure Fal.ai API access
- [ ] Run headless tests (`director-flow.ts`)
- [ ] Deploy Edge Functions
- [ ] Build React UI

---

**Document Status:** Ready for Implementation  
**Next Step:** Run `director-flow.ts` tests headlessly before any UI work

```

---

## 5. Environment Template

### .env.example

```bash
# =============================================================================
# Supabase Configuration
# =============================================================================
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# =============================================================================
# Database Configuration
# =============================================================================
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres

# =============================================================================
# AI API Keys
# =============================================================================

# DeepSeek AI - For video script generation (The Director)
DEEPSEEK_API_KEY=sk-xxx

# Google Gemini - For brand analysis (Phase 3B)
GEMINI_API_KEY=xxx

# FAL AI - For Flux image generation (Previews & Style References)
FAL_API_KEY=xxx

# Kling AI - For physics-heavy video production
KLING_API_KEY=xxx

# Luma AI - For aesthetic video production
LUMA_API_KEY=xxx

# =============================================================================
# Storage Configuration
# =============================================================================

# Supabase Storage Bucket
STORAGE_BUCKET=brand-assets

# Alternative: External Storage (Optional)
# S3_BUCKET=xxx
# S3_REGION=xxx
# S3_ACCESS_KEY=xxx
# S3_SECRET_KEY=xxx

# =============================================================================
# Application Configuration
# =============================================================================

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API Configuration
API_BASE_URL=http://localhost:3000/api

# =============================================================================
# Rate Limiting (Optional Overrides)
# =============================================================================
RATE_LIMIT_GENERATE=10
RATE_LIMIT_UPLOAD=20
RATE_LIMIT_REFINE=30
RATE_LIMIT_GENERAL=100

# =============================================================================
# Feature Flags (Optional)
# =============================================================================
ENABLE_ANALYTICS=false
ENABLE_AUDIT_LOGS=true
ENABLE_AUTO_CLEANUP=true

```

---

## Generation Notes

- This snapshot excludes: `node_modules`, `.git`, `.next`, `dist`, `build`, `.claude`, `coverage`
- Tree structure shows directories first, then files alphabetically
- All file contents are captured as-is at generation time
- This report is auto-generated via `npm run report:arch`

**End of Architecture Snapshot**
