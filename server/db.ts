import { eq } from "drizzle-orm";
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
  InsertConversation
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
