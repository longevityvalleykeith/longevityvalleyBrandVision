/**
 * Phase 3C - Style Presets Configuration
 * 
 * Predefined visual styles for video generation.
 * These can be extended via the database for user-created styles.
 * 
 * @module server/utils/stylePresets
 * @version 3.0.0
 */

import type { StylePreset, StyleCategory } from '../../types';

// =============================================================================
// STYLE PRESET DEFINITIONS
// =============================================================================

export const STYLE_PRESETS: StylePreset[] = [
  // -------------------------------------------------------------------------
  // LUXURY CATEGORY
  // -------------------------------------------------------------------------
  {
    id: 'LUXURY_MINIMAL_V1',
    name: 'Ethereal Luxury',
    description: 'High-key, soft diffused lighting, spa-like atmosphere with clean aesthetics.',
    prompt_layer: 'shot on Phantom Flex, soft diffused lighting, 8k resolution, slow motion, commercial aesthetic, clean white background, premium product photography',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_luxury_minimal_v1.jpg',
    category: 'luxury',
    is_premium: false,
  },
  {
    id: 'LUXURY_GOLD_V1',
    name: 'Golden Hour Opulence',
    description: 'Warm golden tones, rich textures, high-end fashion photography feel.',
    prompt_layer: 'golden hour lighting, warm amber tones, bokeh background, luxury fashion photography, shot on medium format, rich shadows, elegant composition',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_luxury_gold_v1.jpg',
    category: 'luxury',
    is_premium: true,
  },

  // -------------------------------------------------------------------------
  // TECH CATEGORY
  // -------------------------------------------------------------------------
  {
    id: 'TECH_NOIR_V1',
    name: 'Cyberpunk Tech',
    description: 'Dark environment, neon rim lighting (blue/magenta), futuristic dystopian feel.',
    prompt_layer: 'neon rim lights, deep blacks, blue and magenta contrast, volumetric fog, cyberpunk aesthetic, futuristic, blade runner inspired',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_tech_noir_v1.jpg',
    category: 'tech',
    is_premium: false,
  },
  {
    id: 'TECH_CLEAN_V1',
    name: 'Apple Minimal',
    description: 'Clean, minimalist tech aesthetic. White/grey backgrounds, precise lighting.',
    prompt_layer: 'clean white background, precise studio lighting, minimalist composition, Apple product photography style, sharp focus, 8k, commercial',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_tech_clean_v1.jpg',
    category: 'tech',
    is_premium: false,
  },
  {
    id: 'TECH_HOLOGRAM_V1',
    name: 'Holographic Future',
    description: 'Iridescent, holographic materials, sci-fi interface elements.',
    prompt_layer: 'holographic materials, iridescent reflections, sci-fi aesthetic, floating UI elements, cyan and purple color scheme, volumetric lighting',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_tech_hologram_v1.jpg',
    category: 'tech',
    is_premium: true,
  },

  // -------------------------------------------------------------------------
  // NATURE CATEGORY
  // -------------------------------------------------------------------------
  {
    id: 'NATURE_SERENE_V1',
    name: 'Zen Garden',
    description: 'Peaceful, natural lighting, organic textures, calming atmosphere.',
    prompt_layer: 'natural soft lighting, organic textures, zen garden aesthetic, peaceful atmosphere, earth tones, shallow depth of field, National Geographic style',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_nature_serene_v1.jpg',
    category: 'nature',
    is_premium: false,
  },
  {
    id: 'NATURE_DRAMATIC_V1',
    name: 'Storm Chaser',
    description: 'Dramatic skies, powerful natural forces, high contrast.',
    prompt_layer: 'dramatic storm clouds, moody lighting, high contrast, powerful atmosphere, epic scale, cinematic wide shot, nature documentary style',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_nature_dramatic_v1.jpg',
    category: 'nature',
    is_premium: true,
  },

  // -------------------------------------------------------------------------
  // URBAN CATEGORY
  // -------------------------------------------------------------------------
  {
    id: 'URBAN_STREET_V1',
    name: 'Street Culture',
    description: 'Raw urban energy, graffiti, street photography aesthetic.',
    prompt_layer: 'street photography, urban environment, raw authentic feel, graffiti backgrounds, natural lighting, documentary style, 35mm film grain',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_urban_street_v1.jpg',
    category: 'urban',
    is_premium: false,
  },
  {
    id: 'URBAN_NIGHT_V1',
    name: 'Neon Nights',
    description: 'Night cityscape, neon signs, wet streets reflecting lights.',
    prompt_layer: 'night photography, neon signs, wet streets reflecting lights, urban nightlife, cinematic color grading, Tokyo aesthetic',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_urban_night_v1.jpg',
    category: 'urban',
    is_premium: false,
  },

  // -------------------------------------------------------------------------
  // MINIMAL CATEGORY
  // -------------------------------------------------------------------------
  {
    id: 'MINIMAL_MONO_V1',
    name: 'Monochrome',
    description: 'Black and white, high contrast, architectural precision.',
    prompt_layer: 'black and white photography, high contrast, architectural precision, minimalist composition, geometric shapes, fine art photography',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_minimal_mono_v1.jpg',
    category: 'minimal',
    is_premium: false,
  },
  {
    id: 'MINIMAL_PASTEL_V1',
    name: 'Pastel Dreams',
    description: 'Soft pastel colors, airy composition, dreamy aesthetic.',
    prompt_layer: 'soft pastel colors, airy composition, dreamy aesthetic, light and shadow play, feminine elegance, editorial fashion photography',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_minimal_pastel_v1.jpg',
    category: 'minimal',
    is_premium: false,
  },

  // -------------------------------------------------------------------------
  // DRAMATIC CATEGORY
  // -------------------------------------------------------------------------
  {
    id: 'DRAMATIC_CINEMA_V1',
    name: 'Cinematic Epic',
    description: 'Wide aspect ratio, dramatic lighting, movie poster quality.',
    prompt_layer: 'cinematic lighting, anamorphic lens flare, 2.39:1 aspect ratio, movie poster quality, dramatic shadows, epic scale, Hollywood blockbuster',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_dramatic_cinema_v1.jpg',
    category: 'dramatic',
    is_premium: true,
  },
  {
    id: 'DRAMATIC_NOIR_V1',
    name: 'Film Noir',
    description: 'Classic noir lighting, venetian blind shadows, mysterious mood.',
    prompt_layer: 'film noir lighting, venetian blind shadows, high contrast black and white, mysterious mood, 1940s detective aesthetic, smoke and fog',
    hidden_ref_url: 'https://s3.longevity-valley.com/styles/ref_dramatic_noir_v1.jpg',
    category: 'dramatic',
    is_premium: true,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get style preset by ID
 */
export function getStylePreset(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get all presets in a category
 */
export function getPresetsByCategory(category: StyleCategory): StylePreset[] {
  return STYLE_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Get all free (non-premium) presets
 */
export function getFreePresets(): StylePreset[] {
  return STYLE_PRESETS.filter((preset) => !preset.is_premium);
}

/**
 * Get all premium presets
 */
export function getPremiumPresets(): StylePreset[] {
  return STYLE_PRESETS.filter((preset) => preset.is_premium);
}

/**
 * Get presets available to a user based on their plan
 */
export function getAvailablePresets(userPlan: 'free' | 'pro' | 'enterprise'): StylePreset[] {
  if (userPlan === 'free') {
    return getFreePresets();
  }
  return STYLE_PRESETS;
}

/**
 * Select best matching style based on brand analysis
 */
export function selectBestStyle(
  brandAnalysis: {
    tone?: string[];
    industry?: string;
    color_mood?: string;
  },
  availablePresets: StylePreset[] = STYLE_PRESETS
): StylePreset {
  const { tone = [], industry = '', color_mood = '' } = brandAnalysis;
  
  // Simple scoring system
  const scores = availablePresets.map((preset) => {
    let score = 0;
    const searchText = `${preset.name} ${preset.description} ${preset.prompt_layer}`.toLowerCase();

    // Match industry
    if (industry.toLowerCase().includes('tech')) {
      if (preset.category === 'tech') score += 10;
    }
    if (industry.toLowerCase().includes('luxury') || industry.toLowerCase().includes('fashion')) {
      if (preset.category === 'luxury') score += 10;
    }
    if (industry.toLowerCase().includes('nature') || industry.toLowerCase().includes('organic')) {
      if (preset.category === 'nature') score += 10;
    }

    // Match tone
    for (const t of tone) {
      if (searchText.includes(t.toLowerCase())) {
        score += 5;
      }
    }

    // Match mood
    if (color_mood) {
      if (searchText.includes(color_mood.toLowerCase())) {
        score += 3;
      }
    }

    return { preset, score };
  });

  // Sort by score and return best match (or first preset as fallback)
  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.preset || availablePresets[0];
}

/**
 * Get all unique categories
 */
export function getAllCategories(): StyleCategory[] {
  const categories = new Set(STYLE_PRESETS.map((p) => p.category));
  return Array.from(categories) as StyleCategory[];
}

/**
 * Validate style preset ID exists
 */
export function isValidStyleId(id: string): boolean {
  return STYLE_PRESETS.some((preset) => preset.id === id);
}
