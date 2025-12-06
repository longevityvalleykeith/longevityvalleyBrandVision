/**
 * Phase 3D - Vision Analysis Service (The Strategist)
 *
 * AI-powered brand image analysis using Google Gemini Vision API.
 * Extracts brand attributes, visual elements, and quality metrics.
 *
 * @module server/services/vision
 * @version 3.0.0
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiAnalysisOutput } from '@/types';
import { STYLE_PRESETS } from '../utils/stylePresets';

// =============================================================================
// CONFIGURATION
// =============================================================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

// =============================================================================
// THE STRATEGIST: BRAND IMAGE ANALYSIS
// =============================================================================

/**
 * Analyze brand image using Gemini Vision API
 *
 * Extracts:
 * - Brand attributes (colors, typography, mood, industry)
 * - Visual elements (composition, focal points, style keywords)
 * - Quality metrics (quality_score 0-10, integrity_score 0-1)
 *
 * @param imageUrl - Public URL of the brand image
 * @returns Comprehensive brand analysis
 */
export async function analyzeBrandImage(
  imageUrl: string
): Promise<GeminiAnalysisOutput> {
  try {
    // Fetch image as base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Craft comprehensive analysis prompt
    const prompt = `You are an expert brand strategist analyzing a brand image. Analyze this image comprehensively and provide the following information in JSON format:

{
  "brand_attributes": {
    "primary_colors": ["#hexcolor1", "#hexcolor2", ...],  // 3-5 dominant brand colors
    "typography_style": "description of font style if visible",
    "mood": "overall emotional tone (e.g., 'professional', 'playful', 'luxurious')",
    "industry": "likely industry category"
  },
  "visual_elements": {
    "composition": "description of layout and visual hierarchy",
    "focal_points": ["primary focus area", "secondary elements", ...],
    "style_keywords": ["keyword1", "keyword2", ...]  // 5-10 descriptive style keywords
  },
  "quality_score": 8.5,  // 0-10 scale for image quality and brand clarity
  "integrity_score": 0.95  // 0-1 scale for brand consistency and professionalism
}

Be precise with color extraction. Analyze carefully and provide actionable insights.`;

    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg',
        },
      },
    ];

    // Generate analysis
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }

    const analysis = JSON.parse(jsonMatch[1]) as GeminiAnalysisOutput;

    // Validate and normalize
    if (!analysis.brand_attributes || !analysis.visual_elements) {
      throw new Error('Invalid analysis structure from Gemini');
    }

    // Generate style recommendation based on keywords
    const recommendedStyleId = generateStyleReference(
      analysis.visual_elements.style_keywords,
      analysis.brand_attributes.mood,
      analysis.brand_attributes.industry
    );

    return {
      ...analysis,
      recommended_style_id: recommendedStyleId,
    };
  } catch (error) {
    console.error('[Vision Service] Analysis error:', error);

    // Return fallback analysis on error
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
    };
  }
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

    // Simple model check
    const testModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
    await testModel.generateContent('test');

    return {
      healthy: true,
      message: 'Gemini API operational',
    };
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : 'Gemini API error',
    };
  }
}
