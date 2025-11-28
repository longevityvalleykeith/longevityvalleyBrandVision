import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// 1. Initialize API with strict error handling for missing keys
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * 2. Define the Rigid Schema
 * This acts as the "Contract" between your O2O App and the AI.
 * It is Model-Agnostic: You can reuse this JSON structure for DeepSeek later.
 */
const BRAND_VISION_SCHEMA: any = {
  description: "Brand visual analysis output",
  type: SchemaType.OBJECT,
  properties: {
    colors: {
      type: SchemaType.OBJECT,
      properties: {
        primary: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Main dominant colors (Hex codes or names)"
        },
        secondary: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Supporting colors"
        },
        accent: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Highlight/Action colors"
        },
        description: {
          type: SchemaType.STRING,
          description: "Strategic explanation of the color palette"
        }
      },
      required: ["primary", "secondary", "description"]
    },
    visual_elements: {
      type: SchemaType.OBJECT,
      properties: {
        objects: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        shapes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        text: { type: SchemaType.STRING },
        icons: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
      },
      required: ["objects", "shapes"]
    },
    mood_and_tone: {
      type: SchemaType.OBJECT,
      properties: {
        mood: { type: SchemaType.STRING },
        tone: { type: SchemaType.STRING },
        energy_level: { type: SchemaType.STRING }
      },
      required: ["mood", "tone"]
    },
    composition: {
      type: SchemaType.OBJECT,
      properties: {
        layout: { type: SchemaType.STRING },
        balance: { type: SchemaType.STRING },
        focal_point: { type: SchemaType.STRING },
        negative_space: { type: SchemaType.STRING }
      },
      required: ["layout", "focal_point"]
    },
    brand_insights: {
      type: SchemaType.OBJECT,
      properties: {
        perceived_industry: { type: SchemaType.STRING },
        target_audience: { type: SchemaType.STRING },
        brand_personality: { type: SchemaType.STRING },
        premium_level: { type: SchemaType.STRING }
      },
      required: ["brand_personality", "target_audience"]
    }
  },
  required: ["colors", "visual_elements", "mood_and_tone", "brand_insights"]
};

export async function analyzeImageWithGemini(
  imageUrl: string,
  imageContext: string = "",
  analysisPurpose: string = "",
  creativityLevel: number = 1.0 // 0.0 to 2.0
): Promise<string> {
  try {
    // 3. Configure Model with "Native Schema Mode"
    // This forces the model to ONLY output JSON matching the schema above.
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // Latest and fastest Gemini model
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: BRAND_VISION_SCHEMA,
        temperature: 0.4, // Keep low for structural stability
      },
    });

    // Fetch image as binary buffer (required for stable Vision API usage)
    const imageResp = await fetch(imageUrl);
    if (!imageResp.ok) throw new Error(`Failed to fetch image: ${imageResp.statusText}`);
    const imageBuffer = await imageResp.arrayBuffer();

    const promptText = `
      Act as a Senior Brand Art Director.
      Analyze this image for: ${analysisPurpose}.
      Context: ${imageContext}.
      
      Output strict JSON. Focus on the 'brand_insights' for the Chinese market.
    `;

    const result = await model.generateContent([
      { text: promptText },
      {
        inlineData: {
          data: Buffer.from(imageBuffer).toString("base64"),
          mimeType: imageResp.headers.get("content-type") || "image/png",
        },
      },
    ]);

    // 4. Zero-Risk Return
    // We explicitly return the raw JSON string. 
    // The calling function (worker) can parse it.
    // We do NOT need regex sanitization here because the API enforces the MIME type.
    const responseText = result.response.text();
    
    // Optional: Quick validation check before returning
    JSON.parse(responseText); // Will throw if invalid, caught by catch block
    
    return responseText;

  } catch (error) {
    console.error("Gemini Vision Analysis Failed:", error);
    // Propagate error to the worker for retry logic
    throw error; 
  }
}
