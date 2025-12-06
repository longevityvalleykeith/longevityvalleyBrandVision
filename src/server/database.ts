/**
 * Longevity Valley - Database Types
 * Auto-generated from Supabase schema
 * 
 * @module types/database
 */

// =============================================================================
// ENUMS
// =============================================================================

export type VisionJobStatus = 
  | 'pending'
  | 'analyzing'
  | 'completed'
  | 'flagged'
  | 'failed';

export type VideoPromptStatus = 
  | 'scripting'
  | 'preview_generation'
  | 'review'
  | 'rendering'
  | 'completed'
  | 'failed';

export type ProductionEngine = 
  | 'KLING'
  | 'LUMA'
  | 'GEMINI_PRO';

export type TrafficLight = 
  | 'PENDING'
  | 'GREEN'
  | 'YELLOW'
  | 'RED';

export type UserPlan = 
  | 'free'
  | 'pro'
  | 'enterprise';

// =============================================================================
// TABLE TYPES
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  plan: UserPlan;
  credits_remaining: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface VisionJob {
  id: string;
  user_id: string;
  
  // Original Upload
  image_url: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_hash: string | null;
  
  // Style Reference (Generated)
  style_reference_url: string | null;
  brand_essence_prompt: string | null;
  
  // Analysis Results
  status: VisionJobStatus;
  gemini_output: GeminiAnalysisOutput | null;
  
  // Scores
  physics_score: number | null;
  vibe_score: number | null;
  logic_score: number | null;
  integrity_score: number | null;
  
  // Error Tracking
  error_message: string | null;
  retry_count: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  deleted_at: string | null;
}

export interface VisionJobVideoPrompt {
  id: string;
  job_id: string;
  
  // Routing
  production_engine: ProductionEngine;
  routing_reason: string | null;
  
  // State
  status: VideoPromptStatus;
  scenes_data: SceneData[];
  conversation_history: ConversationMessage[];
  
  // External API
  external_job_id: string | null;
  
  // Cost
  credits_used: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface RateLimitBucket {
  id: string;
  identifier: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  window_end: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string | null;
  prompt_layer: string;
  hidden_ref_url: string;
  category: string;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// NESTED TYPES
// =============================================================================

export interface GeminiAnalysisOutput {
  // Scores
  physics_score: number;
  vibe_score: number;
  logic_score: number;
  integrity_score: number;
  
  // Brand DNA
  brand_essence_prompt: string;
  visual_elements: VisualElements;
  brand_attributes: BrandAttributes;
  color_palette: ColorPalette;
  
  // Raw output
  raw_analysis?: string;
}

export interface VisualElements {
  primary_subject: string;
  background: string;
  objects: string[];
  text_elements: string[];
  lighting: string;
}

export interface BrandAttributes {
  tone: string[];
  target_audience: string;
  industry: string;
  personality_traits: string[];
}

export interface ColorPalette {
  dominant: string[];
  accent: string[];
  mood: string;
}

export interface SceneData {
  id: string;
  sequence_index: number;
  
  // From DeepSeek (Technical Director)
  cinematography_prompt: string;
  camera_movement: string;
  lighting_notes: string;
  invariant_token: string;
  
  // From Flux (Artistic Director)
  preview_image_url: string | null;
  preview_seed: number | null;
  
  // Traffic Light System
  traffic_light: TrafficLight;
  user_feedback: string | null;
  
  // Production Output
  final_video_url: string | null;
  
  // Metadata
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface StyleReference {
  original_url: string;
  style_reference_url: string;
  brand_essence_prompt: string;
  color_palette: string[];
  invariant_elements: string[];
  processing: {
    method: 'flux-dev-img2img';
    strength: number;
    seed: number;
  };
}

export interface YellowContextPayload {
  brand_essence_prompt: string;
  style_reference_url: string;
  current_scene: SceneData;
  conversation_history: ConversationMessage[];
  user_assets: Array<{
    url: string;
    type: 'image' | 'video';
    uploaded_at: string;
  }>;
  prompt_history: Array<{
    prompt: string;
    result_url: string;
    feedback: string | null;
  }>;
  user_feedback: string;
}

export interface RoutingDecision {
  engine: ProductionEngine;
  reason: string;
  scores: {
    physics: number;
    vibe: number;
    logic: number;
  };
}

// =============================================================================
// INSERT TYPES (for creating new records)
// =============================================================================

export type NewUser = Omit<User, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
export type NewVisionJob = Omit<VisionJob, 'id' | 'created_at' | 'updated_at' | 'processed_at' | 'deleted_at'>;
export type NewVisionJobVideoPrompt = Omit<VisionJobVideoPrompt, 'id' | 'created_at' | 'updated_at' | 'completed_at'>;
export type NewAuditLog = Omit<AuditLog, 'id' | 'created_at'>;

// =============================================================================
// SUPABASE DATABASE TYPE
// =============================================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: NewUser & { id?: string };
        Update: Partial<User>;
      };
      vision_jobs: {
        Row: VisionJob;
        Insert: NewVisionJob & { id?: string };
        Update: Partial<VisionJob>;
      };
      vision_job_video_prompts: {
        Row: VisionJobVideoPrompt;
        Insert: NewVisionJobVideoPrompt & { id?: string };
        Update: Partial<VisionJobVideoPrompt>;
      };
      rate_limit_buckets: {
        Row: RateLimitBucket;
        Insert: Omit<RateLimitBucket, 'id'> & { id?: string };
        Update: Partial<RateLimitBucket>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: NewAuditLog & { id?: string };
        Update: Partial<AuditLog>;
      };
      style_presets: {
        Row: StylePreset;
        Insert: Omit<StylePreset, 'created_at' | 'updated_at'>;
        Update: Partial<StylePreset>;
      };
    };
    Views: {};
    Functions: {
      determine_production_engine: {
        Args: {
          p_physics_score: number;
          p_vibe_score: number;
          p_logic_score: number;
        };
        Returns: ProductionEngine;
      };
      should_flag_job: {
        Args: { p_integrity_score: number };
        Returns: boolean;
      };
      user_owns_job: {
        Args: { job_id: string };
        Returns: boolean;
      };
      user_has_credits: {
        Args: { required_credits: number };
        Returns: boolean;
      };
      deduct_user_credits: {
        Args: { amount: number };
        Returns: boolean;
      };
    };
    Enums: {
      vision_job_status: VisionJobStatus;
      video_prompt_status: VideoPromptStatus;
      production_engine: ProductionEngine;
      traffic_light: TrafficLight;
      user_plan: UserPlan;
    };
  };
}
