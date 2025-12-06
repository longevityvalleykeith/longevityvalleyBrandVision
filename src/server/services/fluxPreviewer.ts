/**
 * Phase 3C - Flux Previewer Service
 *
 * Handles preview image generation using Flux-Schnell via FAL AI.
 * Generates static preview images for each scene before video production.
 *
 * @module server/services/fluxPreviewer
 * @version 3.0.0
 */

import type { VideoScene } from '@/types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const FAL_API_KEY = process.env.FAL_API_KEY;
const FAL_API_URL = 'https://fal.run/fal-ai/flux-schnell';

// Flux-Schnell optimized settings (2-4 steps for speed)
const PREVIEW_CONFIG = {
  num_inference_steps: 4,
  guidance_scale: 0, // Flux-Schnell works best without guidance
  num_images: 1,
  enable_safety_checker: false,
  output_format: 'jpeg',
  image_size: {
    width: 1024,
    height: 576, // 16:9 aspect ratio for video
  },
};

// Remaster settings (higher quality, more steps)
const REMASTER_CONFIG = {
  num_inference_steps: 8,
  guidance_scale: 0,
  num_images: 1,
  enable_safety_checker: false,
  output_format: 'jpeg',
  image_size: {
    width: 1280,
    height: 720,
  },
};

// =============================================================================
// HEALTH CHECKS
// =============================================================================

/**
 * Check if Flux is configured with API key
 */
export function isFluxConfigured(): boolean {
  return Boolean(FAL_API_KEY);
}

/**
 * Check Flux API health (via FAL)
 */
export async function checkFluxHealth(): Promise<boolean> {
  if (!isFluxConfigured()) {
    return false;
  }

  try {
    // FAL AI has a status endpoint we can check
    const response = await fetch('https://fal.run/health', {
      method: 'GET',
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

// =============================================================================
// PREVIEW GENERATION
// =============================================================================

/**
 * Generate preview images for all scenes
 */
export async function generateFluxPreviews(scenes: VideoScene[]): Promise<VideoScene[]> {
  if (!isFluxConfigured()) {
    console.warn('FAL API key not configured, skipping preview generation');
    return scenes;
  }

  const previewPromises = scenes.map(async (scene) => {
    try {
      const preview_url = await generateSinglePreview(scene.action_token);
      return {
        ...scene,
        preview_url,
      };
    } catch (error) {
      console.error(`Error generating preview for scene ${scene.sequence_index}:`, error);
      return scene;
    }
  });

  return await Promise.all(previewPromises);
}

/**
 * Generate a single preview image
 */
async function generateSinglePreview(prompt: string): Promise<string> {
  const response = await fetch(FAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${FAL_API_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      ...PREVIEW_CONFIG,
    }),
  });

  if (!response.ok) {
    throw new Error(`FAL API error: ${response.statusText}`);
  }

  const data = await response.json();
  const imageUrl = data.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error('No image URL returned from FAL API');
  }

  return imageUrl;
}

// =============================================================================
// IMAGE REMASTERING
// =============================================================================

/**
 * Remaster an image for better quality using Flux
 */
export async function runFluxRemaster(
  sourceImageUrl: string,
  subject?: string
): Promise<string> {
  if (!isFluxConfigured()) {
    console.warn('FAL API key not configured, returning original image');
    return sourceImageUrl;
  }

  try {
    const remasterPrompt = subject
      ? `professional photo of ${subject}, high quality, sharp details, perfect lighting`
      : 'professional photo, high quality, sharp details, perfect lighting';

    const response = await fetch('https://fal.run/fal-ai/flux-pro/v1/ultra', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${FAL_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: remasterPrompt,
        image_url: sourceImageUrl,
        ...REMASTER_CONFIG,
      }),
    });

    if (!response.ok) {
      throw new Error(`FAL API error: ${response.statusText}`);
    }

    const data = await response.json();
    const remasteredUrl = data.images?.[0]?.url;

    if (!remasteredUrl) {
      throw new Error('No remastered image URL returned');
    }

    return remasteredUrl;
  } catch (error) {
    console.error('Error remastering image:', error);
    // Fallback to original image
    return sourceImageUrl;
  }
}

// =============================================================================
// SCENE REGENERATION
// =============================================================================

/**
 * Regenerate a scene with a new action token and style
 */
export async function regenerateScene(
  scene: VideoScene,
  newActionToken: string,
  stylePromptLayer?: string
): Promise<VideoScene> {
  if (!isFluxConfigured()) {
    console.warn('FAL API key not configured, returning scene without new preview');
    return {
      ...scene,
      action_token: newActionToken,
      attempt_count: scene.attempt_count + 1,
    };
  }

  try {
    // Combine action token with style layer
    const fullPrompt = stylePromptLayer
      ? `${newActionToken}, ${stylePromptLayer}`
      : newActionToken;

    const preview_url = await generateSinglePreview(fullPrompt);

    return {
      ...scene,
      action_token: newActionToken,
      preview_url,
      attempt_count: scene.attempt_count + 1,
      status: 'PENDING', // Reset status for review
    };
  } catch (error) {
    console.error(`Error regenerating scene ${scene.sequence_index}:`, error);
    return {
      ...scene,
      action_token: newActionToken,
      attempt_count: scene.attempt_count + 1,
      status: 'PENDING',
    };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Batch generate previews with rate limiting
 */
export async function generatePreviewsBatch(
  prompts: string[],
  batchSize: number = 3,
  delayMs: number = 1000
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (prompt) => {
        try {
          return await generateSinglePreview(prompt);
        } catch (error) {
          console.error('Error generating preview:', error);
          return '';
        }
      })
    );

    results.push(...batchResults);

    // Rate limiting delay between batches
    if (i + batchSize < prompts.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
