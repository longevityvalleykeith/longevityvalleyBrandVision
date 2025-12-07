/**
 * Phase 3D - Vision Analysis Service (Two-Step Architecture)
 *
 * AI-powered brand image analysis using Google Gemini Vision API.
 * Implements the Two-Step Architecture for modular Director personas:
 *
 * Step 1: THE EYE (analyzeRawPixels) - Objective pixel analysis
 * Step 2: THE VOICE (generateDirectorPitch) - Director-specific interpretation
 *
 * @module server/services/vision
 * @version 5.0.0 - Two-Step Architecture
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  GeminiAnalysisOutput,
  RawPixelAnalysis,
  DirectorPitch,
  SceneBoard,
} from '@/types';
import { STYLE_PRESETS } from '../utils/stylePresets';
import {
  getDirectorById,
  applyDirectorBiases,
  determineEngine,
  type DirectorProfile,
  DEFAULT_DIRECTOR_ID,
} from '@/config/directors';

// =============================================================================
// CONFIGURATION (Lazy Initialization)
// =============================================================================

// Lazy initialization to ensure env vars are loaded before SDK init
let _genAI: GoogleGenerativeAI | null = null;
let _model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

function getModel() {
  if (!_model) {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey || apiKey === 'xxx') {
      throw new Error('GEMINI_API_KEY not configured');
    }
    _genAI = new GoogleGenerativeAI(apiKey);
    _model = _genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('[Vision Service] Gemini SDK initialized with API key');
  }
  return _model;
}

// =============================================================================
// STEP 1: THE EYE - Raw Pixel Analysis Prompt
// =============================================================================

const RAW_ANALYSIS_PROMPT = `You are an objective image analyst. Analyze this image and extract ONLY factual observations.

DO NOT interpret or pitch. Just observe and score.

## OUTPUT REQUIREMENTS

Provide a JSON response with these exact fields:

{
  "brand_attributes": {
    "primary_colors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
    "typography_style": "description of font style if visible, or null",
    "mood": "objective mood description (e.g., 'energetic', 'calm', 'professional')",
    "industry": "likely industry category"
  },
  "visual_elements": {
    "composition": "factual description of layout and visual hierarchy",
    "focal_points": ["primary subject", "secondary elements"],
    "style_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "detected_objects": ["list", "of", "objects", "in", "scene"],
    "detected_text": ["any", "text", "found", "via", "OCR"]
  },
  "quality_score": 8.5,
  "integrity_score": 0.95,
  "physics_score": 6.5,
  "vibe_score": 8.0,
  "logic_score": 7.5,
  "scoring_rationale": {
    "physics": "Brief factual explanation of motion potential",
    "vibe": "Brief factual explanation of emotional impact",
    "logic": "Brief factual explanation of message clarity"
  }
}

## SCORING CRITERIA

**PHYSICS SCORE (0-10)**: Motion complexity and dynamic potential
- High (7-10): Vehicles, machinery, sports, explosions, water, fire, flying objects
- Medium (4-6): People walking, subtle animations, product rotations
- Low (0-3): Static portraits, logos, still life, abstract patterns

**VIBE SCORE (0-10)**: Emotional impact and aesthetic appeal
- High (7-10): Cinematic lighting, strong emotion, luxury feel, artistic composition
- Medium (4-6): Professional but standard, neutral mood
- Low (0-3): Plain, utilitarian, low aesthetic investment

**LOGIC SCORE (0-10)**: Narrative clarity and message coherence
- High (7-10): Clear product focus, obvious brand story, text/CTA visible
- Medium (4-6): Implied message, subtle branding, lifestyle imagery
- Low (0-3): Abstract, unclear purpose, no obvious narrative

Return ONLY valid JSON. No commentary.`;

// =============================================================================
// STEP 2: THE VOICE - Director Pitch Prompt Template
// =============================================================================

function buildDirectorPitchPrompt(director: DirectorProfile, rawAnalysis: RawPixelAnalysis): string {
  // Determine the dominant bias for scoring emphasis
  const biasEntries = Object.entries(director.biases) as [string, number][];
  const dominantBias = biasEntries.find(([, value]) => value > 1)?.[0]?.replace('Multiplier', '') || 'balanced';

  return `You are an AI Brand Analyst with a distinct personality.

## CURRENT PERSONA
${director.name}. ${director.systemPromptModifier}

## TONE GUIDE
Use words like [${director.voice.vocabulary.join(', ')}].
Avoid words like [${director.voice.forbidden.join(', ')}].
Speak with: ${director.voice.tone}

## SCORING BIAS
Weigh ${dominantBias.toUpperCase()} scores higher in your assessment.
Your risk tolerance: ${director.riskProfile.label} (hallucination threshold: ${director.riskProfile.hallucinationThreshold})

## YOUR TASK
Look at this raw image analysis and create YOUR pitch. Speak in your voice.

## RAW ANALYSIS DATA
${JSON.stringify({
    focal_points: rawAnalysis.visual_elements.focal_points,
    detected_objects: rawAnalysis.visual_elements.detected_objects,
    detected_text: rawAnalysis.visual_elements.detected_text,
    mood: rawAnalysis.brand_attributes.mood,
    industry: rawAnalysis.brand_attributes.industry,
    physics_score: rawAnalysis.physics_score,
    vibe_score: rawAnalysis.vibe_score,
    logic_score: rawAnalysis.logic_score,
    rationale: rawAnalysis.scoring_rationale,
  }, null, 2)}

## OUTPUT FORMAT
Return JSON with your interpretation:

{
  "three_beat_pulse": {
    "vision": "[What's the subject? Max 15 words. Use YOUR vocabulary.]",
    "safety": "[What must we protect? Max 15 words.]",
    "magic": "[Why your engine choice? What feeling? Max 15 words.]"
  },
  "scene_board": {
    "start": {
      "time": "0s",
      "visual": "[Opening frame description]",
      "camera": "[Camera position/movement]"
    },
    "middle": {
      "time": "2.5s",
      "visual": "[Middle of video description]",
      "camera": "[Camera position/movement]"
    },
    "end": {
      "time": "5s",
      "visual": "[Final frame description]",
      "camera": "[Camera position/movement]"
    }
  }
}

Return ONLY valid JSON.`;
}

// =============================================================================
// STEP 1: THE EYE - Objective Pixel Analysis
// =============================================================================

/**
 * Analyze image pixels objectively without any Director interpretation.
 *
 * This is the "expensive" step - should be cached and reused when
 * users switch Directors.
 *
 * @param imageUrl - Public URL of the brand image
 * @returns Raw pixel analysis (objective, cacheable)
 */
