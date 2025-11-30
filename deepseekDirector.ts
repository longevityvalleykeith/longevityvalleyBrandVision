/**
 * Phase 3C - DeepSeek Director Service
 * 
 * Handles storyboard generation and scene refinement using DeepSeek V3.
 * Extracts "Invariant Token" and injects "Style Preset" for consistent video generation.
 * 
 * @module server/services/deepseekDirector
 * @version 3.0.0
 */

import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import type { VideoScene, GeminiAnalysisOutput, StylePreset } from '../../types';
import { createVideoScene, VALIDATION } from '../../types';
import { STYLE_PRESETS, selectBestStyle } from '../utils/stylePresets';

// =============================================================================
// CLIENT INITIALIZATION
// =============================================================================

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
  timeout: 60000, // 60 second timeout
  maxRetries: 3,
});

// =============================================================================
// TYPES
// =============================================================================

export interface StoryboardResult {
  scenes: VideoScene[];
  selected_style_id: string;
  invariant_token: string;
}

export interface DeepSeekSceneOutput {
  action_token: string;
  duration?: number;
  camera_movement?: string;
}

export interface DeepSeekStoryboardOutput {
  selected_style_id: string;
  invariant_token: string;
  scenes: DeepSeekSceneOutput[];
  reasoning?: string;
}

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

const STORYBOARD_SYSTEM_PROMPT = `You are an elite commercial film director with expertise in creating compelling video content from brand analysis.

TASK: Generate a 3-scene storyboard for a short-form video advertisement.

INPUTS PROVIDED:
1. Brand Analysis: Contains visual elements, brand attributes, color palette, and composition data.
2. Available Style Presets: List of visual styles with IDs and descriptions.

YOUR RESPONSIBILITIES:

1. EXTRACT "INVARIANT_TOKEN":
   - Identify the core visual subject that MUST remain consistent across ALL frames
   - This is typically the product, logo, or hero element
   - Format: Descriptive phrase, max 50 words
   - Example: "matte black premium headphones with rose gold accents on white surface"

2. SELECT BEST STYLE PRESET:
   - Choose from available presets based on brand tone and industry
   - Match lighting, mood, and aesthetic to brand attributes
   - Return the preset ID

3. CREATE 3 SCENES:
   - Each scene should have distinct action/motion
   - Scenes should flow logically as a narrative
   - Include camera movements where appropriate
   - Duration: 4-6 seconds per scene

OUTPUT FORMAT (JSON):
{
  "selected_style_id": "PRESET_ID",
  "invariant_token": "core visual subject description",
  "scenes": [
    {
      "action_token": "specific motion/action description",
      "duration": 5,
      "camera_movement": "slow dolly in / static / orbit"
    }
  ],
  "reasoning": "brief explanation of creative choices"
}

IMPORTANT:
- Action tokens should describe MOTION, not static descriptions
- Use cinematic language: dolly, pan, orbit, reveal, emerge
- Keep action tokens under 30 words
- Ensure visual continuity through the invariant token`;

const REFINE_SYSTEM_PROMPT = `You are an elite commercial film director refining a video scene.

CONTEXT: You have an existing scene that needs adjustment based on feedback.

TASK: Generate an improved action token that addresses the feedback while maintaining visual consistency.

RULES:
- Preserve the invariant token (core visual subject)
- Address the specific feedback provided
- Keep action under 30 words
- Use cinematic motion language

OUTPUT FORMAT (JSON):
{
  "new_action_token": "improved action/motion description",
  "changes_made": "brief explanation of adjustments"
}`;

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Generate initial storyboard from Gemini analysis
 */
