/**
 * Phase 3A-B: Cultural DNA Type System
 *
 * Unified type definitions for cultural context across the entire stack:
 * - Frontend (React components, hooks)
 * - Backend (tRPC routers, services)
 * - Middleware (validation, transformation)
 *
 * Design Principles:
 * - Voice (vocabulary, idioms) = STATIC per (Director + Region)
 * - Tone (formality, warmth) = DYNAMIC per (BrandContext + Learning)
 * - Brand DNA (scores) = IMMUTABLE by cultural context
 *
 * @module types/cultural
 * @version 1.0.0
 * @see docs/TONE_VS_VOICE_LEARNING_CORRELATION.md
 * @see docs/INPUT_GATEKEEPING_SPEC.md
 */

import { z } from 'zod';

// =============================================================================
// PRIMITIVES (Building Blocks)
// =============================================================================

/**
 * Supported languages for the platform
 * Keep minimal - only active markets
 */
export type SupportedLanguage = 'en' | 'zh-CN' | 'zh-TW' | 'ms';

/**
 * Cultural regions that affect interpretation (not just translation)
 * Each region has distinct color meanings, idioms, and tone expectations
 */
export type CulturalRegion = 'western' | 'china' | 'malaysia' | 'taiwan';

/**
 * How cultural context was determined
 */
export type DetectionSource = 'auto_browser' | 'auto_ip' | 'user_explicit' | 'url_param' | 'default';

/**
 * Formality level for tone modulation
 */
export type FormalityLevel = 'casual' | 'professional' | 'formal';

/**
 * Input quality grades for gatekeeping
 */
export type InputQualityGrade = 'excellent' | 'good' | 'basic' | 'insufficient' | 'invalid';

/**
 * Input issue types for validation
 */
export type InputIssueType = 'too_short' | 'gibberish' | 'repetitive' | 'wrong_language' | 'spam';

// =============================================================================
// ZOD SCHEMAS (For API Validation)
// =============================================================================

/**
 * Zod schema for SupportedLanguage
 * Used in tRPC input validation
 */
export const SupportedLanguageSchema = z.enum(['en', 'zh-CN', 'zh-TW', 'ms']);

/**
 * Zod schema for CulturalRegion
 */
export const CulturalRegionSchema = z.enum(['western', 'china', 'malaysia', 'taiwan']);

/**
 * Zod schema for FormalityLevel
 */
export const FormalityLevelSchema = z.enum(['casual', 'professional', 'formal']);

/**
 * Zod schema for InputQualityGrade
 */
export const InputQualityGradeSchema = z.enum(['excellent', 'good', 'basic', 'insufficient', 'invalid']);

// =============================================================================
// CULTURAL CONTEXT INPUT (Frontend → Backend)
// =============================================================================

/**
 * CulturalContextInput
 *
 * The unified cultural signal that flows from User → THE EYE → THE VOICE → UI
 * Right-sized: 6 fields (not 10+) to avoid over-engineering
 *
 * Usage:
 * - Frontend: Detected on page load, passed to API calls
 * - Backend: Used to select cultural voice, adapt prompts
 * - Output: Included in response metadata
 */
export interface CulturalContextInput {
  /** Detected/selected language code */
  language: SupportedLanguage;

  /** Cultural region (affects interpretation, not just translation) */
  region: CulturalRegion;

  /** How was this context determined? */
  source: DetectionSource;

  /** Confidence in detection (0-1) */
  confidence: number;

  /** Output language for generated content (may differ from input language) */
  outputLanguage: SupportedLanguage;

  /** Formality level for tone modulation */
  formality: FormalityLevel;

  /** Warmth level (0-1) for tone modulation */
  warmth: number;
}

/**
 * Zod schema for CulturalContextInput
 * Used for API input validation
 */
export const CulturalContextInputSchema = z.object({
  language: SupportedLanguageSchema,
  region: CulturalRegionSchema,
  source: z.enum(['auto_browser', 'auto_ip', 'user_explicit', 'url_param', 'default']),
  confidence: z.number().min(0).max(1),
  outputLanguage: SupportedLanguageSchema,
  formality: FormalityLevelSchema,
  warmth: z.number().min(0).max(1),
});

