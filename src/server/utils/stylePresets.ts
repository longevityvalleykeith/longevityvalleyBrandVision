/**
 * Phase 3C - Style Presets
 *
 * Predefined visual styles for video generation.
 * Each style includes a prompt template and configuration.
 *
 * @module server/utils/stylePresets
 * @version 3.0.0
 */

import type { StylePreset } from '@/types';

// =============================================================================
// STYLE PRESETS
// =============================================================================

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'luxury-gold',
    name: 'Luxury Gold',
    description: 'Elegant, high-end aesthetic with warm golden tones and sophisticated movements',
    category: 'luxury',
    prompt_template: 'cinematic, luxury, elegant, golden hour lighting, premium quality, sophisticated',
    negative_prompt: 'cheap, low quality, amateur, harsh lighting',
    is_premium: false,
  },
  {
    id: 'tech-modern',
    name: 'Modern Tech',
    description: 'Clean, futuristic look with cool tones and smooth transitions',
    category: 'tech',
    prompt_template: 'modern, technological, sleek, minimal, professional, high-tech, clean lines',
    negative_prompt: 'cluttered, dated, messy',
    is_premium: false,
  },
  {
    id: 'nature-organic',
    name: 'Organic Nature',
    description: 'Natural, earthy aesthetic with soft movements and organic textures',
    category: 'nature',
    prompt_template: 'natural, organic, earthy, soft lighting, authentic, wholesome, peaceful',
    negative_prompt: 'artificial, synthetic, harsh',
    is_premium: false,
  },
  {
    id: 'dramatic-cinematic',
    name: 'Cinematic Drama',
    description: 'Bold, high-contrast visuals with dynamic camera movements',
    category: 'dramatic',
    prompt_template: 'cinematic, dramatic, high contrast, dynamic, bold, professional film quality',
    negative_prompt: 'flat, boring, static',
    is_premium: true,
  },
  {
    id: 'minimal-zen',
    name: 'Minimal Zen',
    description: 'Minimalist design with calm, centered compositions',
    category: 'minimal',
    prompt_template: 'minimal, zen, calm, centered, simple, clean, serene, balanced',
    negative_prompt: 'busy, chaotic, cluttered',
    is_premium: true,
  },
  {
    id: 'luxury-noir',
    name: 'Luxury Noir',
    description: 'Dark, mysterious luxury aesthetic with high-end production',
    category: 'luxury',
    prompt_template: 'noir, dark luxury, mysterious, sophisticated, moody lighting, high-end',
    negative_prompt: 'bright, cheerful, low quality',
    is_premium: true,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a style preset by ID
 */
export function getStylePreset(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get all free style presets
 */
export function getFreeStylePresets(): StylePreset[] {
  return STYLE_PRESETS.filter((preset) => !preset.is_premium);
}

/**
 * Get all style presets for a given user plan
 */
export function getStylePresetsForPlan(plan: 'free' | 'pro' | 'enterprise'): StylePreset[] {
  if (plan === 'free') {
    return getFreeStylePresets();
  }
  return STYLE_PRESETS;
}