export async function analyzeRawPixels(imageUrl: string, brandContext?: string): Promise<RawPixelAnalysis> {
  console.log('[Vision Service] THE EYE: Starting raw pixel analysis...');
  if (brandContext) {
    console.log('[Vision Service] THE EYE: Brand context will enhance analysis');
  }

  try {
    // Fetch image as base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Detect MIME type from URL or default to jpeg
    const mimeType = imageUrl.toLowerCase().includes('.png')
      ? 'image/png'
      : imageUrl.toLowerCase().includes('.webp')
        ? 'image/webp'
        : 'image/jpeg';

    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ];

    console.log('[Vision Service] THE EYE: Sending to Gemini 2.5 Flash...');

    // Build enhanced prompt with brand context if provided
    let analysisPrompt = RAW_ANALYSIS_PROMPT;
    if (brandContext) {
      analysisPrompt = `${RAW_ANALYSIS_PROMPT}

## BRAND CONTEXT (User-Provided)
The user has provided the following context about this brand/product. Use this to enhance your analysis:

${brandContext}

Incorporate this context when assessing mood, industry, and message clarity (logic score). The visual analysis should be enriched by understanding what the product is and who it's for.`;
    }

    // Generate objective analysis
    const result = await getModel().generateContent([analysisPrompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    console.log('[Vision Service] THE EYE: Raw response length:', text.length);

    // Parse JSON response
    const jsonMatch =
      text.match(/```json\n?([\s\S]*?)\n?```/) ||
      text.match(/```\n?([\s\S]*?)\n?```/) ||
      text.match(/({[\s\S]*})/);

    if (!jsonMatch) {
      console.error('[Vision Service] THE EYE: No JSON found:', text.substring(0, 500));
      throw new Error('Failed to extract JSON from Gemini response');
    }

    // Sanitize JSON string
    let jsonString = jsonMatch[1] || '{}';
    jsonString = jsonString.replace(/"([^"]*?)"/g, (match) => {
      return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    });

    const rawData = JSON.parse(jsonString);

    // Validate structure
    if (!rawData.brand_attributes || !rawData.visual_elements) {
      throw new Error('Invalid analysis structure from Gemini');
    }

    const analysis: RawPixelAnalysis = {
      brand_attributes: rawData.brand_attributes,
      visual_elements: {
        composition: rawData.visual_elements.composition,
        focal_points: rawData.visual_elements.focal_points || [],
        style_keywords: rawData.visual_elements.style_keywords || [],
        detected_objects: rawData.visual_elements.detected_objects || [],
        detected_text: rawData.visual_elements.detected_text || [],
      },
      quality_score: normalizeScore(rawData.quality_score, 7.0),
      integrity_score: normalizeScore(rawData.integrity_score, 0.8, 0, 1),
      physics_score: normalizeScore(rawData.physics_score, 5.0),
      vibe_score: normalizeScore(rawData.vibe_score, 5.0),
      logic_score: normalizeScore(rawData.logic_score, 5.0),
      scoring_rationale: rawData.scoring_rationale || {
        physics: 'Score based on motion potential',
        vibe: 'Score based on aesthetic impact',
        logic: 'Score based on message clarity',
      },
      analyzed_at: new Date(),
    };

    console.log('[Vision Service] THE EYE: Analysis complete', {
      physics: analysis.physics_score,
      vibe: analysis.vibe_score,
      logic: analysis.logic_score,
    });

    return analysis;
  } catch (error) {
    console.error('[Vision Service] THE EYE: Analysis error:', error);

    // Return fallback analysis
    return {
      brand_attributes: {
        primary_colors: ['#000000', '#FFFFFF'],
        mood: 'Unknown',
        typography_style: undefined,
        industry: 'Unknown',
      },
      visual_elements: {
        composition: 'Analysis failed - please retry',
        focal_points: [],
        style_keywords: [],
        detected_objects: [],
        detected_text: [],
      },
      quality_score: 5.0,
      integrity_score: 0.5,
      physics_score: 5.0,
      vibe_score: 5.0,
      logic_score: 5.0,
      scoring_rationale: {
        physics: 'Analysis failed',
        vibe: 'Analysis failed',
        logic: 'Analysis failed',
      },
      analyzed_at: new Date(),
    };
  }
}

