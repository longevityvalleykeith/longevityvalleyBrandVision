# Brand Vision Pipeline - Database Schema Design

## Overview

This document defines the database schema required for the Brand Vision Pipeline Pro feature. The schema supports:

1. **Job Queue Management** - Track async processing state
2. **Pipeline State** - Store intermediate and final outputs
3. **User Association** - Link jobs to users for access control
4. **Error Tracking** - Log failures for debugging

---

## Database Tables

### 1. `visionJobs` Table

Stores the state of each Brand Vision Pipeline job.

```sql
CREATE TABLE visionJobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  
  -- Job Status & Progress
  status ENUM('pending', 'gemini_analyzing', 'deepseek_generating', 'complete', 'error') DEFAULT 'pending',
  progress INT DEFAULT 0,  -- 0-100 percentage
  
  -- Input Data
  imageUrl VARCHAR(2048) NOT NULL,  -- R2 CDN URL
  imageContext TEXT,  -- User's description of the image (optional)
  analysisPurpose VARCHAR(255),  -- What they want to create
  outputFormat VARCHAR(100),  -- e.g., "bullet_points", "detailed_analysis", "social_media_post"
  creativityLevel FLOAT DEFAULT 1.0,  -- 0.0 (precise) to 2.0 (creative)
  additionalInstructions TEXT,  -- Optional extra guidance for AI
  
  -- Gemini Vision Output
  geminOutput LONGTEXT,  -- JSON string of Gemini analysis
  geminAnalyzedAt TIMESTAMP NULL,
  
  -- DeepSeek Generation Output
  deepseekOutput LONGTEXT,  -- JSON string of DeepSeek content
  deepseekGeneratedAt TIMESTAMP NULL,
  
  -- Error Handling
  errorMessage TEXT,  -- Error details if status = 'error'
  errorStage ENUM('upload', 'gemini', 'deepseek', 'storage') NULL,  -- Which stage failed
  retryCount INT DEFAULT 0,
  maxRetries INT DEFAULT 3,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completedAt TIMESTAMP NULL,
  
  -- Indexing
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId_status (userId, status),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
);
```

**Key Fields Explained:**

| Field | Type | Purpose |
|-------|------|---------|
| `status` | ENUM | Pipeline state: pending → gemini_analyzing → deepseek_generating → complete/error |
| `progress` | INT | Real-time progress (0-100) sent to frontend via SSE |
| `imageUrl` | VARCHAR | Cloudflare R2 CDN URL of the uploaded image |
| `geminOutput` | LONGTEXT | Full JSON output from Gemini (colors, mood, composition, etc.) |
| `deepseekOutput` | LONGTEXT | Full JSON output from DeepSeek (5 content pieces) |
| `errorMessage` | TEXT | Detailed error log for debugging |
| `retryCount` | INT | Track retry attempts for failed jobs |

---

### 2. `visionJobSessions` Table (Optional - For Real-Time Tracking)

Stores active SSE sessions so the backend knows which clients are listening.

```sql
CREATE TABLE visionJobSessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jobId INT NOT NULL,
  userId INT NOT NULL,
  sessionId VARCHAR(255) UNIQUE NOT NULL,  -- Random UUID per SSE connection
  connectedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastHeartbeatAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isActive BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (jobId) REFERENCES visionJobs(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_jobId (jobId),
  INDEX idx_sessionId (sessionId)
);
```

**Purpose**: Track which users are listening to which jobs' SSE streams. Allows backend to send updates only to active listeners.

---

### 3. `visionJobOutputs` Table (Optional - For Dataset Training)

Stores outputs separately for easier querying and dataset export.

