/**
 * Phase 3C - DeepSeek Director Service
 *
 * Handles AI-powered video storyboard generation and refinement.
 * Uses DeepSeek AI to create scene descriptions based on brand analysis.
 *
 * @module server/services/deepseekDirector
 * @version 3.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import type { GeminiAnalysisOutput, VideoScene, StylePreset } from '@/types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const DEFAULT_SCENE_COUNT = 3;
const MAX_RETRIES = 3;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface StoryboardResult {
  scenes: VideoScene[];
  selected_style_id: string;
  invariant_token: string; // Core visual identity that persists across all scenes
}

// =============================================================================
// HEALTH CHECKS
// =============================================================================

/**
 * Check if DeepSeek is configured with API key
 */
export function isDeepSeekConfigured(): boolean {
  return Boolean(DEEPSEEK_API_KEY);
}

/**
 * Check DeepSeek API health
 */
export async function checkDeepSeekHealth(): Promise<boolean> {
  if (!isDeepSeekConfigured()) {
    return false;
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'health check' }],
        max_tokens: 10,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

// =============================================================================
// STORYBOARD GENERATION
// =============================================================================

/**
 * Generate initial storyboard based on brand analysis
 */
export async function generateInitialStoryboard(
  analysis: GeminiAnalysisOutput,
  availableStyles: StylePreset[]
): Promise<StoryboardResult> {
  if (!isDeepSeekConfigured()) {
    throw new Error('DeepSeek API key not configured');
  }

  // Select best style based on brand attributes
  const selectedStyle = selectBestStyle(analysis, availableStyles);

  // Generate invariant visual summary
  const invariant_token = createInvariantToken(analysis);

  // Generate scene action tokens
  const scenePrompts = await generateScenePrompts(analysis, selectedStyle, invariant_token);

  // Create VideoScene objects
  const scenes: VideoScene[] = scenePrompts.map((action_token, index) => ({
    id: uuidv4(),
    sequence_index: index + 1,
    action_token,
    status: 'PENDING',
    attempt_count: 0,
  }));

  return {
    scenes,
    selected_style_id: selectedStyle.id,
    invariant_token,
  };
}

/**
 * Select the best style preset based on brand analysis
 */
function selectBestStyle(
  analysis: GeminiAnalysisOutput,
  availableStyles: StylePreset[]
): StylePreset {
  if (availableStyles.length === 0) {
    throw new Error('No style presets available');
  }

  // If analysis recommends a style, use it if available
  if (analysis.recommended_style_id) {
    const recommended = availableStyles.find((s) => s.id === analysis.recommended_style_id);
    if (recommended) {
      return recommended;
    }
  }

  // Otherwise, select based on mood and industry
  const mood = analysis.brand_attributes.mood.toLowerCase();
  const industry = analysis.brand_attributes.industry?.toLowerCase();

  // Map moods to categories
  let selected: StylePreset | undefined;

  if (mood.includes('luxury') || mood.includes('elegant') || mood.includes('premium')) {
    selected = availableStyles.find((s) => s.category === 'luxury');
  } else if (mood.includes('tech') || mood.includes('modern') || industry?.includes('technology')) {
    selected = availableStyles.find((s) => s.category === 'tech');
  } else if (mood.includes('natural') || mood.includes('organic') || industry?.includes('wellness')) {
    selected = availableStyles.find((s) => s.category === 'nature');
  } else if (mood.includes('dramatic') || mood.includes('bold')) {
    selected = availableStyles.find((s) => s.category === 'dramatic');
  } else if (mood.includes('minimal') || mood.includes('clean') || mood.includes('simple')) {
    selected = availableStyles.find((s) => s.category === 'minimal');
  }

  // Default to first available style
  return selected || availableStyles[0];
}

/**
 * Create invariant visual token that persists across all scenes
 */
