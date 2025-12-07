/**
 * Director Persona Registry
 *
 * Implementation of docs/DIRECTOR_PERSONA_SCHEMA.md Section 2 & 3.
 * DO NOT add fields not specified in the schema.
 *
 * @module config/directors
 * @version 2.0.0
 * @see docs/DIRECTOR_PERSONA_SCHEMA.md
 */

// =============================================================================
// TYPES (Section 2: The Director Persona Schema)
// =============================================================================

/**
 * The Director Persona Schema ('DirectorProfile')
 * Exactly as specified in docs/DIRECTOR_PERSONA_SCHEMA.md Section 2.
 */
export interface DirectorProfile {
  id: string;           // e.g., 'newtonian'
  name: string;         // e.g., "The Newtonian"
  avatar: string;       // Emoji or Asset URL
  archetype: string;    // e.g., "Physics Specialist"
  quote: string;        // e.g., "Respect the gravity."

  // 🧠 The Brain (Logic & Bias)
  biases: {
    physicsMultiplier: number; // >1.0 favors Kling
    vibeMultiplier: number;    // >1.0 favors Luma
    logicMultiplier: number;   // >1.0 favors Gemini/Runway
  };

  // ⚠️ The Safety Valve
  riskProfile: {
    label: 'Safe' | 'Balanced' | 'Experimental';
    hallucinationThreshold: number; // 0.0 (Strict) to 1.0 (Wild)
  };

  // 🗣️ The Voice (Linguistic Injection)
  voice: {
    tone: string;       // e.g., "Technical, Precise, Cold"
    vocabulary: string[]; // ["Momentum", "Friction", "Mass", "Velocity"]
    forbidden: string[];  // ["Magic", "Dream", "Glow"]
  };

  // 🎬 The Instructions (System Prompt Segment)
  systemPromptModifier: string;

  // 🎯 The Routing (Engine Preference)
  preferredEngine: 'kling' | 'luma' | 'gemini' | 'runway' | 'random';
}

// =============================================================================
// THE ROSTER (Section 3: The Persona Registry)
// =============================================================================

/**
 * A. The Newtonian (Default for High Physics)
 * - Archetype: The Simulationist
 * - Bias: Physics x1.5
 * - Risk: Safe (0.2)
 * - Engine: Hard-lock Kling AI
 */
const NEWTONIAN: DirectorProfile = {
  id: 'newtonian',
  name: 'The Newtonian',
  avatar: '🔬',
  archetype: 'The Simulationist',
  quote: 'Respect the gravity.',

  biases: {
    physicsMultiplier: 1.5,
    vibeMultiplier: 1.0,
    logicMultiplier: 1.0,
  },

  riskProfile: {
    label: 'Safe',
    hallucinationThreshold: 0.2,
  },

  voice: {
    tone: 'Technical, Precise, Cold',
    vocabulary: ['Momentum', 'Friction', 'Mass', 'Velocity'],
    forbidden: ['Magic', 'Dream', 'Glow'],
  },

  systemPromptModifier: 'I see mass and velocity. I will preserve the structural integrity.',

  preferredEngine: 'kling',
};

/**
 * B. The Visionary (Default for High Vibe)
 * - Archetype: The Auteur
 * - Bias: Vibe x1.5
 * - Risk: Experimental (0.8)
 * - Engine: Hard-lock Luma Dream Machine
 */
const VISIONARY: DirectorProfile = {
  id: 'visionary',
  name: 'The Visionary',
  avatar: '🎨',
  archetype: 'The Auteur',
  quote: 'Let the colors bleed.',

  biases: {
    physicsMultiplier: 1.0,
    vibeMultiplier: 1.5,
    logicMultiplier: 1.0,
  },

  riskProfile: {
    label: 'Experimental',
    hallucinationThreshold: 0.8,
  },

  voice: {
    tone: 'Poetic, Evocative, Dreamy',
    vocabulary: ['Atmosphere', 'Mood', 'Light', 'Emotion'],
    forbidden: ['Technical', 'Precise', 'Calculate'],
  },

  systemPromptModifier: 'I see a mood. I will enhance the atmosphere and lighting.',

  preferredEngine: 'luma',
};

/**
 * C. The Minimalist (Default for High Logic/Text)
 * - Archetype: The Designer
 * - Bias: Logic x2.0
 * - Risk: Safe (0.1)
 * - Engine: Hard-lock Gemini Video / Runway
 */