```sql
CREATE TABLE visionJobOutputs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  jobId INT NOT NULL,
  userId INT NOT NULL,
  
  -- Gemini Analysis
  colors_primary JSON,  -- ["#HEX1", "#HEX2"]
  colors_secondary JSON,
  colors_description VARCHAR(500),
  mood VARCHAR(100),
  tone VARCHAR(255),
  composition_layout VARCHAR(100),
  brand_personality VARCHAR(500),
  perceived_industry VARCHAR(100),
  target_audience VARCHAR(255),
  
  -- DeepSeek Content (5 pieces)
  content_pieces JSON,  -- Array of {storyboardMandarin, captionMandarin, explanationEnglish}
  
  -- Metadata for Training
  userFeedback ENUM('helpful', 'not_helpful', 'needs_revision') NULL,
  feedbackComment TEXT,
  isTrainingData BOOLEAN DEFAULT FALSE,  -- Mark for dataset training
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (jobId) REFERENCES visionJobs(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_isTrainingData (isTrainingData),
  INDEX idx_userFeedback (userFeedback)
);
```

**Purpose**: Structured storage for dataset training. Allows easy export of high-quality outputs for fine-tuning models.

---

## Drizzle ORM Schema Definition

```typescript
// drizzle/schema.ts additions

import {
  int,
  varchar,
  text,
  longtext,
  timestamp,
  enum as dbEnum,
  float,
  boolean,
  json,
  mysqlTable,
  index,
  foreignKey,
} from "drizzle-orm/mysql-core";

export const visionJobs = mysqlTable(
  "visionJobs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),

    // Job Status & Progress
    status: dbEnum("status", [
      "pending",
      "gemini_analyzing",
      "deepseek_generating",
      "complete",
      "error",
    ])
      .default("pending")
      .notNull(),
    progress: int("progress").default(0),

    // Input Data
    imageUrl: varchar("imageUrl", { length: 2048 }).notNull(),
    imageContext: text("imageContext"),
    analysisPurpose: varchar("analysisPurpose", { length: 255 }),
    outputFormat: varchar("outputFormat", { length: 100 }),
    creativityLevel: float("creativityLevel").default(1.0),
    additionalInstructions: text("additionalInstructions"),

    // Gemini Vision Output
    geminOutput: longtext("geminOutput"),
    geminAnalyzedAt: timestamp("geminAnalyzedAt"),

    // DeepSeek Generation Output
    deepseekOutput: longtext("deepseekOutput"),
    deepseekGeneratedAt: timestamp("deepseekGeneratedAt"),

    // Error Handling
    errorMessage: text("errorMessage"),
    errorStage: dbEnum("errorStage", [
      "upload",
      "gemini",
      "deepseek",
      "storage",
    ]),
    retryCount: int("retryCount").default(0),
    maxRetries: int("maxRetries").default(3),

    // Metadata
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .onUpdateNow()
      .notNull(),
    completedAt: timestamp("completedAt"),
  },
  (table) => ({
    userIdStatusIdx: index("idx_userId_status").on(table.userId, table.status),
    statusIdx: index("idx_status").on(table.status),
    createdAtIdx: index("idx_createdAt").on(table.createdAt),
    userIdFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      onDelete: "cascade",
    }),
  })
);

export type VisionJob = typeof visionJobs.$inferSelect;
export type InsertVisionJob = typeof visionJobs.$inferInsert;

export const visionJobSessions = mysqlTable(
  "visionJobSessions",
  {
    id: int("id").autoincrement().primaryKey(),
    jobId: int("jobId").notNull(),
    userId: int("userId").notNull(),
    sessionId: varchar("sessionId", { length: 255 }).unique().notNull(),
    connectedAt: timestamp("connectedAt").defaultNow().notNull(),
    lastHeartbeatAt: timestamp("lastHeartbeatAt").defaultNow().notNull(),
    isActive: boolean("isActive").default(true),
  },
  (table) => ({
    jobIdIdx: index("idx_jobId").on(table.jobId),
    sessionIdIdx: index("idx_sessionId").on(table.sessionId),
    jobIdFk: foreignKey({
      columns: [table.jobId],
      foreignColumns: [visionJobs.id],
      onDelete: "cascade",
    }),
    userIdFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      onDelete: "cascade",
    }),
  })
);

export type VisionJobSession = typeof visionJobSessions.$inferSelect;
export type InsertVisionJobSession =
  typeof visionJobSessions.$inferInsert;

export const visionJobOutputs = mysqlTable(
  "visionJobOutputs",
  {
    id: int("id").autoincrement().primaryKey(),
    jobId: int("jobId").notNull(),
    userId: int("userId").notNull(),

    // Gemini Analysis (structured fields for querying)
    colors_primary: json("colors_primary"),
    colors_secondary: json("colors_secondary"),
    colors_description: varchar("colors_description", { length: 500 }),
    mood: varchar("mood", { length: 100 }),
    tone: varchar("tone", { length: 255 }),
    composition_layout: varchar("composition_layout", { length: 100 }),
    brand_personality: varchar("brand_personality", { length: 500 }),
    perceived_industry: varchar("perceived_industry", { length: 100 }),
    target_audience: varchar("target_audience", { length: 255 }),

    // DeepSeek Content
    content_pieces: json("content_pieces"),

    // Metadata for Training
    userFeedback: dbEnum("userFeedback", [
      "helpful",
      "not_helpful",
      "needs_revision",
    ]),
    feedbackComment: text("feedbackComment"),
    isTrainingData: boolean("isTrainingData").default(false),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    isTrainingDataIdx: index("idx_isTrainingData").on(table.isTrainingData),
    userFeedbackIdx: index("idx_userFeedback").on(table.userFeedback),
    jobIdFk: foreignKey({
      columns: [table.jobId],
      foreignColumns: [visionJobs.id],
      onDelete: "cascade",
    }),
    userIdFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      onDelete: "cascade",
    }),
  })
);

export type VisionJobOutput = typeof visionJobOutputs.$inferSelect;
export type InsertVisionJobOutput = typeof visionJobOutputs.$inferInsert;
```

