import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Content Generation Workflow", () => {
  it("should generate Mandarin content from product details", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contentGeneration.generate({
      productInfo: "A premium wellness tea blend made from organic herbs that promotes relaxation and better sleep quality.",
      sellingPoints: "100% organic ingredients, scientifically proven to improve sleep, no artificial additives, traditional Chinese medicine inspired",
      targetAudience: "Health-conscious professionals aged 25-45 who struggle with sleep quality",
      painPoints: "Stress, insomnia, poor sleep quality, reliance on sleeping pills",
      scenarios: "Before bedtime, during stressful work periods, as part of evening relaxation routine",
      ctaOffer: "First-time buyers get 20% off with code SLEEP20",
    });

    // Verify the result structure
    expect(result).toHaveProperty("inputId");
    expect(result).toHaveProperty("content");
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content.length).toBe(5);

    // Verify each content piece has required fields
    result.content.forEach((piece) => {
      expect(piece).toHaveProperty("id");
      expect(piece).toHaveProperty("storyboardMandarin");
      expect(piece).toHaveProperty("captionMandarin");
      expect(piece).toHaveProperty("explanationEnglish");
      
      // Verify content is not empty
      expect(piece.storyboardMandarin.length).toBeGreaterThan(0);
      expect(piece.captionMandarin.length).toBeGreaterThan(0);
      expect(piece.explanationEnglish.length).toBeGreaterThan(0);
    });
  }, 60000); // 60 second timeout for AI generation

  it("should retrieve generated content by input ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First generate content
    const generated = await caller.contentGeneration.generate({
      productInfo: "Organic wellness supplement for energy boost",
      sellingPoints: "Natural ingredients, sustained energy, no crash",
    });

    // Then retrieve it
    const retrieved = await caller.contentGeneration.getByInputId({
      inputId: generated.inputId,
    });

    expect(Array.isArray(retrieved)).toBe(true);
    expect(retrieved.length).toBe(5);
    expect(retrieved[0]?.inputId).toBe(generated.inputId);
  }, 60000);

  it("should submit feedback on generated content", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Generate content first
    const generated = await caller.contentGeneration.generate({
      productInfo: "Test product for feedback",
      sellingPoints: "Test selling points",
    });

    const contentId = generated.content[0]!.id;

    // Submit positive feedback
    const result = await caller.contentGeneration.submitFeedback({
      contentId,
      score: 1,
      text: "Very helpful and culturally accurate!",
    });

    expect(result.success).toBe(true);

    // Verify feedback was saved
    const retrieved = await caller.contentGeneration.getByInputId({
      inputId: generated.inputId,
    });

    const feedbackPiece = retrieved.find((p) => p.id === contentId);
    expect(feedbackPiece?.userFeedbackScore).toBe(1);
    expect(feedbackPiece?.userFeedbackText).toBe("Very helpful and culturally accurate!");
  }, 60000);

  it("should retrieve user's content generation history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Generate some content
    await caller.contentGeneration.generate({
      productInfo: "First product",
      sellingPoints: "First selling points",
    });

    await caller.contentGeneration.generate({
      productInfo: "Second product",
      sellingPoints: "Second selling points",
    });

    // Retrieve history
    const history = await caller.contentGeneration.history();

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThanOrEqual(2);
    
    // Verify history items have required fields
    history.forEach((item) => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("userId");
      expect(item).toHaveProperty("productInfo");
      expect(item).toHaveProperty("sellingPoints");
      expect(item).toHaveProperty("createdAt");
    });
  }, 120000); // 120 seconds for multiple generations
});

describe("Brand Management", () => {
  it("should create a brand", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const brand = await caller.brand.create({
      brandName: "Test Wellness Brand",
      logoUrl: "https://example.com/logo.png",
    });

    expect(brand).toHaveProperty("id");
    expect(brand.brandName).toBe("Test Wellness Brand");
    expect(brand.logoUrl).toBe("https://example.com/logo.png");
    expect(brand.userId).toBe(ctx.user!.id);
  });

  it("should list user's brands", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a brand
    await caller.brand.create({
      brandName: "My Wellness Brand",
    });

    // List brands
    const brands = await caller.brand.list();

    expect(Array.isArray(brands)).toBe(true);
    expect(brands.length).toBeGreaterThanOrEqual(1);
    expect(brands.some((b) => b.brandName === "My Wellness Brand")).toBe(true);
  });
});
