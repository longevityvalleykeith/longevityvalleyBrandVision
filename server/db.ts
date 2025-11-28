import { eq, and, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  brands, 
  Brand, 
  InsertBrand,
  brandAssets,
  BrandAsset,
  InsertBrandAsset,
  brandInputs,
  BrandInput,
  InsertBrandInput,
  generatedContent,
  GeneratedContent,
  InsertGeneratedContent,
  conversations,
  Conversation,
  InsertConversation,
  visionJobs,
  VisionJob,
  InsertVisionJob,
  visionJobSessions,
  VisionJobSession,
  InsertVisionJobSession,
  visionJobOutputs,
  VisionJobOutput,
  InsertVisionJobOutput
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Brand management functions
export async function createBrand(brand: InsertBrand): Promise<Brand> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(brands).values(brand);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(brands).where(eq(brands.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getBrandsByUserId(userId: number): Promise<Brand[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(brands).where(eq(brands.userId, userId));
}

export async function getBrandById(brandId: number): Promise<Brand | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
  return result[0];
}

// Brand assets functions
export async function createBrandAsset(asset: InsertBrandAsset): Promise<BrandAsset> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(brandAssets).values(asset);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(brandAssets).where(eq(brandAssets.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getBrandAssetsByBrandId(brandId: number): Promise<BrandAsset[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(brandAssets).where(eq(brandAssets.brandId, brandId));
}

// Brand inputs (freemium form) functions
export async function createBrandInput(input: InsertBrandInput): Promise<BrandInput> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(brandInputs).values(input);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(brandInputs).where(eq(brandInputs.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getBrandInputsByUserId(userId: number): Promise<BrandInput[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(brandInputs).where(eq(brandInputs.userId, userId));
}

export async function getBrandInputById(inputId: number): Promise<BrandInput | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(brandInputs).where(eq(brandInputs.id, inputId)).limit(1);
  return result[0];
}

// Generated content functions
export async function createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(generatedContent).values(content);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(generatedContent).where(eq(generatedContent.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getGeneratedContentByInputId(inputId: number): Promise<GeneratedContent[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(generatedContent).where(eq(generatedContent.inputId, inputId));
}

export async function updateContentFeedback(
  contentId: number, 
  feedbackScore: number, 
  feedbackText?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(generatedContent)
    .set({ 
      userFeedbackScore: feedbackScore,
      userFeedbackText: feedbackText,
      updatedAt: new Date()
    })
    .where(eq(generatedContent.id, contentId));
}

// Conversation functions
export async function createConversation(conversation: InsertConversation): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values(conversation);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(conversations).where(eq(conversations.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function getConversationsByUserId(userId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(conversations).where(eq(conversations.userId, userId));
}

export async function updateConversation(conversationId: number, messageLog: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(conversations)
    .set({ 
      messageLog,
      updatedAt: new Date()
    })
    .where(eq(conversations.id, conversationId));
}

// ============================================================================
// Vision Job Queue Functions
// ============================================================================

/**
 * Create a new vision job
 * Returns the created job with all fields populated
 */
export async function createVisionJob(
  userId: number,
  imageUrl: string,
  analysisPurpose: string,
  outputFormat: string,
  creativityLevel: number,
  imageContext?: string,
  additionalInstructions?: string
): Promise<VisionJob> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(visionJobs).values({
    userId,
    imageUrl,
    imageContext: imageContext || null,
    analysisPurpose,
    outputFormat,
    creativityLevel: creativityLevel.toString(),
    additionalInstructions: additionalInstructions || null,
    status: "pending",
    progress: 0,
    retryCount: 0,
    maxRetries: 3,
  });

  const jobId = Number(result[0].insertId);
  const jobs = await db
    .select()
    .from(visionJobs)
    .where(eq(visionJobs.id, jobId));

  if (!jobs[0]) throw new Error("Failed to create vision job");
  return jobs[0];
}

/**
 * Get the next pending job for processing (FIFO order)
 * Returns the oldest pending job, or null if none exist
 */
export async function getNextPendingVisionJob(): Promise<VisionJob | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(visionJobs)
    .where(eq(visionJobs.status, "pending"))
    .orderBy(visionJobs.createdAt)
    .limit(1);

  return result[0] || null;
}

/**
 * Get vision job by ID
 */
export async function getVisionJobById(jobId: number): Promise<VisionJob | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(visionJobs)
    .where(eq(visionJobs.id, jobId));

  return result[0] || null;
}

/**
 * Update vision job status and progress
 * Handles all status transitions and output storage
 */
export async function updateVisionJobStatus(
  jobId: number,
  status: VisionJob["status"],
  progress: number,
  updates?: {
    geminOutput?: string;
    deepseekOutput?: string;
    errorMessage?: string;
    errorStage?: string;
    retryCount?: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    status,
    progress,
    updatedAt: new Date(),
  };

  if (updates?.geminOutput) {
    updateData.geminOutput = updates.geminOutput;
    updateData.geminAnalyzedAt = new Date();
  }

  if (updates?.deepseekOutput) {
    updateData.deepseekOutput = updates.deepseekOutput;
    updateData.deepseekGeneratedAt = new Date();
  }

  if (updates?.errorMessage) {
    updateData.errorMessage = updates.errorMessage;
  }

  if (updates?.errorStage) {
    updateData.errorStage = updates.errorStage;
  }

  if (updates?.retryCount !== undefined) {
    updateData.retryCount = updates.retryCount;
  }

  if (status === "complete") {
    updateData.completedAt = new Date();
  }

  await db.update(visionJobs).set(updateData).where(eq(visionJobs.id, jobId));
}

/**
 * Get all jobs for a user (for history/dashboard)
 */
export async function getUserVisionJobs(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<VisionJob[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(visionJobs)
    .where(eq(visionJobs.userId, userId))
    .orderBy(visionJobs.createdAt)
    .limit(limit)
    .offset(offset);
}

/**
 * Get failed jobs that need retry
 * Returns jobs with status='error' and retryCount < maxRetries
 */
export async function getFailedJobsForRetry(): Promise<VisionJob[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(visionJobs)
    .where(
      and(
        eq(visionJobs.status, "error"),
        lt(visionJobs.retryCount, visionJobs.maxRetries)
      )
    )
    .orderBy(visionJobs.updatedAt)
    .limit(5);
}

/**
 * Mark job as complete and store structured outputs
 * Parses Gemini and DeepSeek outputs and stores in visionJobOutputs
 */
export async function completeVisionJob(
  jobId: number,
  geminOutput: string,
  deepseekOutput: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Strip markdown formatting from AI responses before parsing
  const cleanGeminOutput = geminOutput.replace(/```json\n?|\n?```/g, "").trim();
  const cleanDeepseekOutput = deepseekOutput.replace(/```json\n?|\n?```/g, "").trim();

  // Update job status with cleaned outputs
  await updateVisionJobStatus(jobId, "complete", 100, {
    geminOutput: cleanGeminOutput,
    deepseekOutput: cleanDeepseekOutput,
  });

  // Get job details for output storage
  const job = await getVisionJobById(jobId);
  if (!job) throw new Error("Job not found");

  // Parse outputs for structured storage
  let geminData: any = {};
  let deepseekData: any = [];

  try {
    const geminParsed = JSON.parse(cleanGeminOutput);
    geminData = {
      colors_primary: geminParsed.colors?.primary ? JSON.stringify(geminParsed.colors.primary) : null,
      colors_secondary: geminParsed.colors?.secondary ? JSON.stringify(geminParsed.colors.secondary) : null,
      colors_description: geminParsed.colors?.description || null,
      mood: geminParsed.mood_and_tone?.mood || null,
      tone: geminParsed.mood_and_tone?.tone || null,
      composition_layout: geminParsed.composition?.layout || null,
      brand_personality: geminParsed.brand_insights?.brand_personality || null,
      perceived_industry: geminParsed.brand_insights?.perceived_industry || null,
      target_audience: geminParsed.brand_insights?.target_audience || null,
    };

    deepseekData = JSON.parse(cleanDeepseekOutput);
  } catch (e) {
    console.error("[DB] Failed to parse AI outputs:", e);
  }

  // Store structured outputs for dataset training
  await db.insert(visionJobOutputs).values({
    jobId,
    userId: job.userId,
    colors_primary: geminData.colors_primary,
    colors_secondary: geminData.colors_secondary,
    colors_description: geminData.colors_description,
    mood: geminData.mood,
    tone: geminData.tone,
    composition_layout: geminData.composition_layout,
    brand_personality: geminData.brand_personality,
    perceived_industry: geminData.perceived_industry,
    target_audience: geminData.target_audience,
    content_pieces: JSON.stringify(deepseekData),
    isTrainingData: true,
  });
}

/**
 * Create a job session for SSE streaming
 * Used to track active connections and route updates
 */
export async function createVisionJobSession(
  jobId: number,
  userId: number,
  sessionId: string
): Promise<VisionJobSession> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(visionJobSessions).values({
    jobId,
    userId,
    sessionId,
    isActive: true,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
  });

  const sessionDbId = Number(result[0].insertId);
  const sessions = await db
    .select()
    .from(visionJobSessions)
    .where(eq(visionJobSessions.id, sessionDbId));

  if (!sessions[0]) throw new Error("Failed to create vision job session");
  return sessions[0];
}

/**
 * Get active sessions for a job
 * Used to broadcast progress updates to all connected clients
 */
export async function getActiveSessionsForJob(jobId: number): Promise<VisionJobSession[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(visionJobSessions)
    .where(
      and(
        eq(visionJobSessions.jobId, jobId),
        eq(visionJobSessions.isActive, true)
      )
    );
}

/**
 * Mark a session as inactive
 * Called when SSE connection closes
 */
export async function deactivateVisionJobSession(sessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(visionJobSessions)
    .set({ isActive: false })
    .where(eq(visionJobSessions.sessionId, sessionId));
}

/**
 * Get job output for display
 * Returns parsed Gemini and DeepSeek outputs
 */
export async function getVisionJobOutput(jobId: number): Promise<VisionJobOutput | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(visionJobOutputs)
    .where(eq(visionJobOutputs.jobId, jobId));

  return result[0] || null;
}
