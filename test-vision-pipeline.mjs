#!/usr/bin/env tsx

/**
 * Test script for Vision Pipeline
 * Tests Gemini Vision API and DeepSeek content generation
 */

import { invokeLLM } from "./server/_core/llm";

const imageUrl = "https://3000-i2bq1ij1uql1o2pidy3er-f4f8f6c1.manus-asia.computer/test-wellness-product.png";

const systemPrompt = `You are an expert brand strategist and visual designer specializing in analyzing wellness and luxury brand assets for the Chinese market.

You MUST respond with ONLY a valid JSON object. No markdown, no code blocks, no additional text. Just the raw JSON object.

Analyze the provided image and return a JSON object with the following structure:
{
  "colors": {
    "primary": ["color1", "color2", "color3"],
    "secondary": ["color4", "color5"],
    "accent": ["color6"],
    "description": "Explanation of color strategy"
  },
  "visual_elements": {
    "objects": ["object1", "object2"],
    "shapes": ["shape1", "shape2"],
    "text": "Any visible text",
    "icons": ["icon1"]
  },
  "mood_and_tone": {
    "mood": "e.g., calming, energetic",
    "tone": "e.g., professional, playful",
    "energy_level": "low, medium, high"
  },
  "composition": {
    "layout": "Description of layout",
    "balance": "symmetrical or asymmetrical",
    "focal_point": "What draws attention",
    "negative_space": "How white space is used"
  },
  "lighting_and_style": {
    "lighting": "Type of lighting",
    "style": "Visual style",
    "texture": "Surface textures"
  },
  "brand_insights": {
    "perceived_industry": "What industry?",
    "target_audience": "Who is this for?",
    "brand_personality": "Brand traits",
    "premium_level": "Budget level"
  }
}`;

const userPrompt = `Analyze this wellness product brand image for the Chinese market.

Analysis Purpose: Brand visual analysis for a premium wellness/health product entering the Chinese market

Please provide a detailed visual analysis considering:
1. How this appeals to Western consumers
2. How it might be perceived by Chinese consumers
3. Cultural color symbolism
4. Luxury/premium positioning
5. Wellness/health brand signals

Return ONLY the JSON object.`;

async function testGeminiVision() {
  console.log("🚀 Testing Gemini Vision API with wellness product image...\n");
  console.log(`Image URL: ${imageUrl}\n`);

  try {
    console.log("📸 Calling Gemini 3 Pro Vision API...");
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
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
              text: userPrompt,
            },
          ],
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      console.error("❌ Empty response from Gemini API");
      process.exit(1);
    }

    const responseText = typeof content === "string" ? content : JSON.stringify(content);

    console.log("\n✅ Gemini Response Received\n");
    console.log("Raw Response (first 500 chars):");
    console.log(responseText.substring(0, 500));
    console.log("\n...\n");

    // Parse and validate JSON
    let geminOutput;
    try {
      geminOutput = JSON.parse(responseText);
      console.log("✅ JSON Parsing Successful\n");
    } catch (e) {
      console.error("❌ Failed to parse JSON:", e);
      console.error("Response:", responseText);
      process.exit(1);
    }

    // Display Stage 1 Output
    console.log("═".repeat(80));
    console.log("STAGE 1: GEMINI VISION ANALYSIS OUTPUT");
    console.log("═".repeat(80));
    console.log(JSON.stringify(geminOutput, null, 2));

    // Now test DeepSeek with Gemini output
    console.log("\n\n📝 Testing DeepSeek Content Generation with Gemini output...\n");

    const deepseekSystemPrompt = `You are a world-class brand content strategist specializing in creating culturally-aware Mandarin marketing content for wellness brands entering the Chinese market.

You MUST respond with ONLY a valid JSON array. No markdown, no code blocks, no additional text.

Generate exactly 5 content pieces in this format:
[
  {
    "storyboardMandarin": "Visual description in Mandarin",
    "captionMandarin": "50-150 character caption in Mandarin",
    "explanationEnglish": "Cultural strategy explanation"
  },
  ... (4 more objects)
]`;

    const deepseekUserPrompt = `Based on this brand visual analysis, generate 5 Mandarin marketing content pieces for a premium wellness product:

${JSON.stringify(geminOutput, null, 2)}

Create content that:
1. Appeals to Chinese wellness consumers
2. Emphasizes premium/luxury positioning
3. Uses appropriate cultural messaging
4. Works on WeChat/Douyin platforms

Return ONLY the JSON array.`;

    const deepseekResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: deepseekSystemPrompt,
        },
        {
          role: "user",
          content: deepseekUserPrompt,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const deepseekContent = deepseekResponse.choices?.[0]?.message?.content;

    if (!deepseekContent) {
      console.error("❌ Empty response from DeepSeek API");
      process.exit(1);
    }

    const deepseekText = typeof deepseekContent === "string" ? deepseekContent : JSON.stringify(deepseekContent);

    console.log("✅ DeepSeek Response Received\n");
    console.log("Raw Response (first 500 chars):");
    console.log(deepseekText.substring(0, 500));
    console.log("\n...\n");

    // Parse and validate JSON
    let deepseekOutput;
    try {
      deepseekOutput = JSON.parse(deepseekText);
      console.log("✅ JSON Parsing Successful\n");
    } catch (e) {
      console.error("❌ Failed to parse JSON:", e);
      console.error("Response:", deepseekText);
      process.exit(1);
    }

    // Display Stage 2 Output
    console.log("═".repeat(80));
    console.log("STAGE 2: DEEPSEEK CONTENT GENERATION OUTPUT");
    console.log("═".repeat(80));
    console.log(JSON.stringify(deepseekOutput, null, 2));

    // Display Stage 3 Output
    console.log("\n\n═".repeat(80));
    console.log("STAGE 3: STORED OUTPUTS");
    console.log("═".repeat(80));
    console.log("\nGemini Output (visionJobOutputs.colors_primary):");
    console.log(JSON.stringify(geminOutput.colors.primary, null, 2));
    console.log("\nGemini Output (visionJobOutputs.mood):");
    console.log(geminOutput.mood_and_tone.mood);
    console.log("\nDeepSeek Output (visionJobOutputs.content_pieces - first piece):");
    if (Array.isArray(deepseekOutput)) {
      console.log(JSON.stringify(deepseekOutput[0], null, 2));
    } else {
      console.log(JSON.stringify(deepseekOutput, null, 2));
    }

    console.log("\n\n✅ PIPELINE TEST COMPLETE - ALL STAGES SUCCESSFUL\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testGeminiVision();
