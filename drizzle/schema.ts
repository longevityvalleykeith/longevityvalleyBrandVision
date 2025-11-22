import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

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
  // Stripe subscription fields
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "pro", "enterprise"]).default("free").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "canceled", "past_due", "trialing", "incomplete"]),
  subscriptionEndsAt: timestamp("subscriptionEndsAt"),
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
