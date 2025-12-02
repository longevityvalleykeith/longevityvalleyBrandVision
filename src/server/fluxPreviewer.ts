/**
 * Phase 3C - Flux Previewer Service
 * 
 * Generates preview images using Flux-Schnell for storyboard review.
 * Also handles image remastering using Flux-Dev for quality improvement.
 * 
 * @module server/services/fluxPreviewer
 * @version 3.0.0
 */

import type { VideoScene } from '../../types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const FAL_API_KEY = process.env.FAL_API_KEY;
const FAL_API_URL = 'https://fal.run';

// Model endpoints
const FLUX_SCHNELL_MODEL = 'fal-ai/flux/schnell';
const FLUX_DEV_MODEL = 'fal-ai/flux/dev';

// Generation settings
const PREVIEW_WIDTH = 1280;
const PREVIEW_HEIGHT = 720;
const REMASTER_WIDTH = 1920;
const REMASTER_HEIGHT = 1080;

// =============================================================================
// TYPES
// =============================================================================

interface FluxGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
  image_url?: string; // For img2img
}

interface FluxResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  seed: number;
  prompt: string;
}

// =============================================================================
// CORE GENERATION FUNCTIONS
// =============================================================================

/**
 * Generate image using Flux-Schnell (fast preview)
 */
