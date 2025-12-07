/**
 * Phase 3D - Vision Analysis Service (The Strategist)
 *
 * AI-powered brand image analysis using Google Gemini Vision API.
 * Implements the Proprietary Scoring Matrix (Physics/Vibe/Logic) for
 * intelligent video production engine routing.
 *
 * @module server/services/vision
 * @version 4.0.0 - Proprietary Scoring Matrix
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiAnalysisOutput } from '@/types';
import { STYLE_PRESETS } from '../utils/stylePresets';

// =============================================================================
// CONFIGURATION
// =============================================================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// =============================================================================
// PROPRIETARY SCORING MATRIX PROMPT
// =============================================================================

const SCORING_MATRIX_PROMPT = `You are an expert brand strategist analyzing a brand image for AI video generation.

Analyze this image and provide assessment in JSON format.

## PROPRIETARY SCORING MATRIX (The Trinity)

**PHYSICS SCORE (0-10)**: Motion complexity and dynamic potential
- High (7-10): Cars, machinery, sports, explosions, water, fire
- Medium (4-6): People walking, subtle animations, product rotations
- Low (0-3): Static portraits, logos, still life, abstract patterns

**VIBE SCORE (0-10)**: Emotional impact and aesthetic appeal
- High (7-10): Cinematic lighting, strong emotion, luxury feel
- Medium (4-6): Professional but standard, neutral mood
- Low (0-3): Plain, utilitarian, low aesthetic investment

**LOGIC SCORE (0-10)**: Narrative clarity and message coherence
- High (7-10): Clear product focus, obvious brand story, strong CTA
- Medium (4-6): Implied message, subtle branding, lifestyle imagery
- Low (0-3): Abstract, unclear purpose, no obvious narrative

## ENGINE ROUTING RULES
- physics_score > vibe_score → "kling" (realistic motion engine)
- vibe_score >= physics_score → "luma" (aesthetic/emotional engine)

## DIRECTOR COMMENTARY - THE 3-BEAT FORMAT
Write "director_commentary" using EXACTLY this 3-Beat structure:

"👀 Vision: [What's the subject? One simple sentence, max 15 words.]
🛡️ Safety: [What must we protect? Text, faces, colors, logos? Max 15 words.]
✨ The Magic: [Why this engine? What feeling are we creating? Max 15 words.]"

### TONE GUIDE (CRITICAL)
- FORBIDDEN WORDS: resonance, paramount, juxtaposition, utilize, exemplify, articulate, profound, decisively, brilliantly
- USE: Simple English. Short sentences. Punchy words.
- BE: A creative partner, not a robot. Excited, not academic.
- GOAL: Make the user nod and think "Yes, that's exactly what I want."

Return ONLY valid JSON:

{
  "brand_attributes": {
    "primary_colors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
    "typography_style": "description of font style if visible",
    "mood": "overall emotional tone",
    "industry": "likely industry category"
  },
  "visual_elements": {
    "composition": "description of layout and visual hierarchy",
    "focal_points": ["primary focus", "secondary elements"],
    "style_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
  },
  "quality_score": 8.5,
  "integrity_score": 0.95,
  "physics_score": 6.5,
  "vibe_score": 8.0,
  "logic_score": 7.5,
  "scoring_rationale": {
    "physics": "Brief explanation",
    "vibe": "Brief explanation",
    "logic": "Brief explanation"
  },
  "director_commentary": "👀 Vision: [subject]\\n🛡️ Safety: [what to protect]\\n✨ The Magic: [why this engine + feeling]"
}`;

// =============================================================================
// THE STRATEGIST: BRAND IMAGE ANALYSIS
// =============================================================================

/**
 * Analyze brand image using Gemini Vision API with Proprietary Scoring Matrix
 *
 * Extracts:
 * - Brand attributes (colors, typography, mood, industry)
 * - Visual elements (composition, focal points, style keywords)
 * - Quality metrics (quality_score 0-10, integrity_score 0-1)
 * - Proprietary Scores (physics, vibe, logic) for engine routing
 *
 * @param imageUrl - Public URL of the brand image
 * @returns Comprehensive brand analysis with routing recommendation
 */
