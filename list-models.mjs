import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not set");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // Try with gemini-2.0-flash first
    console.log("Testing gemini-2.0-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Hello");
    console.log("✅ gemini-2.0-flash is available\n");
    console.log("Recommended models:");
    console.log("  - gemini-2.0-flash (Latest, fastest)");
    console.log("  - gemini-1.5-flash (Fast, efficient)");
    console.log("  - gemini-1.5-pro (Most capable)");
  } catch (error) {
    console.error("Error:", error.message);
    console.log("\nTrying gemini-2.0-flash-exp...");
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent("Hello");
      console.log("✅ gemini-2.0-flash-exp is available");
    } catch (e) {
      console.error("Also failed:", e.message);
    }
  }
}

listModels().catch(console.error);