async function generateFluxSchnell(options: FluxGenerationOptions): Promise<string> {
  if (!FAL_API_KEY) {
    console.warn('FAL_API_KEY not configured, using placeholder');
    return createPlaceholderUrl(options.prompt);
  }

  try {
    const response = await fetch(`${FAL_API_URL}/${FLUX_SCHNELL_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: options.prompt,
        image_size: {
          width: options.width || PREVIEW_WIDTH,
          height: options.height || PREVIEW_HEIGHT,
        },
        num_inference_steps: options.num_inference_steps || 4, // Schnell is fast
        seed: options.seed,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Flux API error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as FluxResponse;
    
    if (!result.images?.[0]?.url) {
      throw new Error('No image URL in Flux response');
    }

    return result.images[0].url;
  } catch (error) {
    console.error('Flux-Schnell generation failed:', error);
    return createPlaceholderUrl(options.prompt);
  }
}

/**
 * Generate high-quality image using Flux-Dev (for remastering)
 */
async function generateFluxDev(options: FluxGenerationOptions): Promise<string> {
  if (!FAL_API_KEY) {
    console.warn('FAL_API_KEY not configured, returning original');
    return options.image_url || createPlaceholderUrl(options.prompt);
  }

  try {
    const body: Record<string, unknown> = {
      prompt: options.prompt,
      image_size: {
        width: options.width || REMASTER_WIDTH,
        height: options.height || REMASTER_HEIGHT,
      },
      num_inference_steps: options.num_inference_steps || 28,
      guidance_scale: options.guidance_scale || 3.5,
      seed: options.seed,
      enable_safety_checker: true,
    };

    // If source image provided, use img2img mode
    if (options.image_url) {
      body.image_url = options.image_url;
      body.strength = 0.75; // How much to modify the original
    }

    const response = await fetch(`${FAL_API_URL}/${FLUX_DEV_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Flux API error: ${response.status} - ${error}`);
    }

    const result = (await response.json()) as FluxResponse;
    
    if (!result.images?.[0]?.url) {
      throw new Error('No image URL in Flux response');
    }

    return result.images[0].url;
  } catch (error) {
    console.error('Flux-Dev generation failed:', error);
    return options.image_url || createPlaceholderUrl(options.prompt);
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Generate preview images for all scenes in parallel
 */
export async function generateFluxPreviews(scenes: VideoScene[]): Promise<VideoScene[]> {
  const previewPromises = scenes.map(async (scene) => {
    try {
      const previewUrl = await generateFluxSchnell({
        prompt: scene.full_prompt,
        width: PREVIEW_WIDTH,
        height: PREVIEW_HEIGHT,
      });

      return {
        ...scene,
        preview_url: previewUrl,
        status: 'GREEN' as const,
        attempt_count: scene.attempt_count + 1,
      };
    } catch (error) {
      console.error(`Preview generation failed for scene ${scene.id}:`, error);
      
      return {
        ...scene,
        preview_url: createPlaceholderUrl(scene.action_token),
        status: 'PENDING' as const,
        attempt_count: scene.attempt_count + 1,
      };
    }
  });

  return Promise.all(previewPromises);
}

/**
 * Generate single preview for a refined scene
 */
export async function generateSinglePreview(scene: VideoScene): Promise<VideoScene> {
  try {
    const previewUrl = await generateFluxSchnell({
      prompt: scene.full_prompt,
      width: PREVIEW_WIDTH,
      height: PREVIEW_HEIGHT,
    });

    return {
      ...scene,
      preview_url: previewUrl,
      status: 'GREEN' as const,
      attempt_count: scene.attempt_count + 1,
    };
  } catch (error) {
    console.error(`Preview generation failed for scene ${scene.id}:`, error);
    
    return {
      ...scene,
      status: 'PENDING' as const,
      attempt_count: scene.attempt_count + 1,
    };
  }
}

/**
 * Remaster low-quality source image using Flux-Dev
 */
export async function runFluxRemaster(
  originalUrl: string,
  enhancementPrompt?: string
): Promise<string> {
  const prompt = enhancementPrompt || 
    'high quality, sharp focus, professional photography, 8k resolution, detailed, clean';

  try {
    const remasteredUrl = await generateFluxDev({
      prompt,
      image_url: originalUrl,
      width: REMASTER_WIDTH,
      height: REMASTER_HEIGHT,
      num_inference_steps: 35,
      guidance_scale: 4.0,
    });

    return remasteredUrl;
  } catch (error) {
    console.error('Image remaster failed:', error);
    return originalUrl; // Return original on failure
  }
}

/**
 * Regenerate a specific scene with new parameters
 */
export async function regenerateScene(
  scene: VideoScene,
  newActionToken: string,
  styleToken: string
): Promise<VideoScene> {
  const fullPrompt = `${scene.invariant_token}. ${newActionToken}. ${styleToken}`;

  const previewUrl = await generateFluxSchnell({
    prompt: fullPrompt,
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
  });

  return {
    ...scene,
    action_token: newActionToken,
    full_prompt: fullPrompt,
    preview_url: previewUrl,
    status: 'GREEN' as const,
    attempt_count: scene.attempt_count + 1,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create placeholder URL for development/fallback
 */
function createPlaceholderUrl(text: string): string {
  const encodedText = encodeURIComponent(text.substring(0, 50));
  return `https://via.placeholder.com/${PREVIEW_WIDTH}x${PREVIEW_HEIGHT}.png?text=${encodedText}`;
}

/**
 * Check if Flux API is configured
 */
export function isFluxConfigured(): boolean {
  return !!FAL_API_KEY;
}

/**
 * Health check for Flux service
 */
export async function checkFluxHealth(): Promise<boolean> {
  if (!FAL_API_KEY) {
    return false;
  }

  try {
    // Simple API connectivity check
    const response = await fetch(`${FAL_API_URL}/${FLUX_SCHNELL_MODEL}`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
      },
    });
    return response.ok || response.status === 405; // 405 is expected for OPTIONS
  } catch {
    return false;
  }
}

/**
 * Estimate generation time based on parameters
 */
export function estimateGenerationTime(
  sceneCount: number,
  isRemaster: boolean
): number {
  // Schnell: ~2-3 seconds per image
  // Dev: ~15-20 seconds per image
  const schnellTime = sceneCount * 3;
  const devTime = isRemaster ? 20 : 0;
  
  return schnellTime + devTime;
}

/**
 * Get optimal image dimensions for aspect ratio
 */
export function getOptimalDimensions(
  targetAspectRatio: '16:9' | '9:16' | '1:1' | '4:3'
): { width: number; height: number } {
  const dimensions: Record<string, { width: number; height: number }> = {
    '16:9': { width: 1280, height: 720 },
    '9:16': { width: 720, height: 1280 },
    '1:1': { width: 1024, height: 1024 },
    '4:3': { width: 1024, height: 768 },
  };

  return dimensions[targetAspectRatio] || dimensions['16:9'];
}