/**
 * Default cultural context (English/Western)
 */
export const DEFAULT_CULTURAL_CONTEXT: CulturalContextInput = {
  language: 'en',
  region: 'western',
  source: 'default',
  confidence: 0.5,
  outputLanguage: 'en',
  formality: 'professional',
  warmth: 0.5,
};

// =============================================================================
// VOICE & TONE (Director Personality)
// =============================================================================

/**
 * CulturalVoice
 *
 * The STATIC linguistic identity of a Director for a specific region.
 * Does NOT change based on user input - only changes when region changes.
 */
export interface CulturalVoice {
  /** Localized vocabulary to use */
  vocabulary: string[];

  /** Cultural idioms and expressions */
  idioms: string[];

  /** Words to avoid (culturally inappropriate) */
  forbidden: string[];

  /** System prompt modifier for LLM */
  systemPrompt: string;
}

/**
 * DerivedTone
 *
 * The DYNAMIC expression layer derived from BrandContext.
 * Changes based on user input and learning.
 */
export interface DerivedTone {
  /** Formality level */
  formality: FormalityLevel;

  /** Warmth level (0-1) */
  warmth: number;
}

/**
 * CulturalDirectorVoice
 *
 * Complete cultural adaptation for a Director in a specific region.
 * Links to base DirectorProfile but adds cultural layer.
 */
export interface CulturalDirectorVoice {
  /** Base director ID (newtonian, visionary, etc.) */
  directorId: string;

  /** Region this voice is for */
  region: CulturalRegion;

  /** Localized name (e.g., "愿景大师" for Visionary in China) */
  localizedName: string;

  /** Localized signature quote */
  localizedQuote: string;

  /** Voice characteristics */
  voice: CulturalVoice;

  /** Tone description (for UI display) */
  toneDescription: string;
}

// =============================================================================
// INPUT QUALITY ASSESSMENT (Gatekeeping)
// =============================================================================

/**
 * InputIssue
 *
 * A specific problem found in user input
 */
export interface InputIssue {
  /** Which field has the issue */
  field: string;

  /** Type of issue */
  type: InputIssueType;

  /** Severity level */
  severity: 'warning' | 'error';

  /** Localized message to show user */
  message: string;

  /** Optional suggestion for improvement */
  suggestion?: string;
}

/**
 * InputQualityAssessment
 *
 * Result of input validation/gatekeeping
 * Used to determine tone derivation confidence and degradation strategy
 */
export interface InputQualityAssessment {
  /** Overall quality grade */
  grade: InputQualityGrade;

  /** Numeric score (0-100) */
  score: number;

  /** List of issues found */
  issues: InputIssue[];

  /** Can processing proceed? */
  canProceed: boolean;

  /** Recommended action */
  action: 'proceed' | 'warn_and_proceed' | 'request_improvement' | 'block';

  /** Confidence in tone derivation (0-1) */
  toneConfidence: number;
}

/**
 * Zod schema for InputQualityAssessment
 */
export const InputQualityAssessmentSchema = z.object({
  grade: InputQualityGradeSchema,
  score: z.number().min(0).max(100),
  issues: z.array(z.object({
    field: z.string(),
    type: z.enum(['too_short', 'gibberish', 'repetitive', 'wrong_language', 'spam']),
    severity: z.enum(['warning', 'error']),
    message: z.string(),
    suggestion: z.string().optional(),
  })),
  canProceed: z.boolean(),
  action: z.enum(['proceed', 'warn_and_proceed', 'request_improvement', 'block']),
  toneConfidence: z.number().min(0).max(1),
});

// =============================================================================
// LEARNING EVENTS (For Fine-Tuning)
// =============================================================================

/**
 * ToneLearningEvent
 *
 * Captures user response to presented tone for learning.
 * Used to fine-tune tone derivation over time.
 *
 * @see docs/TONE_VS_VOICE_LEARNING_CORRELATION.md
 */
export interface ToneLearningEvent {
  /** Unique event ID */
  id: string;

  /** User who made the selection */
  userId: string;

