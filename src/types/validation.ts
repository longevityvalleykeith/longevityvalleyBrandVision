/**
 * Phase 3 - Zod Validation Schemas
 * 
 * Comprehensive input validation for all API endpoints.
 * Implements P0 Critical: Input validation & sanitization
 * 
 * @module types/validation
 * @version 3.0.0
 */

import { z } from 'zod';
import { VALIDATION } from './index';

// =============================================================================
// PRIMITIVE VALIDATORS
// =============================================================================

/**
 * Sanitized string - trims whitespace and removes control characters
 * Note: Apply .min(), .max() BEFORE using this, or use sanitizedStringWithLength()
 */
const sanitizeTransform = (val: string) => val.trim().replace(/[\x00-\x1F\x7F]/g, '');

export const sanitizedString = z.string().transform(sanitizeTransform);

/**
 * Helper to create sanitized string with length constraints
 */
export const sanitizedStringWithLength = (min?: number, max?: number) => {
  let schema = z.string();
  if (min !== undefined) schema = schema.min(min);
  if (max !== undefined) schema = schema.max(max);
  return schema.transform(sanitizeTransform);
};

/**
 * Safe integer ID
 */
export const safeId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

/**
 * UUID v4 validator
 */
export const uuid = z.string().uuid();

/**
 * URL validator with protocol enforcement
 */
export const safeUrl = z.string().url().refine(
  (url) => url.startsWith('https://') || url.startsWith('http://'),
  { message: 'URL must use http or https protocol' }
);

/**
 * Email validator
 */
export const email = z.string().email().max(255);

// =============================================================================
// TRAFFIC LIGHT & STAGE VALIDATORS
// =============================================================================

export const TrafficLightStatusSchema = z.enum(['PENDING', 'GREEN', 'YELLOW', 'RED']);

export const DirectorStageSchema = z.enum([
  'IDLE',
  'QUALITY_CHECK',
  'QUALITY_FAILED',
  'REMASTERING',
  'STORYBOARD_REVIEW',
  'RENDERING',
  'COMPLETED',
]);

export const VisionJobStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const VideoPromptStatusSchema = z.enum([
  'idle',
  'reviewing',
  'rendering',
  'completed',
  'failed',
]);

// =============================================================================
// FILE UPLOAD VALIDATION
// =============================================================================

export const FileUploadSchema = z.object({
  /** Original filename */
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .transform(sanitizeTransform)
    .refine(
      (name: string) => /^[\w\-. ]+$/.test(name),
      { message: 'Invalid characters in filename' }
    ),
  /** MIME type */
  mimeType: z.enum(VALIDATION.ALLOWED_MIME_TYPES as unknown as [string, ...string[]]),
  /** File size in bytes */
  size: z.number()
    .int()
    .positive()
    .max(VALIDATION.MAX_FILE_SIZE, `File size exceeds ${VALIDATION.MAX_FILE_SIZE / 1024 / 1024}MB limit`),
  /** Base64 encoded file data or Buffer */
  data: z.union([z.string(), z.instanceof(Buffer)]),
});

export type FileUploadInput = z.infer<typeof FileUploadSchema>;

/**
 * Validate file magic bytes match declared MIME type
 */
export function validateMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
  const bytes = Array.from(buffer.subarray(0, 12));
  
  switch (declaredMimeType) {
    case 'image/jpeg':
      return (
        bytes[0] === VALIDATION.MAGIC_BYTES.JPEG[0] &&
        bytes[1] === VALIDATION.MAGIC_BYTES.JPEG[1] &&
        bytes[2] === VALIDATION.MAGIC_BYTES.JPEG[2]
      );
    case 'image/png':
      return (
        bytes[0] === VALIDATION.MAGIC_BYTES.PNG[0] &&
        bytes[1] === VALIDATION.MAGIC_BYTES.PNG[1] &&
        bytes[2] === VALIDATION.MAGIC_BYTES.PNG[2] &&
        bytes[3] === VALIDATION.MAGIC_BYTES.PNG[3]
      );
    case 'image/webp':
      // WEBP: RIFF....WEBP
      return (
        bytes[0] === 0x52 && bytes[1] === 0x49 && 
        bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 &&
        bytes[10] === 0x42 && bytes[11] === 0x50
      );
    default:
      return false;
  }
}

// =============================================================================
// VIDEO SCENE VALIDATION
// =============================================================================