const MINIMALIST: DirectorProfile = {
  id: 'minimalist',
  name: 'The Minimalist',
  avatar: '⬜',
  archetype: 'The Designer',
  quote: 'Less, but better.',

  biases: {
    physicsMultiplier: 1.0,
    vibeMultiplier: 1.0,
    logicMultiplier: 2.0,
  },

  riskProfile: {
    label: 'Safe',
    hallucinationThreshold: 0.1,
  },

  voice: {
    tone: 'Minimal, Clean, Precise',
    vocabulary: ['Structure', 'Typography', 'Balance', 'Space'],
    forbidden: ['Chaos', 'Wild', 'Explosive'],
  },

  systemPromptModifier: 'I see structure and typography. I will stabilize the camera.',

  preferredEngine: 'gemini',
};

/**
 * D. The Provocateur (Wildcard)
 * - Archetype: The Disruptor
 * - Bias: Vibe x1.2, Physics x1.2 (Chaos)
 * - Risk: Experimental (0.95)
 * - Engine: Random / Best available for high motion-strength
 */
const PROVOCATEUR: DirectorProfile = {
  id: 'provocateur',
  name: 'The Provocateur',
  avatar: '🔥',
  archetype: 'The Disruptor',
  quote: 'Break the rules.',

  biases: {
    physicsMultiplier: 1.2,
    vibeMultiplier: 1.2,
    logicMultiplier: 1.0,
  },

  riskProfile: {
    label: 'Experimental',
    hallucinationThreshold: 0.95,
  },

  voice: {
    tone: 'Provocative, Bold, Irreverent',
    vocabulary: ['Chaos', 'Disrupt', 'Unexpected', 'Radical'],
    forbidden: ['Safe', 'Conservative', 'Traditional'],
  },

  systemPromptModifier: 'I see potential for chaos. Let\'s break the rules.',

  preferredEngine: 'random',
};

// =============================================================================
// REGISTRY EXPORTS
// =============================================================================

/**
 * The complete roster of available Director personas
 */
export const DIRECTOR_PERSONAS: DirectorProfile[] = [
  NEWTONIAN,
  VISIONARY,
  MINIMALIST,
  PROVOCATEUR,
];

/**
 * Map for O(1) lookup by ID
 */
const DIRECTOR_MAP = new Map<string, DirectorProfile>(
  DIRECTOR_PERSONAS.map((d) => [d.id, d])
);

/**
 * Default Director ID when none is specified
 */
export const DEFAULT_DIRECTOR_ID = 'newtonian';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a Director by their ID
 */
export function getDirectorById(id: string): DirectorProfile {
  return DIRECTOR_MAP.get(id) ?? NEWTONIAN;
}

/**
 * Get all available Directors for UI rendering
 */
export function getAllDirectors(): DirectorProfile[] {
  return [...DIRECTOR_PERSONAS];
}

/**
 * Get the recommended Director based on Trinity scores
 */
export function getRecommendedDirector(
  physicsScore: number,
  vibeScore: number,
  logicScore: number
): DirectorProfile {
  const scores = [
    { score: physicsScore, director: NEWTONIAN },
    { score: vibeScore, director: VISIONARY },
    { score: logicScore, director: MINIMALIST },
  ];

  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.director ?? NEWTONIAN;
}

/**
 * Apply Director biases to raw Trinity scores
 */
export function applyDirectorBiases(
  director: DirectorProfile,
  physicsScore: number,
  vibeScore: number,
  logicScore: number
): { physics: number; vibe: number; logic: number } {
  const clamp = (val: number) => Math.max(0, Math.min(10, val));

  return {
    physics: clamp(physicsScore * director.biases.physicsMultiplier),
    vibe: clamp(vibeScore * director.biases.vibeMultiplier),
    logic: clamp(logicScore * director.biases.logicMultiplier),
  };
}

/**
 * Determine the video engine based on Director's preferredEngine
 * Uses declarative routing from the Director's persona definition.
 *
 * Engine Mapping:
 * - kling: Realistic physics, motion fidelity
 * - luma: Aesthetic, dreamy, morphing
 * - gemini/runway: Logic-focused, typography-safe
 * - random: Score-based selection (Provocateur chaos)
 */
export function determineEngine(
  director: DirectorProfile,
  biasedScores: { physics: number; vibe: number; logic: number }
): 'kling' | 'luma' {
  // Use declarative preferredEngine from Director profile
  switch (director.preferredEngine) {
    case 'kling':
      return 'kling';
    case 'luma':
      return 'luma';
    case 'gemini':
    case 'runway':
      // Gemini/Runway map to Kling for now (realistic, stable)
      return 'kling';
    case 'random':
      // Random/Chaos: score-based routing
      return biasedScores.physics > biasedScores.vibe ? 'kling' : 'luma';
    default:
      // Fallback to score-based
      return biasedScores.physics > biasedScores.vibe ? 'kling' : 'luma';
  }
}
