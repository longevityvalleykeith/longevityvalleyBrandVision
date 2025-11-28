import { describe, it, expect } from "vitest";
import { invokeLLM } from "./_core/llm";

/**
 * This test demonstrates the exact JSON structure that Gemini 3 Pro outputs
 * when analyzing a brand image. This output is then used as input for DeepSeek V3.
 */
describe("Gemini 3 Pro Vision Analysis - Output Structure", () => {
  it("should output structured JSON for brand image analysis", async () => {
    // Using a public image URL for testing
    const imageUrl =
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png";

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a brand visual analyst. Analyze the provided image and output ONLY a valid JSON object (no markdown, no code blocks, no extra text) with the following structure:

{
  "colors": {
    "primary": ["#HEX1", "#HEX2"],
    "secondary": ["#HEX3"],
    "accent": ["#HEX4"],
    "description": "Color palette description"
  },
  "visual_elements": {
    "objects": ["object1", "object2"],
    "shapes": ["shape1", "shape2"],
    "text": "Any visible text in the image",
    "icons": ["icon1", "icon2"]
  },
  "mood_and_tone": {
    "mood": "professional/playful/minimalist/bold/etc",
    "tone": "Description of the overall tone",
    "energy_level": "high/medium/low"
  },
  "composition": {
    "layout": "centered/asymmetric/grid/etc",
    "balance": "symmetrical/asymmetrical",
    "focal_point": "Description of where the eye is drawn",
    "negative_space": "abundant/moderate/minimal"
  },
  "lighting_and_style": {
    "lighting": "bright/dim/natural/artificial",
    "style": "flat/3d/gradient/minimalist/detailed",
    "texture": "smooth/textured/gradient"
  },
  "brand_insights": {
    "perceived_industry": "industry/category",
    "target_audience": "Description of likely target audience",
    "brand_personality": "adjectives describing the brand",
    "premium_level": "luxury/premium/mid-market/budget"
  }
}

Output ONLY the JSON object, nothing else.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Analyze this brand image and provide the structured JSON analysis.",
            },
          ],
        },
      ],
    });

    console.log("=== GEMINI 3 PRO VISION OUTPUT ===");
    console.log(response.choices[0].message.content);
    console.log("=== END OUTPUT ===\n");

    // Parse the response
    const content = response.choices[0].message.content;
    expect(content).toBeDefined();
    expect(typeof content).toBe("string");

    // Try to parse as JSON
    let parsedOutput;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsedOutput = JSON.parse(cleanedContent);
    } catch (error) {
      console.error("Failed to parse Gemini output as JSON:", error);
      console.error("Raw content:", content);
      throw new Error(
        `Gemini output is not valid JSON: ${(error as Error).message}`
      );
    }

    // Validate structure
    expect(parsedOutput).toHaveProperty("colors");
    expect(parsedOutput).toHaveProperty("visual_elements");
    expect(parsedOutput).toHaveProperty("mood_and_tone");
    expect(parsedOutput).toHaveProperty("composition");
    expect(parsedOutput).toHaveProperty("lighting_and_style");
    expect(parsedOutput).toHaveProperty("brand_insights");

    // Validate nested properties
    expect(parsedOutput.colors).toHaveProperty("primary");
    expect(parsedOutput.colors).toHaveProperty("secondary");
    expect(parsedOutput.colors).toHaveProperty("description");

    expect(parsedOutput.visual_elements).toHaveProperty("objects");
    expect(parsedOutput.visual_elements).toHaveProperty("text");

    expect(parsedOutput.mood_and_tone).toHaveProperty("mood");
    expect(parsedOutput.mood_and_tone).toHaveProperty("tone");

    expect(parsedOutput.composition).toHaveProperty("layout");
    expect(parsedOutput.composition).toHaveProperty("focal_point");

    expect(parsedOutput.lighting_and_style).toHaveProperty("lighting");
    expect(parsedOutput.lighting_and_style).toHaveProperty("style");

    expect(parsedOutput.brand_insights).toHaveProperty("perceived_industry");
    expect(parsedOutput.brand_insights).toHaveProperty("target_audience");

    console.log("\n=== PARSED JSON STRUCTURE ===");
    console.log(JSON.stringify(parsedOutput, null, 2));
    console.log("=== VALIDATION PASSED ===\n");
  });

  it("should demonstrate how DeepSeek consumes Gemini output", async () => {
    // Example Gemini output (what we expect)
    const geminOutput = {
      colors: {
        primary: ["#4285F4", "#EA4335"],
        secondary: ["#FBBC04", "#34A853"],
        accent: ["#000000"],
        description:
          "Vibrant primary colors (blue, red) with warm accents (yellow, green) on white background",
      },
      visual_elements: {
        objects: ["text", "geometric shapes"],
        shapes: ["rounded rectangles"],
        text: "Google",
        icons: [],
      },
      mood_and_tone: {
        mood: "playful yet professional",
        tone: "Modern, friendly, approachable",
        energy_level: "high",
      },
      composition: {
        layout: "centered",
        balance: "symmetrical",
        focal_point: "The word 'Google' in the center",
        negative_space: "abundant",
      },
      lighting_and_style: {
        lighting: "bright and clean",
        style: "flat design with no gradients",
        texture: "smooth",
      },
      brand_insights: {
        perceived_industry: "Technology / Search Engine",
        target_audience: "Global users, tech-savvy, all ages",
        brand_personality: "innovative, accessible, trustworthy, playful",
        premium_level: "premium",
      },
    };

    // Now demonstrate how DeepSeek would consume this
    const deepseekPrompt = `
You are a Mandarin content strategist specializing in wellness brands.

Based on this brand visual analysis:
${JSON.stringify(geminOutput, null, 2)}

And these brand requirements:
- Product: Russian Bee Wax
- Selling Points: Strongest natural product for wound and skin healing
- Target Audience: Anyone with skin lesions
- Pain Points: Wounds, lesions, pain
- Applicable Scenarios: Home, Wellness, Community place
- Promo Offer: Try 1st buy later

Generate 5 Mandarin content pieces that align with the visual brand identity and positioning. 
For each piece, provide:
1. Visual Storyboard (Mandarin, 100-200 characters)
2. Caption (Mandarin, 50-150 characters)
3. Strategy Explanation (English)

Output as JSON array with objects containing: storyboardMandarin, captionMandarin, explanationEnglish
`;

    console.log("\n=== DEEPSEEK INPUT PROMPT ===");
    console.log(deepseekPrompt);
    console.log("=== END PROMPT ===\n");

    expect(deepseekPrompt).toContain("Russian Bee Wax");
    expect(deepseekPrompt).toContain("Mandarin");
    expect(deepseekPrompt).toContain(JSON.stringify(geminOutput));
  });
});