  /** Vision job this relates to */
  jobId: string;

  // ─────────────────────────────────────────────────────────────
  // CONTEXT (What was the situation?)
  // ─────────────────────────────────────────────────────────────

  /** Cultural region at time of event */
  region: CulturalRegion;

  /** Detected/provided industry */
  industry: string;

  /** Input quality assessment */
  inputQuality: InputQualityGrade;

  /** Target audience text (anonymized) */
  targetAudienceHash: string;

  // ─────────────────────────────────────────────────────────────
  // TONE PRESENTED (What tone did we use?)
  // ─────────────────────────────────────────────────────────────

  /** Tone that was presented */
  presentedTone: DerivedTone;

  /** Director whose pitch was shown */
  directorId: string;

  // ─────────────────────────────────────────────────────────────
  // USER RESPONSE (How did user react?)
  // ─────────────────────────────────────────────────────────────

  /** User action */
  action: 'selected' | 'skipped' | 'edited' | 'regenerated';

  /** Time to decision (ms) */
  timeToDecision: number;

  /** If edited, what direction? */
  editSignals?: {
    madeMoreFormal: boolean;
    madeMoreCasual: boolean;
    madeWarmer: boolean;
    madeColder: boolean;
  };

  // ─────────────────────────────────────────────────────────────
  // LEARNING DELTA (What should we adjust?)
  // ─────────────────────────────────────────────────────────────

  /** Warmth adjustment (-1 to +1) */
  warmthDelta: number;

  /** Formality adjustment (-1 to +1) */
  formalityDelta: number;

  /** Was this a tone mismatch? */
  toneMismatch: boolean;

  /** Likely reason for mismatch */
  mismatchReason?: 'poor_input' | 'wrong_region' | 'wrong_tone' | null;

  /** Event timestamp */
  createdAt: Date;
}

/**
 * Zod schema for ToneLearningEvent (for API)
 */
export const ToneLearningEventSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  jobId: z.string().uuid(),
  region: CulturalRegionSchema,
  industry: z.string(),
  inputQuality: InputQualityGradeSchema,
  targetAudienceHash: z.string(),
  presentedTone: z.object({
    formality: FormalityLevelSchema,
    warmth: z.number().min(0).max(1),
  }),
  directorId: z.string(),
  action: z.enum(['selected', 'skipped', 'edited', 'regenerated']),
  timeToDecision: z.number(),
  editSignals: z.object({
    madeMoreFormal: z.boolean(),
    madeMoreCasual: z.boolean(),
    madeWarmer: z.boolean(),
    madeColder: z.boolean(),
  }).optional(),
  warmthDelta: z.number().min(-1).max(1),
  formalityDelta: z.number().min(-1).max(1),
  toneMismatch: z.boolean(),
  mismatchReason: z.enum(['poor_input', 'wrong_region', 'wrong_tone']).nullable().optional(),
  createdAt: z.date(),
});

// =============================================================================
// CULTURAL DIRECTOR PITCH (Extended Output)
// =============================================================================

/**
 * CulturalDirectorPitchMetadata
 *
 * Metadata added to DirectorPitch when cultural context is applied
 */
export interface CulturalDirectorPitchMetadata {
  /** Localized director name */
  directorName: string;

  /** Localized quote */
  quote: string;

  /** Cultural context used */
  culturalContext: {
    language: SupportedLanguage;
    region: CulturalRegion;
    confidence: number;
  };

  /** Tone that was applied */
  appliedTone: DerivedTone;

  /** Input quality at time of generation */
  inputQuality: InputQualityGrade;
}

// =============================================================================
// API INPUT SCHEMAS (For tRPC Router Integration)
// =============================================================================

/**
 * Enhanced brand context with cultural layer
 * Used in vision.uploadImage and related endpoints
 */
export const CulturalBrandContextSchema = z.object({
  // Original brand context fields
  productInfo: z.string().optional(),
  sellingPoints: z.string().optional(),
  targetAudience: z.string().optional(),
  painPoints: z.string().optional(),
  scenarios: z.string().optional(),
  ctaOffer: z.string().optional(),

  // Cultural layer (optional - defaults applied if not provided)
  culturalContext: CulturalContextInputSchema.optional(),
});

