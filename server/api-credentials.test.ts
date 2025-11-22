import { describe, expect, it } from "vitest";

/**
 * Validates that DeepSeek and Gemini API credentials are correctly configured
 * and can successfully authenticate with their respective services.
 */
describe("API Credentials Validation", () => {
  it("should validate DeepSeek API key", async () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");

    // Test with a minimal API call to DeepSeek
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "user", content: "Hello" }
        ],
        max_tokens: 10,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("choices");
  }, 30000); // 30 second timeout for API call

  it("should validate Google Gemini API key", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");

    // Test with a minimal API call to Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: "Hello" }]
          }]
        }),
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("candidates");
  }, 30000); // 30 second timeout for API call
});
