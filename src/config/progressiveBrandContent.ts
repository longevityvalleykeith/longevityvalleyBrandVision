/**
 * Progressive Brand Content Configuration
 *
 * Implements staged content enrichment where users provide brand context
 * progressively as they move through the workflow, reducing upfront friction
 * while maximizing semantic fidelity at decision points.
 *
 * Stage 3 is Director-led: The selected Director persona guides users
 * through scene-by-scene approval while gathering context in their voice.
 *
 * @module config/progressiveBrandContent
 * @version 1.0.0
 */

import type { DirectorProfile } from './directors';
import type { CulturalRegion } from '@/types/cultural';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Progressive enrichment stages
 */
export type EnrichmentStage = 1 | 2 | 3 | 4;

/**
 * Quality tier based on context completeness
 */
export type QualityTier = 'basic' | 'good' | 'better' | 'excellent';

/**
 * Brand content fields with progressive metadata
 */
export interface ProgressiveBrandField {
  key: keyof ProgressiveBrandData;
  label: string;
  stage: EnrichmentStage;
  required: boolean;
  /** Chip suggestions for guided input */
  chips?: string[];
  /** Placeholder text */
  placeholder: string;
  /** Help text shown below input */
  helpText: string;
}

/**
 * Progressive brand data structure
 */
export interface ProgressiveBrandData {
  productInfo: string;
  sellingPoints: string;
  targetAudience: string;
  painPoints: string;
  scenarios: string;
  ctaOffer: string;
}

/**
 * Director-voiced prompt for Stage 3 enrichment
 */
export interface DirectorEnrichmentPrompt {
  /** The question the Director asks */
  question: string;
  /** Director's opinionated commentary before asking */
  commentary: string;
  /** Director's reaction after user provides input */
  acknowledgment: string;
  /** Suggested chips in Director's voice */
  suggestions: string[];
}

/**
 * Scene approval state with Director guidance
 */
export interface DirectorSceneGuidance {
  sceneIndex: number;
  /** Director's commentary on this scene */
  commentary: string;
  /** What context would improve this scene */
  enrichmentNeeded?: keyof ProgressiveBrandData;
  /** Director's prompt for enrichment */
  enrichmentPrompt?: DirectorEnrichmentPrompt;
}

// =============================================================================
// STAGE CONFIGURATION
// =============================================================================

/**
 * Stage definitions
 */
export const ENRICHMENT_STAGES: Record<EnrichmentStage, {
  name: string;
  description: string;
  triggerPoint: string;
  qualityTier: QualityTier;
}> = {
  1: {
    name: 'Zero-Input Start',
    description: 'Visual analysis only, no brand context required',
    triggerPoint: 'Image upload',
    qualityTier: 'basic',
  },
  2: {
    name: 'Micro-Enrichment',
    description: 'Single-field context after Director selection',
    triggerPoint: 'Director selected',
    qualityTier: 'good',
  },
  3: {
    name: 'Director-Led Enrichment',
    description: 'Scene-by-scene approval with Director-voiced prompts',
    triggerPoint: 'Scene review',
    qualityTier: 'better',
  },
  4: {
    name: 'Cross-Session Learning',
    description: 'Accumulated brand profile from return visits',
    triggerPoint: 'Return visit',
    qualityTier: 'excellent',
  },
};

/**
 * Field definitions with stage assignments
 */
export const PROGRESSIVE_FIELDS: ProgressiveBrandField[] = [
  {
    key: 'productInfo',
    label: 'Product',
    stage: 2, // After Director selection
    required: false,
    placeholder: 'What are you creating content for?',
    helpText: 'One sentence about your product or service',
  },
  {
    key: 'targetAudience',
    label: 'Audience',
    stage: 3, // During scene review (Director-led)
    required: false,
    placeholder: 'Who is this for?',
    helpText: 'Your target demographic',
    chips: ['Young professionals', 'Families', 'Health-conscious', 'Seniors'],
  },
  {
    key: 'sellingPoints',
    label: 'Key Benefits',
    stage: 3, // During scene review (Director-led)
    required: false,
    placeholder: 'What makes it special?',
    helpText: 'Your unique value proposition',
  },
  {
    key: 'painPoints',
    label: 'Problems Solved',
    stage: 3, // During scene review (Director-led)
    required: false,
    placeholder: 'What problems does it solve?',
    helpText: 'Pain points your product addresses',
    chips: ['Time-saving', 'Cost-effective', 'Easy to use', 'Reliable'],
  },
  {
    key: 'scenarios',
    label: 'Use Cases',
    stage: 4, // Cross-session
    required: false,
    placeholder: 'Where is it used?',
    helpText: 'Common usage scenarios',
  },
  {
    key: 'ctaOffer',
    label: 'Call to Action',
    stage: 4, // Cross-session
    required: false,
    placeholder: 'What should viewers do?',
    helpText: 'Your promotional message or CTA',
  },
];

// =============================================================================
// DIRECTOR-VOICED PROMPTS (Stage 3)
// =============================================================================