---

## Migration Strategy

1. **Step 1**: Add new tables to `drizzle/schema.ts`
2. **Step 2**: Run `pnpm db:push` to apply migrations
3. **Step 3**: Verify tables exist in database
4. **Step 4**: Create database helper functions in `server/db.ts`

---

## Database Helper Functions (server/db.ts)

```typescript
// Create a new vision job
export async function createVisionJob(
  userId: number,
  imageUrl: string,
  analysisPurpose: string,
  outputFormat: string,
  creativityLevel: number,
  additionalInstructions?: string
): Promise<VisionJob> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(visionJobs).values({
    userId,
    imageUrl,
    analysisPurpose,
    outputFormat,
    creativityLevel,
    additionalInstructions,
    status: "pending",
  });

  return result[0];
}

// Get pending job for processing
export async function getPendingVisionJob(): Promise<VisionJob | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(visionJobs)
    .where(eq(visionJobs.status, "pending"))
    .limit(1);

  return result[0] || null;
}

// Update job status and progress
export async function updateVisionJobStatus(
  jobId: number,
  status: VisionJob["status"],
  progress: number,
  geminOutput?: string,
  deepseekOutput?: string,
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: any = {
    status,
    progress,
    updatedAt: new Date(),
  };

  if (geminOutput) {
    updates.geminOutput = geminOutput;
    updates.geminAnalyzedAt = new Date();
  }

  if (deepseekOutput) {
    updates.deepseekOutput = deepseekOutput;
    updates.deepseekGeneratedAt = new Date();
  }

  if (errorMessage) {
    updates.errorMessage = errorMessage;
  }

  if (status === "complete") {
    updates.completedAt = new Date();
  }

  await db.update(visionJobs).set(updates).where(eq(visionJobs.id, jobId));
}

// Get job by ID
export async function getVisionJobById(jobId: number): Promise<VisionJob | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(visionJobs)
    .where(eq(visionJobs.id, jobId));

  return result[0] || null;
}
```

---

## Summary

| Table | Purpose | Rows/Day | Retention |
|-------|---------|----------|-----------|
| `visionJobs` | Job queue & state | 100-1000 | 90 days |
| `visionJobSessions` | Active SSE connections | 100-1000 | Real-time only |
| `visionJobOutputs` | Dataset training | 50-500 | Permanent |

**Total Storage**: ~50MB per 10,000 jobs (including JSON outputs)

---

**Status**: Ready for implementation. Proceed to Phase 3 (Job Queue Implementation).