// =============================================================================
// STEP 2: THE VOICE - Director Pitch Generation
// =============================================================================

/**
 * Generate a Director's pitch based on raw analysis.
 *
 * This is the "cheap" step - lightweight LLM call that can be
 * repeated quickly when users switch Directors.
 *
 * @param rawAnalysis - The cached raw pixel analysis
 * @param directorId - ID of the Director persona to use
 * @returns The Director's interpretation and pitch
 */
export async function generateDirectorPitch(
  rawAnalysis: RawPixelAnalysis,
  directorId: string = DEFAULT_DIRECTOR_ID
): Promise<DirectorPitch> {
  const director = getDirectorById(directorId);

  // Operation Brain Transplant: Enhanced Director Logging
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[Vision Service] THE VOICE: Director Activation`);
  console.log(`${'='.repeat(60)}`);
  console.log(`🎬 Active Director: ${director.name} (${director.archetype})`);
  console.log(`📍 Quote: "${director.quote}"`);
  console.log(`🎯 Preferred Engine: ${director.preferredEngine}`);
  console.log(`⚠️  Risk Profile: ${director.riskProfile.label} (threshold: ${director.riskProfile.hallucinationThreshold})`);
  console.log(`🧠 Biases: Physics=${director.biases.physicsMultiplier}x, Vibe=${director.biases.vibeMultiplier}x, Logic=${director.biases.logicMultiplier}x`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Build Director-specific prompt
    const prompt = buildDirectorPitchPrompt(director, rawAnalysis);

    // Generate pitch (text-only, no image needed)
    const result = await getModel().generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(`[Vision Service] THE VOICE: ${director.name} response length:`, text.length);

    // Parse JSON response
    const jsonMatch =
      text.match(/```json\n?([\s\S]*?)\n?```/) ||
      text.match(/```\n?([\s\S]*?)\n?```/) ||
      text.match(/({[\s\S]*})/);

    if (!jsonMatch) {
      throw new Error(`Failed to parse ${director.name}'s response`);
    }

    let jsonString = jsonMatch[1] || '{}';
    jsonString = jsonString.replace(/"([^"]*?)"/g, (match) => {
      return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    });

    const pitchData = JSON.parse(jsonString);

    // Apply Director biases to scores
    const biasedScores = applyDirectorBiases(
      director,
      rawAnalysis.physics_score,
      rawAnalysis.vibe_score,
      rawAnalysis.logic_score
    );

    // Determine engine based on Director preference and biased scores
    const recommendedEngine = determineEngine(director, biasedScores);

    // Generate style recommendation
    const recommendedStyleId = generateStyleReference(
      rawAnalysis.visual_elements.style_keywords,
      rawAnalysis.brand_attributes.mood,
      rawAnalysis.brand_attributes.industry
    );

    // Build formatted commentary
    const threeBeat = pitchData.three_beat_pulse || {
      vision: 'Analysis in progress...',
      safety: 'Protecting brand integrity.',
      magic: `${director.name} recommends ${recommendedEngine}.`,
    };

    const directorCommentary = `👀 Vision: ${threeBeat.vision}\n🛡️ Safety: ${threeBeat.safety}\n✨ The Magic: ${threeBeat.magic}`;

    // Build scene board with defaults
    const sceneBoard: SceneBoard = pitchData.scene_board || {
      start: { time: '0s', visual: 'Opening frame', camera: 'Static' },
      middle: { time: '2.5s', visual: 'Motion develops', camera: 'Slow dolly' },
      end: { time: '5s', visual: 'Final reveal', camera: 'Lock off' },
    };

    const pitch: DirectorPitch = {
      director_id: director.id,
      three_beat_pulse: threeBeat,
      director_commentary: directorCommentary,
      scene_board: sceneBoard,
      biased_scores: biasedScores,
      recommended_engine: recommendedEngine,
      recommended_style_id: recommendedStyleId,
      risk_level: director.riskProfile.label,
      generated_at: new Date(),
    };

    console.log(`[Vision Service] THE VOICE: ${director.name} pitch complete`, {
      engine: recommendedEngine,
      risk: director.riskProfile.label,
    });

    return pitch;
  } catch (error) {
    console.error(`[Vision Service] THE VOICE: ${director.name} pitch error:`, error);

    // Apply biases even on error
    const biasedScores = applyDirectorBiases(
      director,
      rawAnalysis.physics_score,
      rawAnalysis.vibe_score,
      rawAnalysis.logic_score
    );

    const recommendedEngine = determineEngine(director, biasedScores);

    // Return fallback pitch
    return {
      director_id: director.id,
      three_beat_pulse: {
        vision: 'Image requires analysis.',
        safety: 'Protect all brand elements.',
        magic: `${director.name} suggests ${recommendedEngine} for this content.`,
      },
      director_commentary: `👀 Vision: Image requires analysis.\n🛡️ Safety: Protect all brand elements.\n✨ The Magic: ${director.name} suggests ${recommendedEngine}.`,
      scene_board: {
        start: { time: '0s', visual: 'Opening frame', camera: 'Static' },
        middle: { time: '2.5s', visual: 'Motion develops', camera: 'Slow dolly' },
        end: { time: '5s', visual: 'Final reveal', camera: 'Lock off' },
      },
      biased_scores: biasedScores,
      recommended_engine: recommendedEngine,
      recommended_style_id: 'luxury-gold',
      risk_level: director.riskProfile.label,
      generated_at: new Date(),
    };
  }
}

