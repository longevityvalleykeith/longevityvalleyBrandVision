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
  SceneBoardFrame,
} from '@/types';
import { STYLE_PRESETS } from '../utils/stylePresets';
import {
  getDirectorById,
  applyDirectorBiases,
  determineEngine,
  type DirectorProfile,
  DEFAULT_DIRECTOR_ID,
} from '@/config/directors';
import type { CulturalContextInput } from '@/types/cultural';

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

function buildDirectorPitchPrompt(
  director: DirectorProfile,
  rawAnalysis: RawPixelAnalysis,
  culturalContext?: CulturalContextInput
): string {
  // Determine the dominant bias for scoring emphasis
  const biasEntries = Object.entries(director.biases) as [string, number][];
  const dominantBias = biasEntries.find(([, value]) => value > 1)?.[0]?.replace('Multiplier', '') || 'balanced';

  // Build cultural voice adaptation section (Phase 3A-B)
  let culturalSection = '';
  if (culturalContext) {
    const languageMap: Record<string, string> = {
      'en': 'English',
      'zh-CN': 'Simplified Chinese (简体中文)',
      'zh-TW': 'Traditional Chinese (繁體中文)',
      'ms': 'Bahasa Malaysia',
    };

    const formalityGuide: Record<string, string> = {
      'casual': 'Use conversational, friendly language. Short sentences. Relatable tone.',
      'professional': 'Use business-appropriate language. Clear, confident, but approachable.',
      'formal': 'Use respectful, polished language. Proper grammar. Dignified tone.',
    };

    const regionGuide: Record<string, string> = {
      'western': 'Use direct communication style. Value clarity and individuality.',
      'china': 'Use harmonious language. Value collective benefit and reliability. Avoid overly aggressive claims.',
      'malaysia': 'Use warm, multicultural-aware language. Balance professionalism with warmth.',
      'taiwan': 'Use refined, sophisticated language. Value quality and craftsmanship.',
    };

    culturalSection = `

## CULTURAL VOICE ADAPTATION (Phase 3A-B)
**Output Language**: ${languageMap[culturalContext.outputLanguage] || 'English'}
**Cultural Region**: ${culturalContext.region}
**Formality Level**: ${culturalContext.formality}
**Warmth Level**: ${Math.round(culturalContext.warmth * 100)}%

**Language Guide**: ${formalityGuide[culturalContext.formality] || formalityGuide['professional']}
**Cultural Guide**: ${regionGuide[culturalContext.region] || regionGuide['western']}

IMPORTANT: Generate your Three Beat Pulse and Scene Board descriptions in ${languageMap[culturalContext.outputLanguage] || 'English'}.
Adapt your vocabulary and idioms to feel natural for the ${culturalContext.region} market.
${culturalContext.warmth > 0.6 ? 'Use warmer, more empathetic language.' : ''}
${culturalContext.warmth < 0.4 ? 'Keep language professional and objective.' : ''}`;
  }

  return `You are an AI Brand Analyst with a distinct personality.

## CURRENT PERSONA
${director.name}. ${director.systemPromptModifier}

## TONE GUIDE
Use words like [${director.voice.vocabulary.join(', ')}].
Avoid words like [${director.voice.forbidden.join(', ')}].
Speak with: ${director.voice.tone}
${culturalSection}

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
      // P0 FIX: Sanitize brand context before prompt injection
      const sanitizedContext = sanitizePromptInput(brandContext);
      if (sanitizedContext) {
        analysisPrompt = `${RAW_ANALYSIS_PROMPT}

## BRAND CONTEXT (User-Provided)
The user has provided the following context about this brand/product. Use this to enhance your analysis:

${sanitizedContext}

Incorporate this context when assessing mood, industry, and message clarity (logic score). The visual analysis should be enriched by understanding what the product is and who it's for.`;
      }
    }

    // Generate objective analysis with retry for transient errors
    const text = await retryWithBackoff(async () => {
      const result = await getModel().generateContent([analysisPrompt, ...imageParts]);
      const response = await result.response;
      return response.text();
    });

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

    // P0 FIX: Explicit JSON parse error handling
    let rawData: Record<string, unknown>;
    try {
      rawData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[Vision Service] THE EYE: JSON parse failed:', parseError);
      console.error('[Vision Service] THE EYE: Malformed JSON (first 500 chars):', jsonString.substring(0, 500));
      throw new Error(`Failed to parse Gemini JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }

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
 * Phase 3A-B: Now includes cultural context for localized voice/tone.
 *
 * @param rawAnalysis - The cached raw pixel analysis
 * @param directorId - ID of the Director persona to use
 * @param culturalContext - Cultural context for localized Director voice (Phase 3A-B)
 * @returns The Director's interpretation and pitch
 */
export async function generateDirectorPitch(
  rawAnalysis: RawPixelAnalysis,
  directorId: string = DEFAULT_DIRECTOR_ID,
  culturalContext?: CulturalContextInput
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
  if (culturalContext) {
    console.log(`🌍 Cultural Voice: ${culturalContext.language}/${culturalContext.region} (${culturalContext.formality})`);
  }
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Build Director-specific prompt with cultural context
    const prompt = buildDirectorPitchPrompt(director, rawAnalysis, culturalContext);

    // Generate pitch (text-only, no image needed) with retry for transient errors
    const text = await retryWithBackoff(async () => {
      const result = await getModel().generateContent(prompt);
      const response = await result.response;
      return response.text();
    });

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

    // P0 FIX: Explicit JSON parse error handling for Director pitch
    let pitchData: Record<string, unknown>;
    try {
      pitchData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error(`[Vision Service] THE VOICE: ${director.name} JSON parse failed:`, parseError);
      console.error(`[Vision Service] THE VOICE: Malformed JSON (first 500 chars):`, jsonString.substring(0, 500));
      throw new Error(`Failed to parse ${director.name}'s JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }

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
    const rawSceneBoard = pitchData.scene_board as SceneBoard | undefined;

    // P1 FIX: Validate and normalize scene board timestamps
    const sceneBoard: SceneBoard = validateSceneBoard(rawSceneBoard) || {
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

/**
 * Generate pitches from ALL 4 directors (Rashomon Effect).
 *
 * Same brand analysis, 4 unique perspectives - each director interprets
 * the brand through their artistic lens.
 *
 * Phase 3A-B: Now includes cultural context for localized voice/tone.
 *
 * @param imageUrl - Public URL of the brand image
 * @param brandContext - Optional brand context for enhanced analysis
 * @param culturalContext - Cultural context for localized Director voice (Phase 3A-B)
 * @returns Array of all 4 director pitches + raw analysis
 */
export async function generateAllDirectorPitches(
  imageUrl: string,
  brandContext?: string,
  culturalContext?: CulturalContextInput
): Promise<{
  rawAnalysis: RawPixelAnalysis;
  directorPitches: DirectorPitch[];
  recommendedDirectorId: string;
}> {
  console.log(`\n${'🎬'.repeat(20)}`);
  console.log(`[Vision Service] RASHOMON EFFECT ACTIVATED`);
  console.log(`Generating 4 unique perspectives on the same brand...`);
  if (culturalContext) {
    console.log(`🌍 Cultural Context: ${culturalContext.language}/${culturalContext.region} (${culturalContext.formality})`);
  }
  console.log(`${'🎬'.repeat(20)}\n`);

  // Step 1: THE EYE - Single objective analysis
  const rawAnalysis = await analyzeRawPixels(imageUrl, brandContext);

  // Determine recommended director based on raw scores
  const recommendedDirectorId = determineRecommendedDirector(rawAnalysis);

  // Step 2: THE VOICE - All 4 directors pitch their vision with cultural adaptation
  const allDirectors = ['newtonian', 'visionary', 'minimalist', 'provocateur'];
  const directorPitches: DirectorPitch[] = [];

  for (const directorId of allDirectors) {
    console.log(`\n📣 Requesting pitch from: ${directorId.toUpperCase()}`);
    const pitch = await generateDirectorPitch(rawAnalysis, directorId, culturalContext);
    directorPitches.push(pitch);
  }

  console.log(`\n✅ All 4 director perspectives generated!`);
  console.log(`🎯 Recommended Director: ${recommendedDirectorId}\n`);

  return {
    rawAnalysis,
    directorPitches,
    recommendedDirectorId,
  };
}

/**
 * Determine which director is most suitable based on raw scores.
 * Goal: 50% conversion rate for recommended director.
 *
 * P0 FIX: Reordered conditions to ensure Provocateur is reachable.
 * Previous bug: Provocateur condition (vibe>8 && physics>6) was unreachable
 * because vibe>8 would always match "vibe >= logic" first → Visionary.
 */
function determineRecommendedDirector(rawAnalysis: RawPixelAnalysis): string {
  const { physics_score, vibe_score, logic_score } = rawAnalysis;

  // P0 FIX: Check Provocateur FIRST (chaos threshold - high vibe + decent physics)
  // This must come before Visionary check to be reachable
  if (vibe_score > 8 && physics_score > 6) {
    return 'provocateur';
  }

  // Logic-dominant with high threshold → Minimalist
  // Check before physics/vibe to catch strong logic preference
  if (logic_score > 7 && logic_score > physics_score && logic_score > vibe_score) {
    return 'minimalist';
  }

  // Physics-dominant → Newtonian (realistic motion, Kling engine)
  if (physics_score >= vibe_score && physics_score >= logic_score) {
    return 'newtonian';
  }

  // Vibe-dominant → Visionary (aesthetic, Luma engine)
  if (vibe_score > logic_score) {
    return 'visionary';
  }

  // Balanced logic/vibe → Minimalist (clean, structured)
  if (logic_score >= 6) {
    return 'minimalist';
  }

  // Default to Visionary (safest bet for most brands)
  return 'visionary';
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * P0 FIX: Retry with exponential backoff for transient API errors (503, 429, etc.)
 *
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Initial delay in ms (default: 1000)
 * @returns Result of the function or throws after all retries exhausted
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable (503, 429, network errors)
      const errorMessage = lastError.message.toLowerCase();
      const isRetryable =
        errorMessage.includes('503') ||
        errorMessage.includes('service unavailable') ||
        errorMessage.includes('429') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('network');

      if (!isRetryable || attempt === maxRetries) {
        console.error(`[Vision Service] Retry exhausted after ${attempt + 1} attempts:`, lastError.message);
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
      console.warn(`[Vision Service] Retryable error (attempt ${attempt + 1}/${maxRetries + 1}): ${lastError.message}`);
      console.warn(`[Vision Service] Retrying in ${Math.round(delay)}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Retry failed with unknown error');
}

/**
 * P0 FIX: Sanitize user-provided text before injection into LLM prompts.
 * Prevents prompt injection attacks and ensures clean input.
 *
 * Security measures:
 * - Remove potential prompt delimiters (```, ###, etc.)
 * - Remove HTML/XML tags
 * - Remove control characters
 * - Limit excessive whitespace
 * - Truncate to reasonable length
 */
function sanitizePromptInput(input: string, maxLength = 2000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove potential code fence delimiters that could break JSON extraction
    .replace(/```/g, '')
    // Remove markdown headers that could interfere with prompt structure
    .replace(/^#{1,6}\s+/gm, '')
    // Remove HTML/XML tags (potential XSS vectors)
    .replace(/<[^>]*>/g, '')
    // Remove control characters (ASCII 0-31 except newline/tab, and 127)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize excessive newlines (max 2 consecutive)
    .replace(/\n{3,}/g, '\n\n')
    // Normalize excessive spaces
    .replace(/[ \t]{3,}/g, '  ')
    // Trim whitespace
    .trim()
    // Truncate to max length
    .substring(0, maxLength);
}

/**
 * P1 FIX: Validate and normalize scene board timestamps.
 * Ensures timestamps are sequential and all required fields exist.
 *
 * @param sceneBoard - Raw scene board from LLM response
 * @returns Validated SceneBoard or null if invalid
 */
function validateSceneBoard(sceneBoard: SceneBoard | undefined): SceneBoard | null {
  if (!sceneBoard) {
    console.warn('[Vision Service] validateSceneBoard: No scene board provided');
    return null;
  }

  // Check required structure
  if (!sceneBoard.start || !sceneBoard.middle || !sceneBoard.end) {
    console.warn('[Vision Service] validateSceneBoard: Missing start/middle/end frames');
    return null;
  }

  // Parse timestamp string to seconds (e.g., "2.5s" -> 2.5, "0s" -> 0)
  const parseTimestamp = (timeStr: string): number | null => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const match = timeStr.match(/^(\d+(?:\.\d+)?)\s*s?$/);
    if (!match) return null;
    const value = parseFloat(match[1]);
    return isNaN(value) ? null : value;
  };

  // Validate each frame has required fields
  const validateFrame = (frame: SceneBoardFrame, label: string): boolean => {
    if (!frame.time || typeof frame.time !== 'string') {
      console.warn(`[Vision Service] validateSceneBoard: ${label} missing time`);
      return false;
    }
    if (!frame.visual || typeof frame.visual !== 'string') {
      console.warn(`[Vision Service] validateSceneBoard: ${label} missing visual`);
      return false;
    }
    if (!frame.camera || typeof frame.camera !== 'string') {
      console.warn(`[Vision Service] validateSceneBoard: ${label} missing camera`);
      return false;
    }
    return true;
  };

  // Validate all frames
  if (!validateFrame(sceneBoard.start, 'start')) return null;
  if (!validateFrame(sceneBoard.middle, 'middle')) return null;
  if (!validateFrame(sceneBoard.end, 'end')) return null;

  // Parse timestamps
  const startTime = parseTimestamp(sceneBoard.start.time);
  const middleTime = parseTimestamp(sceneBoard.middle.time);
  const endTime = parseTimestamp(sceneBoard.end.time);

  // Validate timestamps are parseable
  if (startTime === null || middleTime === null || endTime === null) {
    console.warn('[Vision Service] validateSceneBoard: Invalid timestamp format', {
      start: sceneBoard.start.time,
      middle: sceneBoard.middle.time,
      end: sceneBoard.end.time,
    });
    return null;
  }

  // Validate timestamps are sequential (start <= middle <= end)
  if (startTime > middleTime || middleTime > endTime) {
    console.warn('[Vision Service] validateSceneBoard: Timestamps not sequential', {
      startTime,
      middleTime,
      endTime,
    });
    return null;
  }

  // Validate reasonable duration (max 30 seconds for a clip)
  if (endTime > 30) {
    console.warn('[Vision Service] validateSceneBoard: End time exceeds 30s limit:', endTime);
    return null;
  }

  // Scene board is valid
  return sceneBoard;
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
