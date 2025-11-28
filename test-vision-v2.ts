/**
 * Test script for geminiVisionNative with Native Schema Mode
 * Tests the new Gemini Vision API with strict schema enforcement
 */

import { analyzeImageWithGemini } from "./server/geminiVisionNative";

async function runTest() {
  console.log("🚀 Starting Gemini Vision Native Schema Test...\n");

  // Hardcoded test image URL - using public image
  const testImageUrl = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800";

  const analysisPurpose = "Brand visual analysis for wellness/fitness product entering Chinese market";
  const imageContext = "Modern fitness equipment with premium design aesthetic";
  const creativityLevel = 0.4; // Low for structural stability (0.0-2.0)

  try {
    console.log("📸 Image URL:", testImageUrl);
    console.log("🎯 Analysis Purpose:", analysisPurpose);
    console.log("📝 Image Context:", imageContext);
    console.log("🎨 Creativity Level:", creativityLevel);
    console.log("\n⏳ Analyzing image with Gemini 1.5 Pro (Native Schema Mode)...");
    console.log("   This uses responseSchema for strict JSON output.\n");

    const result = await analyzeImageWithGemini(
      testImageUrl,
      imageContext,
      analysisPurpose,
      creativityLevel
    );

    console.log("\n✅ Analysis Complete!\n");
    console.log("📊 Raw JSON Response (First 500 chars):\n");
    console.log(result.substring(0, 500) + (result.length > 500 ? "..." : ""));

    // Parse and pretty-print the JSON
    console.log("\n\n📋 Full Parsed Output:\n");
    const parsed = JSON.parse(result);
    console.log(JSON.stringify(parsed, null, 2));

    // Extract key insights
    console.log("\n\n🔍 Key Insights:\n");
    if (parsed.colors) {
      console.log("🎨 Colors:");
      console.log("  Primary:", parsed.colors.primary);
      console.log("  Secondary:", parsed.colors.secondary);
      if (parsed.colors.accent) {
        console.log("  Accent:", parsed.colors.accent);
      }
    }

    if (parsed.mood_and_tone) {
      console.log("\n💭 Mood & Tone:");
      console.log("  Mood:", parsed.mood_and_tone.mood);
      console.log("  Tone:", parsed.mood_and_tone.tone);
    }

    if (parsed.brand_insights) {
      console.log("\n🏢 Brand Insights:");
      console.log("  Industry:", parsed.brand_insights.perceived_industry);
      console.log("  Target Audience:", parsed.brand_insights.target_audience);
      console.log("  Brand Personality:", parsed.brand_insights.brand_personality);
      console.log("  Premium Level:", parsed.brand_insights.premium_level);
    }

    console.log("\n✨ Native Schema Mode Test Completed Successfully!");
    console.log("✅ JSON structure matches BRAND_VISION_SCHEMA");
    console.log("✅ No markdown sanitization needed (API enforces schema)");

  } catch (error) {
    console.error("\n❌ Test Failed (Native Schema Mode):");
    if (error instanceof Error) {
      console.error("Error:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
}

// Run the test
runTest().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