export type CulturalBrandContext = z.infer<typeof CulturalBrandContextSchema>;

/**
 * Analysis request with cultural context
 * For generateAllDirectorPitches
 */
export const CulturalAnalysisRequestSchema = z.object({
  imageUrl: z.string().url(),
  brandContext: CulturalBrandContextSchema.optional(),
  culturalContext: CulturalContextInputSchema.optional(),
});

export type CulturalAnalysisRequest = z.infer<typeof CulturalAnalysisRequestSchema>;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create default cultural context based on language
 */
export function createCulturalContext(
  language: SupportedLanguage,
  source: DetectionSource = 'default'
): CulturalContextInput {
  const regionMap: Record<SupportedLanguage, CulturalRegion> = {
    'en': 'western',
    'zh-CN': 'china',
    'zh-TW': 'taiwan',
    'ms': 'malaysia',
  };

  return {
    language,
    region: regionMap[language],
    source,
    confidence: source === 'user_explicit' ? 1.0 : source === 'auto_browser' ? 0.9 : 0.5,
    outputLanguage: language,
    formality: 'professional',
    warmth: 0.5,
  };
}

/**
 * Create default input quality assessment for good input
 */
export function createDefaultQualityAssessment(): InputQualityAssessment {
  return {
    grade: 'good',
    score: 75,
    issues: [],
    canProceed: true,
    action: 'proceed',
    toneConfidence: 0.75,
  };
}

/**
 * Create degraded quality assessment for poor input
 */
export function createDegradedQualityAssessment(
  grade: InputQualityGrade,
  issues: InputIssue[]
): InputQualityAssessment {
  const scoreMap: Record<InputQualityGrade, number> = {
    excellent: 95,
    good: 75,
    basic: 55,
    insufficient: 35,
    invalid: 15,
  };

  const actionMap: Record<InputQualityGrade, InputQualityAssessment['action']> = {
    excellent: 'proceed',
    good: 'proceed',
    basic: 'warn_and_proceed',
    insufficient: 'request_improvement',
    invalid: 'block',
  };

  return {
    grade,
    score: scoreMap[grade],
    issues,
    canProceed: grade !== 'invalid',
    action: actionMap[grade],
    toneConfidence: scoreMap[grade] / 100,
  };
}

/**
 * Derive tone from brand context and cultural context
 */
export function deriveTone(
  brandContext: CulturalBrandContext,
  culturalContext: CulturalContextInput
): DerivedTone {
  let formality: FormalityLevel = culturalContext.formality;
  let warmth = culturalContext.warmth;

  // Adjust based on target audience keywords
  const audience = brandContext.targetAudience?.toLowerCase() || '';

  // Formality signals
  if (audience.includes('executive') || audience.includes('高管') || audience.includes('企业')) {
    formality = 'formal';
  } else if (audience.includes('young') || audience.includes('年轻') || audience.includes('muda')) {
    formality = 'casual';
  }

  // Warmth signals
  if (audience.includes('mother') || audience.includes('妈妈') || audience.includes('baby') || audience.includes('宝宝')) {
    warmth = Math.min(1, warmth + 0.3);
  } else if (audience.includes('professional') || audience.includes('专业')) {
    warmth = Math.max(0, warmth - 0.1);
  }

  // Industry signals
  const industry = (brandContext.productInfo?.toLowerCase() || '') +
    (brandContext.sellingPoints?.toLowerCase() || '');

  if (industry.includes('wellness') || industry.includes('养生') || industry.includes('health') || industry.includes('健康')) {
    warmth = Math.min(1, warmth + 0.15);
  }

  return { formality, warmth };
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// All types are exported at their definition above.
// Re-exporting here for convenient named imports:
// - SupportedLanguage, CulturalRegion, DetectionSource
// - FormalityLevel, InputQualityGrade, InputIssueType
// - CulturalContextInput, CulturalVoice, DerivedTone
// - CulturalDirectorVoice, InputQualityAssessment, ToneLearningEvent
// - CulturalBrandContext, CulturalAnalysisRequest