/**
 * Director-specific enrichment prompts
 * Each Director has their own voice when asking for context
 */
export const DIRECTOR_ENRICHMENT_VOICES: Record<string, {
  targetAudience: DirectorEnrichmentPrompt;
  sellingPoints: DirectorEnrichmentPrompt;
  painPoints: DirectorEnrichmentPrompt;
}> = {
  // 🔬 The Newtonian - Technical, Precise
  newtonian: {
    targetAudience: {
      commentary: "I've calculated the motion vectors, but I need one data point to optimize: your target demographic.",
      question: "Who will observe this content? Their expectations affect the physics simulation.",
      acknowledgment: "Data received. Adjusting motion parameters for optimal viewer engagement.",
      suggestions: ['Technical professionals', 'Engineers', 'Scientists', 'Precision-focused consumers'],
    },
    sellingPoints: {
      commentary: "The visual structure is solid. Now I need the functional benefits to anchor the narrative.",
      question: "What measurable advantages does this product deliver?",
      acknowledgment: "Benefits logged. Integrating into scene momentum.",
      suggestions: ['Performance metrics', 'Efficiency gains', 'Durability', 'Precision'],
    },
    painPoints: {
      commentary: "Every solution addresses friction. What friction does your product eliminate?",
      question: "What problems does this solve? Be specific.",
      acknowledgment: "Problem vectors identified. Scenes will demonstrate the solution.",
      suggestions: ['Inefficiency', 'Complexity', 'Unreliability', 'High costs'],
    },
  },

  // 🎨 The Visionary - Poetic, Evocative
  visionary: {
    targetAudience: {
      commentary: "I see the mood, the colors bleeding into emotion... but whose heart should this touch?",
      question: "Who dreams of this? Whose soul will resonate with this vision?",
      acknowledgment: "Beautiful. I'll paint the scenes for their eyes.",
      suggestions: ['Dreamers', 'Creatives', 'Emotionally-driven', 'Experience seekers'],
    },
    sellingPoints: {
      commentary: "Beyond features lies feeling. What emotional truth does your product hold?",
      question: "What feeling does this awaken? What transformation does it promise?",
      acknowledgment: "I feel it now. The scenes will breathe with this essence.",
      suggestions: ['Joy', 'Freedom', 'Connection', 'Transformation'],
    },
    painPoints: {
      commentary: "Before light, there is shadow. What darkness does your product illuminate?",
      question: "What longing does this fulfill? What emptiness does it fill?",
      acknowledgment: "The contrast will make the light more beautiful.",
      suggestions: ['Loneliness', 'Stagnation', 'Disconnection', 'Unfulfillment'],
    },
  },

  // ⬜ The Minimalist - Clean, Precise
  minimalist: {
    targetAudience: {
      commentary: "Clean design requires clarity. I need to understand who values simplicity.",
      question: "Who appreciates 'less but better'? Define your audience.",
      acknowledgment: "Noted. Removing the unnecessary. Keeping what matters.",
      suggestions: ['Design-conscious', 'Minimalists', 'Quality over quantity', 'Sophisticated'],
    },
    sellingPoints: {
      commentary: "One benefit, stated clearly, is worth a thousand features. What's essential?",
      question: "In one phrase: what is the core value?",
      acknowledgment: "Perfect. That's all we need.",
      suggestions: ['Simplicity', 'Elegance', 'Clarity', 'Quality'],
    },
    painPoints: {
      commentary: "Clutter creates confusion. What complexity does your product remove?",
      question: "What noise does this silence?",
      acknowledgment: "The scenes will breathe with space.",
      suggestions: ['Overwhelm', 'Complexity', 'Clutter', 'Decision fatigue'],
    },
  },

  // 🔥 The Provocateur - Bold, Irreverent
  provocateur: {
    targetAudience: {
      commentary: "Rules are boring. But even chaos has an audience. Who's ready to break free?",
      question: "Who's tired of the same old thing? Who wants to shake things up?",
      acknowledgment: "Now we're talking. Let's give them something to remember.",
      suggestions: ['Rebels', 'Early adopters', 'Rule breakers', 'The bold'],
    },
    sellingPoints: {
      commentary: "Don't tell me it's 'better'. Tell me why it's DIFFERENT. What makes it dangerous?",
      question: "What sacred cow does this slaughter? What norm does it defy?",
      acknowledgment: "YES. Now that's a story worth telling.",
      suggestions: ['Disruption', 'Innovation', 'Breaking conventions', 'First of its kind'],
    },
    painPoints: {
      commentary: "The status quo is the enemy. What boring, broken thing does this replace?",
      question: "What's the thing everyone accepts but secretly hates?",
      acknowledgment: "Let's burn it down and build something better.",
      suggestions: ['Mediocrity', 'Conformity', 'Outdated systems', 'Boring solutions'],
    },
  },
};

// =============================================================================
// CULTURAL VARIATIONS
// =============================================================================

/**
 * Cultural adaptations for Director prompts
 */