export async function generateInitialStoryboard(
  geminiAnalysis: GeminiAnalysisOutput,
  availableStyles: StylePreset[] = STYLE_PRESETS
): Promise<StoryboardResult> {
  // Prepare visual context (truncate to avoid token limits)
  const visualContext = JSON.stringify({
    visual_elements: geminiAnalysis.visual_elements,
    brand_attributes: geminiAnalysis.brand_attributes,
    color_palette: geminiAnalysis.color_palette,
    composition: geminiAnalysis.composition,
  }).substring(0, 2000);

  // Prepare style options
  const styleOptions = availableStyles.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    category: s.category,
  }));

  const userPrompt = `
BRAND ANALYSIS:
${visualContext}

AVAILABLE STYLE PRESETS:
${JSON.stringify(styleOptions, null, 2)}

Generate a compelling 3-scene storyboard for this brand.
`;

  try {
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: STORYBOARD_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from DeepSeek');
    }

    const result = JSON.parse(content) as DeepSeekStoryboardOutput;

    // Validate and fallback for style
    let selectedStyle = availableStyles.find((s) => s.id === result.selected_style_id);
    if (!selectedStyle) {
      // Use smart selection as fallback
      selectedStyle = selectBestStyle(
        {
          tone: geminiAnalysis.brand_attributes?.tone,
          industry: geminiAnalysis.brand_attributes?.industry,
          color_mood: geminiAnalysis.color_palette?.mood,
        },
        availableStyles
      );
    }

    // Build VideoScene objects
    const scenes: VideoScene[] = result.scenes.map((scene, index) => 
      createVideoScene({
        id: uuidv4(),
        sequence_index: index + 1,
        invariant_token: sanitizeToken(result.invariant_token),
        action_token: sanitizeToken(scene.action_token),
        style_token: selectedStyle!.prompt_layer,
        full_prompt: buildFullPrompt(
          result.invariant_token,
          scene.action_token,
          selectedStyle!.prompt_layer
        ),
        hidden_style_url: selectedStyle!.hidden_ref_url,
        duration: scene.duration || 5,
      })
    );

    // Ensure we have exactly 3 scenes (pad or trim)
    while (scenes.length < VALIDATION.DEFAULT_SCENE_COUNT) {
      const lastScene = scenes[scenes.length - 1];
      scenes.push(
        createVideoScene({
          id: uuidv4(),
          sequence_index: scenes.length + 1,
          invariant_token: result.invariant_token,
          action_token: `${lastScene?.action_token || 'product reveal'} - alternate angle`,
          style_token: selectedStyle!.prompt_layer,
          full_prompt: buildFullPrompt(
            result.invariant_token,
            'final reveal shot',
            selectedStyle!.prompt_layer
          ),
          hidden_style_url: selectedStyle!.hidden_ref_url,
        })
      );
    }

    return {
      scenes: scenes.slice(0, VALIDATION.MAX_SCENES),
      selected_style_id: selectedStyle!.id,
      invariant_token: result.invariant_token,
    };
  } catch (error) {
    console.error('DeepSeek storyboard generation failed:', error);
    
    // Return fallback storyboard
    return createFallbackStoryboard(geminiAnalysis, availableStyles);
  }
}

/**
 * Refine a scene based on user feedback
 */
export async function refineScenePrompt(
  currentScene: VideoScene,
  feedback: string | null,
  isRedLight: boolean
): Promise<string> {
  const instruction = isRedLight
    ? 'The scene was REJECTED. Generate a completely NEW action that is different from the original.'
    : `The scene needs TWEAKING. User feedback: "${feedback}". Adjust the action while keeping the core motion.`;

  const userPrompt = `
INVARIANT TOKEN (do not change): "${currentScene.invariant_token}"
CURRENT ACTION: "${currentScene.action_token}"
STYLE CONTEXT: ${currentScene.style_token}

${instruction}

Generate an improved action token.
`;

  try {
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: REFINE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: isRedLight ? 0.9 : 0.5, // Higher creativity for RED
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from DeepSeek');
    }

    const result = JSON.parse(content);
    return sanitizeToken(result.new_action_token || currentScene.action_token);
  } catch (error) {
    console.error('DeepSeek refinement failed:', error);
    
    // Return modified original as fallback
    return isRedLight
      ? `${currentScene.action_token} - reimagined`
      : currentScene.action_token;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Build complete prompt from components
 */
function buildFullPrompt(
  invariantToken: string,
  actionToken: string,
  styleToken: string
): string {
  return `${sanitizeToken(invariantToken)}. ${sanitizeToken(actionToken)}. ${styleToken}`.trim();
}

/**
 * Sanitize token to remove problematic characters
 */
function sanitizeToken(token: string): string {
  return token
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, VALIDATION.MAX_PROMPT_LENGTH);
}

/**
 * Create fallback storyboard when AI fails
 */
function createFallbackStoryboard(
  geminiAnalysis: GeminiAnalysisOutput,
  availableStyles: StylePreset[]
): StoryboardResult {
  const style = selectBestStyle(
    {
      tone: geminiAnalysis.brand_attributes?.tone,
      industry: geminiAnalysis.brand_attributes?.industry,
    },
    availableStyles
  );

  const invariantToken = geminiAnalysis.visual_elements?.primary_subject || 'product hero shot';

  const fallbackActions = [
    'slow reveal from shadow into light',
    'gentle 360 degree orbit rotation',
    'dramatic pull back to wide shot',
  ];

  const scenes: VideoScene[] = fallbackActions.map((action, index) =>
    createVideoScene({
      id: uuidv4(),
      sequence_index: index + 1,
      invariant_token: invariantToken,
      action_token: action,
      style_token: style.prompt_layer,
      full_prompt: buildFullPrompt(invariantToken, action, style.prompt_layer),
      hidden_style_url: style.hidden_ref_url,
    })
  );

  return {
    scenes,
    selected_style_id: style.id,
    invariant_token: invariantToken,
  };
}

/**
 * Validate DeepSeek API is configured
 */
export function isDeepSeekConfigured(): boolean {
  return !!process.env.DEEPSEEK_API_KEY;
}

/**
 * Health check for DeepSeek service
 */
export async function checkDeepSeekHealth(): Promise<boolean> {
  if (!isDeepSeekConfigured()) {
    return false;
  }

  try {
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 10,
    });
    return !!completion.choices[0]?.message?.content;
  } catch {
    return false;
  }
}
