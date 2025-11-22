/**
 * AI Content Generation Service
 * Integrates DeepSeek for Mandarin content generation and Gemini for visual analysis
 */

interface ContentGenerationInput {
  productInfo: string;
  sellingPoints: string;
  targetAudience?: string;
  painPoints?: string;
  scenarios?: string;
  ctaOffer?: string;
}

interface GeneratedContentPiece {
  storyboardMandarin: string;
  captionMandarin: string;
  explanationEnglish: string;
}

/**
 * Generate Mandarin brand content using DeepSeek
 */
export async function generateMandarinContent(
  input: ContentGenerationInput
): Promise<GeneratedContentPiece[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const prompt = buildContentGenerationPrompt(input);

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a world-class brand content strategist specializing in creating culturally-aware Mandarin marketing content for wellness brands entering the Chinese market. Your expertise includes:
- Understanding Chinese consumer psychology and cultural nuances
- Creating compelling visual storyboards for short-form video content
- Writing persuasive, authentic Mandarin copywriting that resonates with Chinese audiences
- Adapting Western wellness brand values to align with Chinese cultural preferences

You will generate 5 distinct pieces of content, each with:
1. A storyboard concept (visual description for a 15-30 second video or image series)
2. A Mandarin caption (50-150 characters, optimized for WeChat/Douyin)
3. An English explanation of the cultural strategy and why this approach works

CRITICAL: You MUST respond with ONLY a valid JSON array containing exactly 5 objects. No markdown, no code blocks, no additional text. Just the raw JSON array.

Each object must have these exact keys:
- storyboardMandarin: string (visual description in Mandarin)
- captionMandarin: string (50-150 character caption in Mandarin)
- explanationEnglish: string (cultural strategy explanation in English)

Example format:
[
  {
    "storyboardMandarin": "...",
    "captionMandarin": "...",
    "explanationEnglish": "..."
  },
  ... (4 more objects)
]`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const contentText = data.choices[0]?.message?.content;
    
    if (!contentText) {
      console.error("DeepSeek response structure:", JSON.stringify(data, null, 2));
      throw new Error("No content generated from DeepSeek");
    }
    
    console.log("Raw DeepSeek response:", contentText.substring(0, 500));

    // Parse the JSON response, stripping any markdown code blocks
    let cleanedContent = contentText.trim();
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    
    const parsedContent = JSON.parse(cleanedContent);
    
    // Handle both array and object with "content" key formats
    const contentArray = Array.isArray(parsedContent) 
      ? parsedContent 
      : (parsedContent.content || parsedContent.contents || []);

    if (!Array.isArray(contentArray) || contentArray.length === 0) {
      console.error("Parsed content structure:", JSON.stringify(parsedContent, null, 2));
      console.error("Content array:", contentArray);
      throw new Error(`Invalid content format from DeepSeek. Expected array, got: ${typeof parsedContent}`);
    }

    return contentArray.slice(0, 5); // Ensure we return exactly 5 pieces
  } catch (error) {
    console.error("Error generating Mandarin content:", error);
    throw error;
  }
}

/**
 * Analyze brand visual assets using Gemini
 */
export async function analyzeBrandVisuals(imageUrls: string[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (imageUrls.length === 0) {
    return "No visual assets provided for analysis.";
  }

  try {
    // Prepare content parts with images
    const contentParts = [
      {
        text: `Analyze these brand visual assets and provide a comprehensive brand aesthetic analysis. Focus on:
1. Color palette and mood
2. Visual style and design language
3. Brand personality and values conveyed
4. Target audience impression
5. Cultural positioning and market fit

Provide your analysis in English, formatted as a clear, structured summary.`
      },
      ...imageUrls.map(url => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: url // Note: In production, you'd need to fetch and convert to base64
        }
      }))
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: contentParts
          }]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const analysisText = data.candidates[0]?.content?.parts[0]?.text;

    if (!analysisText) {
      throw new Error("No analysis generated from Gemini");
    }

    return analysisText;
  } catch (error) {
    console.error("Error analyzing brand visuals:", error);
    throw error;
  }
}

/**
 * Build the content generation prompt from user inputs
 */
function buildContentGenerationPrompt(input: ContentGenerationInput): string {
  let prompt = `Generate 5 distinct Mandarin brand content pieces for the following wellness product/brand:\n\n`;
  
  prompt += `**Product Information:**\n${input.productInfo}\n\n`;
  prompt += `**Key Selling Points:**\n${input.sellingPoints}\n\n`;
  
  if (input.targetAudience) {
    prompt += `**Target Audience:**\n${input.targetAudience}\n\n`;
  }
  
  if (input.painPoints) {
    prompt += `**User Pain Points:**\n${input.painPoints}\n\n`;
  }
  
  if (input.scenarios) {
    prompt += `**Applicable Scenarios:**\n${input.scenarios}\n\n`;
  }
  
  if (input.ctaOffer) {
    prompt += `**Promotional Offer/CTA:**\n${input.ctaOffer}\n\n`;
  }

  prompt += `\nCreate 5 unique content pieces that would work well on Chinese social media platforms (WeChat, Douyin, Xiaohongshu). Each piece should have a different angle or approach to appeal to various segments of the target audience.`;

  return prompt;
}

/**
 * Generate enhanced content with visual context
 * Combines Gemini visual analysis with DeepSeek content generation
 */
export async function generateContentWithVisualContext(
  input: ContentGenerationInput,
  brandImageUrls: string[]
): Promise<GeneratedContentPiece[]> {
  // First, analyze the brand visuals if provided
  let visualContext = "";
  if (brandImageUrls.length > 0) {
    try {
      visualContext = await analyzeBrandVisuals(brandImageUrls);
    } catch (error) {
      console.warn("Visual analysis failed, proceeding without it:", error);
    }
  }

  // Enhance the prompt with visual context
  const enhancedInput = {
    ...input,
    productInfo: visualContext 
      ? `${input.productInfo}\n\n**Brand Visual Analysis:**\n${visualContext}`
      : input.productInfo
  };

  return await generateMandarinContent(enhancedInput);
}