export const CULTURAL_PROMPT_ADAPTATIONS: Record<CulturalRegion, {
  questionPrefix: string;
  acknowledgmentStyle: string;
}> = {
  western: {
    questionPrefix: '',
    acknowledgmentStyle: 'direct',
  },
  china: {
    questionPrefix: '请问，',
    acknowledgmentStyle: 'respectful',
  },
  taiwan: {
    questionPrefix: '請問，',
    acknowledgmentStyle: 'warm',
  },
  malaysia: {
    questionPrefix: 'Boleh saya tanya, ',
    acknowledgmentStyle: 'friendly',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate quality tier based on filled fields
 */
export function calculateQualityTier(data: Partial<ProgressiveBrandData>): QualityTier {
  const filledCount = Object.values(data).filter(v => v && v.length > 0).length;

  if (filledCount === 0) return 'basic';
  if (filledCount <= 2) return 'good';
  if (filledCount <= 4) return 'better';
  return 'excellent';
}

/**
 * Calculate completeness percentage
 */
export function calculateCompleteness(data: Partial<ProgressiveBrandData>): number {
  const totalFields = PROGRESSIVE_FIELDS.length;
  const filledFields = Object.values(data).filter(v => v && v.length > 0).length;
  return Math.round((filledFields / totalFields) * 100);
}

/**
 * Get fields for a specific stage
 */
export function getFieldsForStage(stage: EnrichmentStage): ProgressiveBrandField[] {
  return PROGRESSIVE_FIELDS.filter(f => f.stage === stage);
}

/**
 * Get Director's enrichment prompt for a specific field
 */
export function getDirectorEnrichmentPrompt(
  directorId: string,
  field: keyof ProgressiveBrandData | undefined
): DirectorEnrichmentPrompt | null {
  if (!field) return null;

  const directorVoice = DIRECTOR_ENRICHMENT_VOICES[directorId];
  if (!directorVoice) return null;

  return (directorVoice as Record<string, DirectorEnrichmentPrompt>)[field] || null;
}

/**
 * Generate scene-by-scene guidance from a Director
 */
export function generateDirectorSceneGuidance(
  director: DirectorProfile,
  sceneCount: number,
  existingData: Partial<ProgressiveBrandData>
): DirectorSceneGuidance[] {
  const guidance: DirectorSceneGuidance[] = [];
  const missingFields = getMissingStage3Fields(existingData);

  for (let i = 0; i < sceneCount; i++) {
    const sceneGuidance: DirectorSceneGuidance = {
      sceneIndex: i + 1,
      commentary: generateSceneCommentary(director, i + 1, sceneCount),
    };

    // Assign enrichment prompts to scenes (spread them out)
    if (missingFields.length > 0 && i < missingFields.length) {
      const field = missingFields[i];
      sceneGuidance.enrichmentNeeded = field;
      sceneGuidance.enrichmentPrompt = getDirectorEnrichmentPrompt(director.id, field) || undefined;
    }

    guidance.push(sceneGuidance);
  }

  return guidance;
}

/**
 * Get Stage 3 fields that haven't been filled yet
 */
function getMissingStage3Fields(data: Partial<ProgressiveBrandData>): Array<keyof ProgressiveBrandData> {
  const stage3Fields = getFieldsForStage(3);
  return stage3Fields
    .filter(f => !data[f.key] || data[f.key]!.length === 0)
    .map(f => f.key);
}

/**
 * Generate scene-specific commentary from Director
 */
function generateSceneCommentary(
  director: DirectorProfile,
  sceneIndex: number,
  totalScenes: number
): string {
  const position = sceneIndex === 1 ? 'opening' : sceneIndex === totalScenes ? 'finale' : 'middle';

  const commentaryTemplates: Record<string, Record<string, string>> = {
    newtonian: {
      opening: "The initial velocity sets the tone. Let's ensure proper momentum.",
      middle: "Maintaining trajectory. The physics look stable.",
      finale: "The landing must be precise. This is where momentum pays off.",
    },
    visionary: {
      opening: "The first breath of color. Let this moment seduce them.",
      middle: "The dream deepens. Let the mood carry us.",
      finale: "The crescendo. Leave them breathless.",
    },
    minimalist: {
      opening: "Begin with clarity. Nothing superfluous.",
      middle: "Maintain the balance. Every element earns its place.",
      finale: "End with intention. Less is the message.",
    },
    provocateur: {
      opening: "Hit them hard. No one remembers a soft start.",
      middle: "Keep them off balance. Predictable is forgettable.",
      finale: "Leave a scar. Make them remember.",
    },
  };

  return commentaryTemplates[director.id]?.[position] || "Let's review this scene.";
}

/**
 * Create default progressive brand data
 */
export function createDefaultProgressiveData(): ProgressiveBrandData {
  return {
    productInfo: '',
    sellingPoints: '',
    targetAudience: '',
    painPoints: '',
    scenarios: '',
    ctaOffer: '',
  };
}