// =============================================================================
// COMBINED ANALYSIS (Backwards Compatible)
// =============================================================================

/**
 * Analyze brand image using Two-Step Architecture.
 *
 * Combines THE EYE + THE VOICE into a single call for backwards compatibility.
 * For new code, prefer calling analyzeRawPixels and generateDirectorPitch separately.
 *
 * @param imageUrl - Public URL of the brand image
 * @param directorId - Optional Director ID (defaults to 'newtonian')
 * @returns Combined analysis matching legacy GeminiAnalysisOutput
 */
export async function analyzeBrandImage(
  imageUrl: string,
  directorId: string = DEFAULT_DIRECTOR_ID,
  brandContext?: string
): Promise<GeminiAnalysisOutput> {
  const director = getDirectorById(directorId);

  // Operation Brain Transplant: Log active Director at entry point
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`[Vision Service] TWO-STEP ARCHITECTURE ANALYSIS`);
  console.log(`${'#'.repeat(60)}`);
  console.log(`🎬 Active Director: ${director.name}`);
  console.log(`🎯 Engine Preference: ${director.preferredEngine}`);
  console.log(`📊 Bias Profile: Physics=${director.biases.physicsMultiplier}x | Vibe=${director.biases.vibeMultiplier}x | Logic=${director.biases.logicMultiplier}x`);
  console.log(`${'#'.repeat(60)}\n`);

  // Log brand context if provided
  if (brandContext) {
    console.log(`📝 Brand Context Provided:`);
    console.log(brandContext);
    console.log(`${'#'.repeat(60)}\n`);
  }

  // Step 1: THE EYE
  const rawAnalysis = await analyzeRawPixels(imageUrl, brandContext);

  // Step 2: THE VOICE
  const pitch = await generateDirectorPitch(rawAnalysis, directorId);

  // Combine into legacy format
  const combined: GeminiAnalysisOutput = {
    brand_attributes: rawAnalysis.brand_attributes,
    visual_elements: {
      composition: rawAnalysis.visual_elements.composition,
      focal_points: rawAnalysis.visual_elements.focal_points,
      style_keywords: rawAnalysis.visual_elements.style_keywords,
    },
    quality_score: rawAnalysis.quality_score,
    integrity_score: rawAnalysis.integrity_score,
    physics_score: pitch.biased_scores.physics,
    vibe_score: pitch.biased_scores.vibe,
    logic_score: pitch.biased_scores.logic,
    scoring_rationale: rawAnalysis.scoring_rationale,
    director_commentary: pitch.director_commentary,
    scene_board: pitch.scene_board,
    recommended_style_id: pitch.recommended_style_id,
    recommended_engine: pitch.recommended_engine,
    director_id: pitch.director_id,
  };

  console.log('[Vision Service] Two-Step analysis complete:', {
    director: pitch.director_id,
    engine: pitch.recommended_engine,
    biasedPhysics: pitch.biased_scores.physics,
    biasedVibe: pitch.biased_scores.vibe,
  });

  return combined;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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
 */
export function generateStyleReference(
  styleKeywords: string[],
  mood: string,
  industry?: string
): string {
  const keywords = styleKeywords.map((k) => k.toLowerCase());
  const moodLower = mood.toLowerCase();
  const industryLower = industry?.toLowerCase() || '';

  const scores = STYLE_PRESETS.map((preset) => {
    let score = 0;

    const templateKeywords = preset.prompt_template.toLowerCase().split(/[, ]+/);
    keywords.forEach((keyword) => {
      if (templateKeywords.includes(keyword)) {
        score += 3;
      }
    });

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
        score += 2;
      }
    });

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

  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.preset.id || 'luxury-gold';
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  const key = process.env['GEMINI_API_KEY'];
  return !!key && key !== 'xxx';
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

    const result = await getModel().generateContent('Respond with OK');
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