export async function analyzeBrandImage(
  imageUrl: string
): Promise<GeminiAnalysisOutput> {
  console.log('[Vision Service] Starting Proprietary Scoring Matrix analysis...');

  try {
    // Fetch image as base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Detect MIME type from URL or default to jpeg
    const mimeType = imageUrl.toLowerCase().includes('.png') ? 'image/png'
      : imageUrl.toLowerCase().includes('.webp') ? 'image/webp'
      : 'image/jpeg';

    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ];

    console.log('[Vision Service] Sending to Gemini 2.5 Flash...');

    // Generate analysis with Proprietary Scoring Matrix
    const result = await model.generateContent([SCORING_MATRIX_PROMPT, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    console.log('[Vision Service] Raw Gemini response length:', text.length);

    // Parse JSON response (handle markdown code blocks)
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/```\n?([\s\S]*?)\n?```/) || text.match(/({[\s\S]*})/);
    if (!jsonMatch) {
      console.error('[Vision Service] No JSON found in response:', text.substring(0, 500));
      throw new Error('Failed to extract JSON from Gemini response');
    }

    // Sanitize JSON string - fix unescaped newlines inside string values
    let jsonString = jsonMatch[1] || '{}';
    // Replace literal newlines inside strings with escaped newlines
    jsonString = jsonString.replace(/"([^"]*?)"/g, (match) => {
      return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    });

    const rawAnalysis = JSON.parse(jsonString);
    console.log('[Vision Service] Parsed analysis:', JSON.stringify(rawAnalysis, null, 2).substring(0, 500));

    // Validate required fields
    if (!rawAnalysis.brand_attributes || !rawAnalysis.visual_elements) {
      throw new Error('Invalid analysis structure from Gemini');
    }

    // Normalize scores with defaults
    const analysis: GeminiAnalysisOutput = {
      brand_attributes: rawAnalysis.brand_attributes,
      visual_elements: rawAnalysis.visual_elements,
      quality_score: normalizeScore(rawAnalysis.quality_score, 7.0),
      integrity_score: normalizeScore(rawAnalysis.integrity_score, 0.8, 0, 1),
      physics_score: normalizeScore(rawAnalysis.physics_score, 5.0),
      vibe_score: normalizeScore(rawAnalysis.vibe_score, 5.0),
      logic_score: normalizeScore(rawAnalysis.logic_score, 5.0),
      scoring_rationale: rawAnalysis.scoring_rationale || undefined,
      director_commentary: rawAnalysis.director_commentary || undefined,
    };

    // Generate style recommendation based on keywords
    const recommendedStyleId = generateStyleReference(
      analysis.visual_elements.style_keywords,
      analysis.brand_attributes.mood,
      analysis.brand_attributes.industry
    );

    // Determine recommended engine based on Physics vs Vibe
    const recommendedEngine = analysis.physics_score > analysis.vibe_score ? 'kling' : 'luma';

    console.log('[Vision Service] Proprietary Scores:', {
      physics: analysis.physics_score,
      vibe: analysis.vibe_score,
      logic: analysis.logic_score,
      recommendedEngine,
    });

    if (analysis.director_commentary) {
      console.log('[Vision Service] Director Commentary:', analysis.director_commentary);
    }

    return {
      ...analysis,
      recommended_style_id: recommendedStyleId,
      recommended_engine: recommendedEngine,
    };
  } catch (error) {
    console.error('[Vision Service] Analysis error:', error);

    // Return fallback analysis on error with neutral scores
    return {
      brand_attributes: {
        primary_colors: ['#000000', '#FFFFFF'],
        mood: 'Unknown',
        typography_style: 'Could not analyze',
        industry: 'Unknown',
      },
      visual_elements: {
        composition: 'Analysis failed - please retry',
        focal_points: [],
        style_keywords: [],
      },
      quality_score: 5.0,
      integrity_score: 0.5,
      physics_score: 5.0,
      vibe_score: 5.0,
      logic_score: 5.0,
      recommended_engine: 'luma', // Default to aesthetic engine on error
    };
  }
}

/**
 * Normalize a score to ensure it's within bounds
 */
function normalizeScore(value: unknown, defaultValue: number, min = 0, max = 10): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate style recommendation based on extracted keywords and mood
 *
 * Maps brand attributes to available style presets using keyword matching
 * and mood alignment.
 *
 * @param styleKeywords - Visual style keywords from image analysis
 * @param mood - Brand mood/tone
 * @param industry - Brand industry (optional)
 * @returns Recommended style preset ID
 */
export function generateStyleReference(
  styleKeywords: string[],
  mood: string,
  industry?: string
): string {
  const keywords = styleKeywords.map((k) => k.toLowerCase());
  const moodLower = mood.toLowerCase();
  const industryLower = industry?.toLowerCase() || '';

  // Scoring system for style matching
  const scores = STYLE_PRESETS.map((preset) => {
    let score = 0;

    // Match style template keywords
    const templateKeywords = preset.prompt_template.toLowerCase().split(/[, ]+/);
    keywords.forEach((keyword) => {
      if (templateKeywords.includes(keyword)) {
        score += 3; // High weight for direct keyword match
      }
    });

    // Match mood to category
    const categoryMatches: Record<string, string[]> = {
      luxury: ['elegant', 'sophisticated', 'premium', 'luxurious', 'high-end'],
      tech: ['modern', 'futuristic', 'technological', 'sleek', 'innovative'],
      nature: ['natural', 'organic', 'earthy', 'authentic', 'peaceful'],
      dramatic: ['bold', 'dynamic', 'powerful', 'intense', 'striking'],
      minimal: ['minimal', 'clean', 'simple', 'understated', 'refined'],
      vintage: ['retro', 'classic', 'timeless', 'nostalgic', 'heritage'],
    };

    const categoryKeywords = categoryMatches[preset.category] || [];
    categoryKeywords.forEach((catKeyword) => {
      if (moodLower.includes(catKeyword) || keywords.includes(catKeyword)) {
        score += 2; // Medium weight for category match
      }
    });

    // Industry-specific boost
    if (industryLower) {
      if (
        (industryLower.includes('tech') || industryLower.includes('software')) &&
        preset.category === 'tech'
      ) {
        score += 2;
      }
      if (
        (industryLower.includes('fashion') || industryLower.includes('luxury')) &&
        preset.category === 'luxury'
      ) {
        score += 2;
      }
      if (
        (industryLower.includes('wellness') || industryLower.includes('health')) &&
        preset.category === 'nature'
      ) {
        score += 2;
      }
    }

    return { preset, score };
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Return highest scoring preset, default to luxury-gold if no matches
  return scores[0]?.preset.id || 'luxury-gold';
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'xxx';
}

/**
 * Health check for Gemini service
 */
export async function checkGeminiHealth(): Promise<{
  healthy: boolean;
  message: string;
}> {
  try {
    if (!isGeminiConfigured()) {
      return {
        healthy: false,
        message: 'Gemini API key not configured',
      };
    }

    // Simple model check using the same model as analysis
    const result = await model.generateContent('Respond with OK');
    const text = result.response.text();

    return {
      healthy: text.toLowerCase().includes('ok'),
      message: 'Gemini 2.5 Flash operational',
    };
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : 'Gemini API error',
    };
  }
}
