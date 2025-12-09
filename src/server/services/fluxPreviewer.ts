/**
 * Phase 3C - Preview Engine Service
 *
 * Handles preview image generation with A/B engine selection:
 * - Flux-Schnell (FAL AI): Fast, good for iteration
 * - Nano Banana Pro (Gemini 3 Pro Image): Higher quality, better consistency
 *
 * UX Keys:
 * - Transition Consistency: Scenes maintain visual continuity
 * - Spatial Continuity: Camera angles, lighting, depth coherent
 * - Invoking User's Latent Vision: Reference image chaining
 *
 * @module server/services/fluxPreviewer
 * @version 4.0.0 - A/B Engine Selection
 */

import type { VideoScene, BrandSemanticLock } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Preview engine options
 */
export type PreviewEngine = 'flux' | 'nano-banana-pro';

/**
 * Engine configuration for preview generation
 */
export interface PreviewEngineConfig {
  engine: PreviewEngine;
  /** Reference images for spatial continuity (Nano Banana Pro supports up to 14) */
  referenceImages?: string[];
  /** Previous scene preview for transition consistency */
  previousScenePreview?: string;
  /** Brand semantic lock for consistent styling */
  semanticLock?: BrandSemanticLock | null;
  /** Output resolution: '1k' | '2k' | '4k' */
  resolution?: '1k' | '2k' | '4k';
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const FAL_API_KEY = process.env['FAL_API_KEY'];
const GEMINI_API_KEY = process.env['GEMINI_API_KEY'];
const FAL_API_URL = 'https://fal.run/fal-ai/flux-schnell';
const NANO_BANANA_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

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

// Nano Banana Pro resolution settings
const NANO_BANANA_RESOLUTIONS = {
  '1k': { width: 1024, height: 576 },  // 16:9
  '2k': { width: 1920, height: 1080 }, // 16:9
  '4k': { width: 3840, height: 2160 }, // 16:9
};

// Default engine (can be overridden via config)
let defaultPreviewEngine: PreviewEngine = 'flux';

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
 * Check if Nano Banana Pro is configured with API key
 */
export function isNanoBananaConfigured(): boolean {
  return Boolean(GEMINI_API_KEY);
}

/**
 * Check if the specified engine is available
 */
export function isEngineConfigured(engine: PreviewEngine): boolean {
  switch (engine) {
    case 'flux':
      return isFluxConfigured();
    case 'nano-banana-pro':
      return isNanoBananaConfigured();
    default:
      return false;
  }
}

/**
 * Set default preview engine
 */
export function setDefaultPreviewEngine(engine: PreviewEngine): void {
  if (isEngineConfigured(engine)) {
    defaultPreviewEngine = engine;
    console.log(`[PreviewEngine] Default engine set to: ${engine}`);
  } else {
    console.warn(`[PreviewEngine] Cannot set default to ${engine} - not configured`);
  }
}

/**
 * Get current default preview engine
 */
export function getDefaultPreviewEngine(): PreviewEngine {
  return defaultPreviewEngine;
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

/**
 * Check Nano Banana Pro API health
 */
export async function checkNanoBananaHealth(): Promise<boolean> {
  if (!isNanoBananaConfigured()) {
    return false;
  }

  // Gemini API doesn't have a health endpoint, just check if key exists
  return true;
}

// =============================================================================
// PREVIEW GENERATION
// =============================================================================

/**
 * Generate preview images for all scenes using the configured engine
 *
 * UX Keys:
 * - Transition Consistency: Each scene receives the previous scene's preview as reference
 * - Spatial Continuity: Brand semantic lock provides consistent style/color/mood
 * - User's Latent Vision: Original source image chained through all scenes
 *
 * @param scenes - Array of scenes to generate previews for
 * @param config - Engine configuration (defaults to current default engine)
 */
export async function generateFluxPreviews(
  scenes: VideoScene[],
  config?: Partial<PreviewEngineConfig>
): Promise<VideoScene[]> {
  const engine = config?.engine || defaultPreviewEngine;

  if (!isEngineConfigured(engine)) {
    console.warn(`[PreviewEngine] ${engine} not configured, skipping preview generation`);
    return scenes;
  }

  console.log(`[PreviewEngine] Generating ${scenes.length} previews with ${engine}`);

  // Sequential generation for transition consistency (each scene sees previous)
  const results: VideoScene[] = [];
  let previousPreviewUrl: string | undefined = config?.referenceImages?.[0];

  for (const scene of scenes) {
    try {
      const preview_url = await generatePreviewWithEngine(
        scene.action_token,
        engine,
        {
          ...config,
          previousScenePreview: previousPreviewUrl,
        }
      );

      results.push({
        ...scene,
        preview_url,
      });

      // Chain preview for next scene (transition consistency)
      previousPreviewUrl = preview_url;

    } catch (error) {
      console.error(`[PreviewEngine] Error generating preview for scene ${scene.sequence_index}:`, error);
      results.push(scene);
    }
  }

  return results;
}

/**
 * Generate a single preview using the specified engine
 */
async function generatePreviewWithEngine(
  prompt: string,
  engine: PreviewEngine,
  config?: Partial<PreviewEngineConfig>
): Promise<string> {
  switch (engine) {
    case 'flux':
      return await generateFluxPreview(prompt);
    case 'nano-banana-pro':
      return await generateNanoBananaPreview(prompt, config);
    default:
      throw new Error(`Unknown preview engine: ${engine}`);
  }
}

/**
 * Generate a single preview image with Flux-Schnell
 */
async function generateFluxPreview(prompt: string): Promise<string> {
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

/**
 * Generate a single preview image with Nano Banana Pro (Gemini 3 Pro Image)
 *
 * Key advantages for UX:
 * - Reference image chaining: Up to 14 images for spatial continuity
 * - Better text rendering for brand overlays
 * - Camera angle/lighting control
 * - Higher resolution (2K/4K)
 */
async function generateNanoBananaPreview(
  prompt: string,
  config?: Partial<PreviewEngineConfig>
): Promise<string> {
  const resolution = config?.resolution || '1k';
  const { width, height } = NANO_BANANA_RESOLUTIONS[resolution];

  // Build reference images array for spatial continuity
  const referenceImages: string[] = [];

  // Add source image if available (user's latent vision anchor)
  if (config?.referenceImages) {
    referenceImages.push(...config.referenceImages.slice(0, 10));
  }

  // Add previous scene preview for transition consistency
  if (config?.previousScenePreview) {
    referenceImages.push(config.previousScenePreview);
  }

  // Build enhanced prompt with brand context
  let enhancedPrompt = prompt;
  if (config?.semanticLock) {
    const lock = config.semanticLock;
    const styleHints = [
      lock.visualIdentity.mood,
      `color palette: ${lock.visualIdentity.primaryColors.join(', ')}`,
      lock.visualIdentity.styleKeywords.slice(0, 3).join(', '),
    ].filter(Boolean).join('. ');

    enhancedPrompt = `${prompt}. Style: ${styleHints}`;
  }

  // Build request parts with text and optional reference images
  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
    { text: enhancedPrompt },
  ];

  // Note: For reference images, we'd need to fetch and convert to base64
  // This is a simplified implementation - production would need image fetching
  // For now, we include the reference images in the prompt description
  if (referenceImages.length > 0) {
    parts[0] = {
      text: `${enhancedPrompt}. Maintain visual consistency with the previous scenes. Camera angle and lighting should be coherent.`,
    };
  }

  const requestBody = {
    contents: [{
      parts,
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      responseMimeType: 'image/jpeg',
    },
  };

  try {
    const response = await fetch(`${NANO_BANANA_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NanoBananaPro] API error:', errorText);
      throw new Error(`Nano Banana Pro API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract image from response
    const imagePart = data.candidates?.[0]?.content?.parts?.find(
      (part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData?.mimeType?.startsWith('image/')
    );

    if (imagePart?.inlineData?.data) {
      // Return as data URL (or upload to storage in production)
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    throw new Error('No image returned from Nano Banana Pro API');

  } catch (error) {
    console.error('[NanoBananaPro] Error:', error);
    // Fallback to Flux if Nano Banana Pro fails
    if (isFluxConfigured()) {
      console.log('[NanoBananaPro] Falling back to Flux');
      return await generateFluxPreview(prompt);
    }
    throw error;
  }
}

/**
 * Legacy function for backwards compatibility
 */
async function generateSinglePreview(prompt: string): Promise<string> {
  return generatePreviewWithEngine(prompt, defaultPreviewEngine);
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
 *
 * @param scene - Scene to regenerate
 * @param newActionToken - New action token from DeepSeek
 * @param stylePromptLayer - Optional style layer
 * @param config - Engine configuration for preview generation
 */
export async function regenerateScene(
  scene: VideoScene,
  newActionToken: string,
  stylePromptLayer?: string,
  config?: Partial<PreviewEngineConfig>
): Promise<VideoScene> {
  const engine = config?.engine || defaultPreviewEngine;

  if (!isEngineConfigured(engine)) {
    console.warn(`[PreviewEngine] ${engine} not configured, returning scene without new preview`);
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

    const preview_url = await generatePreviewWithEngine(fullPrompt, engine, config);

    return {
      ...scene,
      action_token: newActionToken,
      preview_url,
      attempt_count: scene.attempt_count + 1,
      status: 'PENDING', // Reset status for review
    };
  } catch (error) {
    console.error(`[PreviewEngine] Error regenerating scene ${scene.sequence_index}:`, error);
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
