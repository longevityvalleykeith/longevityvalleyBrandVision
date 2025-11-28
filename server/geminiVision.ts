/**
 * Gemini 3 Pro Vision API Integration
 * Analyzes brand images and returns structured JSON with visual insights
 */

import { invokeLLM } from "./_core/llm";

export interface GeminiVisionOutput {
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
    description: string;
  };
  visual_elements: {
    objects: string[];
    shapes: string[];
    text: string;
    icons: string[];
  };
  mood_and_tone: {
    mood: string;
    tone: string;
    energy_level: string;
  };
  composition: {
    layout: string;
    balance: string;
    focal_point: string;
    negative_space: string;
  };
  lighting_and_style: {
    lighting: string;
    style: string;
    texture: string;
  };
  brand_insights: {
    perceived_industry: string;
    target_audience: string;
    brand_personality: string;
    premium_level: string;
  };
}

/**
 * Analyze an image using Gemini 3 Pro Vision API
 * Returns structured JSON with brand analysis
 *
 * @param imageUrl - URL to image in R2 storage
 * @param imageContext - User-provided context about the image
 * @param analysisPurpose - What analysis is needed
 * @param creativityLevel - 0.0 to 2.0 (affects analysis depth)
 * @returns JSON string with vision analysis
 */
export async function analyzeImageWithGemini(
  imageUrl: string,
  imageContext: string,
  analysisPurpose: string,
  creativityLevel: number
): Promise<string> {
  if (!imageUrl) {
    throw new Error("Image URL is required");
  }

  const systemPrompt = `You are an expert brand strategist and visual designer specializing in analyzing wellness and luxury brand assets for the Chinese market. Your role is to provide detailed, structured analysis of brand images to help Western wellness brands understand their visual identity and how it translates to Chinese consumer expectations.

You MUST respond with ONLY a valid JSON object. No markdown, no code blocks, no additional text. Just the raw JSON object.

Analyze the provided image and return a JSON object with the following structure:
{
  "colors": {
    "primary": ["color1", "color2", "color3"],
    "secondary": ["color4", "color5"],
    "accent": ["color6"],
    "description": "Explanation of color strategy and cultural implications for Chinese market"
  },
  "visual_elements": {
    "objects": ["object1", "object2"],
    "shapes": ["shape1", "shape2"],
    "text": "Any visible text in the image",
    "icons": ["icon1", "icon2"]
  },
  "mood_and_tone": {
    "mood": "e.g., calming, energetic, luxurious",
    "tone": "e.g., professional, playful, sophisticated",
    "energy_level": "low, medium, high"
  },
  "composition": {
    "layout": "Description of how elements are arranged",
    "balance": "symmetrical, asymmetrical, or radial",
    "focal_point": "What draws the viewer's attention",
    "negative_space": "How white space is used"
  },
  "lighting_and_style": {
    "lighting": "Type and quality of lighting",
    "style": "Visual style (minimalist, ornate, modern, etc.)",
    "texture": "Surface textures visible"
  },
  "brand_insights": {
    "perceived_industry": "What industry/category does this suggest?",
    "target_audience": "Who is this designed for?",
    "brand_personality": "What personality traits does this convey?",
    "premium_level": "Budget-friendly, mid-range, luxury, or ultra-luxury"
  }
}`;

  const userPrompt = `Analyze this brand image for a wellness product entering the Chinese market.

Image Context: ${imageContext || "No additional context provided"}

Analysis Purpose: ${analysisPurpose}

Creativity Level: ${creativityLevel} (0=conservative, 1=balanced, 2=creative)

Please provide a detailed visual analysis that considers:
1. How this visual identity appeals to Western consumers
2. How it might be perceived by Chinese consumers
3. Cultural color symbolism and composition preferences
4. Luxury/premium positioning
5. Wellness/health brand signals

Return ONLY the JSON object, no other text.`;

  try {
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

    // Extract the response text
    const content = response.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response from Gemini API");
    }

    // Handle both string and array responses
    const responseText = typeof content === "string" ? content : JSON.stringify(content);

    // Parse to validate JSON structure
    const parsed = JSON.parse(responseText);

    // Validate required fields
    if (!parsed.colors || !parsed.visual_elements || !parsed.mood_and_tone) {
      throw new Error("Invalid response structure from Gemini API");
    }

    return JSON.stringify(parsed);
  } catch (error) {
    console.error("[Gemini Vision] API call failed:", error);

    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON response from Gemini: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Gemini Vision API error: ${error.message}`);
    }

    throw new Error("Unknown error in Gemini Vision API");
  }
}

/**
 * Validate Gemini output structure
 * Ensures all required fields are present
 */
export function validateGeminiOutput(output: string): GeminiVisionOutput {
  try {
    const parsed = JSON.parse(output) as GeminiVisionOutput;

    // Validate required top-level fields
    const requiredFields = [
      "colors",
      "visual_elements",
      "mood_and_tone",
      "composition",
      "lighting_and_style",
      "brand_insights",
    ];

    for (const field of requiredFields) {
      if (!parsed[field as keyof GeminiVisionOutput]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return parsed;
  } catch (error) {
    throw new Error(`Invalid Gemini output: ${error instanceof Error ? error.message : String(error)}`);
  }
}
