import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Brand profiles for users
 * Stores brand identity and visual assets
 */
export const brands = mysqlTable("brands", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  brandName: varchar("brandName", { length: 255 }).notNull(),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = typeof brands.$inferInsert;

/**
 * Brand visual assets (photos, videos)
 * Stores additional brand context beyond the logo
 */
export const brandAssets = mysqlTable("brandAssets", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull(),
  assetType: mysqlEnum("assetType", ["photo", "video"]).notNull(),
  storageUrl: text("storageUrl").notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BrandAsset = typeof brandAssets.$inferSelect;
export type InsertBrandAsset = typeof brandAssets.$inferInsert;

/**
 * Freemium tool inputs
 * Stores the product detail form submissions
 */
export const brandInputs = mysqlTable("brandInputs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productInfo: text("productInfo").notNull(),
  sellingPoints: text("sellingPoints").notNull(),
  targetAudience: text("targetAudience"),
  painPoints: text("painPoints"),
  scenarios: text("scenarios"),
  ctaOffer: text("ctaOffer"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BrandInput = typeof brandInputs.$inferSelect;
export type InsertBrandInput = typeof brandInputs.$inferInsert;

/**
 * Generated content pieces
 * Stores the AI-generated Mandarin content with feedback
 */
export const generatedContent = mysqlTable("generatedContent", {
  id: int("id").autoincrement().primaryKey(),
  inputId: int("inputId").notNull(),
  userId: int("userId").notNull(),
  storyboardMandarin: text("storyboardMandarin").notNull(),
  captionMandarin: text("captionMandarin").notNull(),
  explanationEnglish: text("explanationEnglish").notNull(),
  userFeedbackScore: int("userFeedbackScore"), // 1 for thumbs up, -1 for thumbs down
  userFeedbackText: text("userFeedbackText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = typeof generatedContent.$inferInsert;

/**
 * A.I. Brand Specialist conversations
 * Stores chat history for the premium feature
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  brandId: int("brandId"),
  messageLog: text("messageLog").notNull(), // JSON array of messages
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Brand Vision Pipeline - Job Queue
 * Tracks asynchronous vision analysis and content generation jobs
 * Status flow: pending → gemini_analyzing → deepseek_generating → complete (or error)
 */
export const visionJobs = mysqlTable("visionJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageContext: text("imageContext"),
  analysisPurpose: text("analysisPurpose").notNull(),
  outputFormat: varchar("outputFormat", { length: 50 }).notNull(),
  creativityLevel: decimal("creativityLevel", { precision: 2, scale: 1 }).default("1.0").notNull(),
  additionalInstructions: text("additionalInstructions"),
  status: mysqlEnum("status", ["pending", "gemini_analyzing", "deepseek_generating", "complete", "error"]).default("pending").notNull(),
  progress: int("progress").default(0).notNull(),
  geminOutput: text("geminOutput"),
  deepseekOutput: text("deepseekOutput"),
  geminAnalyzedAt: timestamp("geminAnalyzedAt"),
  deepseekGeneratedAt: timestamp("deepseekGeneratedAt"),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  errorStage: varchar("errorStage", { length: 50 }),
  retryCount: int("retryCount").default(0).notNull(),
  maxRetries: int("maxRetries").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VisionJob = typeof visionJobs.$inferSelect;
export type InsertVisionJob = typeof visionJobs.$inferInsert;

/**
 * Brand Vision Pipeline - Job Sessions
 * Tracks active SSE connections for real-time progress updates
 */
export const visionJobSessions = mysqlTable("visionJobSessions", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type VisionJobSession = typeof visionJobSessions.$inferSelect;
export type InsertVisionJobSession = typeof visionJobSessions.$inferInsert;

/**
 * Brand Vision Pipeline - Job Outputs
 * Stores structured outputs for dataset training and future analysis
 */
export const visionJobOutputs = mysqlTable("visionJobOutputs", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  userId: int("userId").notNull(),
  colors_primary: text("colors_primary"),
  colors_secondary: text("colors_secondary"),
  colors_description: text("colors_description"),
  mood: varchar("mood", { length: 255 }),
  tone: varchar("tone", { length: 255 }),
  composition_layout: text("composition_layout"),
  brand_personality: text("brand_personality"),
  perceived_industry: varchar("perceived_industry", { length: 255 }),
  target_audience: text("target_audience"),
  content_pieces: text("content_pieces"),
  isTrainingData: boolean("isTrainingData").default(true).notNull(),
  userRating: int("userRating"),
  userFeedback: text("userFeedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VisionJobOutput = typeof visionJobOutputs.$inferSelect;
export type InsertVisionJobOutput = typeof visionJobOutputs.$inferInsert;

/**
 * Brand Vision Pipeline - Video Prompts
 * Stores the state and prompts for the Video Director Mode (Phase 3C)
 */
export const visionJobVideoPrompts = mysqlTable("visionJobVideoPrompts", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().unique(), // Foreign key to visionJobs
  directorOutput: text("directorOutput").notNull(), // Stores the DirectorState object (JSON string)
  status: mysqlEnum("status", ["reviewing", "production", "complete", "error"]).default("reviewing").notNull(),
  remasteredImageUrl: text("remasteredImageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VisionJobVideoPrompt = typeof visionJobVideoPrompts.$inferSelect;
export type InsertVisionJobVideoPrompt = typeof visionJobVideoPrompts.$inferInsert;