function createInvariantToken(analysis: GeminiAnalysisOutput): string {
  const { brand_attributes, visual_elements } = analysis;

  const colorDescriptor = brand_attributes.primary_colors.length > 0
    ? `${brand_attributes.primary_colors.join(', ')} color palette`
    : '';

  const styleKeywords = visual_elements.style_keywords.slice(0, 3).join(', ');

  return [
    brand_attributes.mood,
    colorDescriptor,
    styleKeywords,
    visual_elements.composition,
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Generate scene prompts using DeepSeek API
 */
async function generateScenePrompts(
  analysis: GeminiAnalysisOutput,
  style: StylePreset,
  invariant_token: string
): Promise<string[]> {
  const systemPrompt = `You are a professional video director creating scene descriptions for a brand video.

BRAND CONTEXT:
- Mood: ${analysis.brand_attributes.mood}
- Colors: ${analysis.brand_attributes.primary_colors.join(', ')}
- Visual Style: ${analysis.visual_elements.style_keywords.join(', ')}
- Composition: ${analysis.visual_elements.composition}

STYLE PRESET: ${style.name}
- ${style.description}
- Template: ${style.prompt_template}

INVARIANT VISUAL IDENTITY:
${invariant_token}

TASK:
Create ${DEFAULT_SCENE_COUNT} distinct scene descriptions that maintain the brand's visual identity while showing progression and variety.

Each scene should:
1. Be 1-2 sentences describing the visual action
2. Maintain the invariant visual identity
3. Follow the style preset aesthetics
4. Show clear progression (e.g., close-up → medium → wide, or intro → detail → finale)
5. Be specific and actionable for video generation

OUTPUT FORMAT:
Return ONLY ${DEFAULT_SCENE_COUNT} scene descriptions, one per line, numbered 1-${DEFAULT_SCENE_COUNT}.`;

  const userPrompt = `Generate ${DEFAULT_SCENE_COUNT} scene descriptions for this brand.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8, // Higher temperature for creative scene generation
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from DeepSeek API');
    }

    // Parse numbered list
    const scenes = content
      .split('\n')
      .filter((line: string) => /^\d+\./.test(line.trim()))
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, DEFAULT_SCENE_COUNT);

    if (scenes.length < DEFAULT_SCENE_COUNT) {
      throw new Error(`Expected ${DEFAULT_SCENE_COUNT} scenes, got ${scenes.length}`);
    }

    return scenes;
  } catch (error) {
    console.error('Error generating scene prompts:', error);
    // Fallback: Generate basic scene descriptions
    return generateFallbackScenes(analysis, invariant_token);
  }
}

/**
 * Generate fallback scenes if API fails
 */
function generateFallbackScenes(
  analysis: GeminiAnalysisOutput,
  invariant_token: string
): string[] {
  const subject = analysis.visual_elements.focal_points[0] || analysis.visual_elements.composition || 'the product';

  return [
    `Close-up of ${subject} with ${invariant_token}, smooth reveal`,
    `Medium shot showcasing details of ${subject}, ${analysis.brand_attributes.mood} atmosphere`,
    `Wide establishing shot featuring ${subject}, ${invariant_token}, elegant finale`,
  ];
}

// =============================================================================
// SCENE REFINEMENT
// =============================================================================

/**
 * Refine a scene based on user feedback
 */
export async function refineScenePrompt(
  scene: VideoScene,
  feedback: string | null,
  isFullRegeneration: boolean
): Promise<string> {
  if (!isDeepSeekConfigured()) {
    throw new Error('DeepSeek API key not configured');
  }

  if (isFullRegeneration) {
    // RED status: Complete regeneration
    return await regenerateScenePrompt(scene);
  } else {
    // YELLOW status: Tweak with feedback
    return await tweakScenePrompt(scene, feedback || '');
  }
}

/**
 * Completely regenerate a scene prompt (RED status)
 */
async function regenerateScenePrompt(scene: VideoScene): Promise<string> {
  const systemPrompt = `You are a professional video director. Generate a completely new scene description that is DIFFERENT from the original but maintains the same sequence position.

ORIGINAL SCENE (to avoid repeating):
${scene.action_token}

REQUIREMENTS:
- Create a NEW scene description
- Different angle, composition, or focus
- Maintain the same general sequence purpose (scene ${scene.sequence_index})
- 1-2 sentences, specific and actionable`;

  const userPrompt = `Generate a completely new scene ${scene.sequence_index} description.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content.trim() || scene.action_token;
  } catch (error) {
    console.error('Error regenerating scene prompt:', error);
    return `${scene.action_token} (alternative angle)`;
  }
}

/**
 * Tweak a scene prompt with user feedback (YELLOW status)
 */
async function tweakScenePrompt(scene: VideoScene, feedback: string): Promise<string> {
  const systemPrompt = `You are a professional video director. Refine this scene description based on user feedback.

CURRENT SCENE:
${scene.action_token}

USER FEEDBACK:
${feedback}

TASK:
Modify the scene description to incorporate the feedback while keeping the core concept intact. Return ONLY the refined scene description (1-2 sentences).`;

  const userPrompt = `Refine the scene based on the feedback.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content.trim() || scene.action_token;
  } catch (error) {
    console.error('Error tweaking scene prompt:', error);
    return `${scene.action_token} [${feedback}]`;
  }
}