export const VideoSceneSchema = z.object({
  id: uuid,
  sequence_index: z.number().int().min(1).max(VALIDATION.MAX_SCENES),
  invariant_token: sanitizedStringWithLength(1, VALIDATION.MAX_PROMPT_LENGTH),
  action_token: sanitizedStringWithLength(1, VALIDATION.MAX_PROMPT_LENGTH),
  style_token: sanitizedStringWithLength(undefined, VALIDATION.MAX_PROMPT_LENGTH),
  full_prompt: sanitizedStringWithLength(undefined, VALIDATION.MAX_PROMPT_LENGTH * 3),
  status: TrafficLightStatusSchema,
  preview_url: safeUrl.nullable(),
  video_url: safeUrl.nullable(),
  user_feedback: sanitizedStringWithLength(undefined, VALIDATION.MAX_FEEDBACK_LENGTH).nullable(),
  hidden_style_url: safeUrl.nullable(),
  duration: z.number().min(1).max(60).default(5),
  attempt_count: z.number().int().min(0).max(10).default(0),
});

export type VideoSceneInput = z.infer<typeof VideoSceneSchema>;

// =============================================================================
// DIRECTOR STATE VALIDATION
// =============================================================================

export const DirectorStateSchema = z.object({
  jobId: uuid,
  stage: DirectorStageSchema,
  quality_score: z.number().min(0).max(10),
  source_image_url: safeUrl,
  is_remastered: z.boolean(),
  selected_style_id: sanitizedString.nullable(),
  invariant_visual_summary: sanitizedStringWithLength(undefined, VALIDATION.MAX_PROMPT_LENGTH).nullable(),
  scenes: z.array(VideoSceneSchema).max(VALIDATION.MAX_SCENES),
  cost_estimate: z.number().min(0),
  error_message: sanitizedStringWithLength(undefined, 1000).nullable(),
  started_at: z.date().nullable(),
  completed_at: z.date().nullable(),
});

export type DirectorStateInput = z.infer<typeof DirectorStateSchema>;

// =============================================================================
// API INPUT VALIDATION SCHEMAS
// =============================================================================

/**
 * Init Director endpoint input
 */
export const InitDirectorInputSchema = z.object({
  jobId: uuid,
  forceRemaster: z.boolean().default(false),
  preferredStyleId: sanitizedString.optional(),
}).strict();

export type InitDirectorInputValidated = z.infer<typeof InitDirectorInputSchema>;

/**
 * Refine Action Schema
 */
export const RefineActionSchema = z.object({
  sceneId: uuid,
  status: z.enum(['YELLOW', 'RED']),
  feedback: sanitizedStringWithLength(undefined, VALIDATION.MAX_FEEDBACK_LENGTH).optional(),
}).refine(
  (data) => {
    // YELLOW status requires feedback
    if (data.status === 'YELLOW' && (!data.feedback || data.feedback.length === 0)) {
      return false;
    }
    return true;
  },
  { message: 'Feedback is required when status is YELLOW' }
);

export type RefineActionInput = z.infer<typeof RefineActionSchema>;

/**
 * Refine Storyboard endpoint input
 */
export const RefineStoryboardInputSchema = z.object({
  jobId: uuid,
  refinements: z.array(RefineActionSchema)
    .min(1, 'At least one refinement is required')
    .max(VALIDATION.MAX_SCENES, `Maximum ${VALIDATION.MAX_SCENES} refinements allowed`),
}).strict();

export type RefineStoryboardInputValidated = z.infer<typeof RefineStoryboardInputSchema>;

/**
 * Approve Production endpoint input
 */
export const ApproveProductionInputSchema = z.object({
  jobId: uuid,
  confirmedSceneIds: z.array(uuid)
    .min(1, 'At least one scene must be confirmed')
    .max(VALIDATION.MAX_SCENES),
}).strict();

export type ApproveProductionInputValidated = z.infer<typeof ApproveProductionInputSchema>;

/**
 * Get Director State endpoint input
 */
export const GetDirectorStateInputSchema = z.object({
  jobId: uuid,
}).strict();

export type GetDirectorStateInputValidated = z.infer<typeof GetDirectorStateInputSchema>;

// =============================================================================
// PAGINATION VALIDATION
// =============================================================================

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

// =============================================================================
// STYLE PRESET VALIDATION
// =============================================================================

export const StyleCategorySchema = z.enum([
  'luxury',
  'tech',
  'nature',
  'urban',
  'minimal',
  'dramatic',
]);

export const StylePresetSchema = z.object({
  id: sanitizedStringWithLength(1, 50),
  name: sanitizedStringWithLength(1, 100),
  description: sanitizedStringWithLength(undefined, 500),
  prompt_layer: sanitizedStringWithLength(undefined, VALIDATION.MAX_PROMPT_LENGTH),
  hidden_ref_url: safeUrl,
  category: StyleCategorySchema,
  is_premium: z.boolean(),
});

export type StylePresetInput = z.infer<typeof StylePresetSchema>;

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Format Zod errors into user-friendly messages
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  
  return formatted;
}

/**
 * Create validation error response
 */
export function createValidationError(error: z.ZodError) {
  return {
    code: 'VALIDATION_ERROR' as const,
    message: 'Input validation failed',
    details: formatZodErrors(error),
    timestamp: new Date(),
  };
}
