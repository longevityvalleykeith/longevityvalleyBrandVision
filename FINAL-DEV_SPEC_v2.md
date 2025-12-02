# 📜 FINAL-DEV_SPEC.md: Longevity Valley Architecture (v2.0)

**Authority:** Gemini (CTO)  
**Stack:** Next.js 15 + Supabase (Postgres/Realtime/Storage) + tRPC (v11)  
**Testing Strategy:** Headless-First (Deno/Vitest)  
**Last Updated:** December 2, 2025

---

## 0. Document Control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 30, 2025 | Initial architecture |
| 2.0 | Dec 2, 2025 | Added security section, error handling, Flux fallback, style_reference workflow |

---

## 1. AI Agent Roles & Responsibilities

### **The Strategist: Gemini 2.0/3.0 Pro**
* **Role:** **Brand DNA Extraction + Style Reference Generation**
* **Input:** Raw Image / Brand Assets
* **Output:** 
  - Brand Strategy JSON (Physics Score, Vibe Score, Logic Score)
  - `style_reference_url` (Optimized derivative for downstream agents)
  - `integrity_score` (0.0 - 1.0)
* **Safety:** **Integrity Filter**. Score < 0.4 = Job flagged for review.

### **The Technical Director: DeepSeek V3**
* **Role:** **Cinematography & Production Routing**
* **Input:** 
  - Brand Strategy JSON
  - `style_reference_url`
  - `SKILL.md` Logic (cinematography rules)
* **Task:**
  1. Determine **Production Route** (Kling vs. Luma vs. Gemini Pro)
  2. Write **Technical Script** (Camera angles, lighting, motion)
  3. Generate **Invariant Tokens** (visual anchors that must persist)
* **Output:** Storyboard JSON with routing decision

### **The Artistic Director: Flux (via Fal.ai)**
* **Role:** **Rapid Visual Prototyping**
* **Model:** `fal-ai/flux/schnell` (Preview) / `fal-ai/flux/dev` (Remaster)
* **Input:**
  - Technical Script from DeepSeek
  - `style_reference_url` (for style consistency)
* **Task:** Generate static image previews from the Technical Script
* **Why Flux:** Sub-4s latency, proven Fal.ai integration, no GCP dependency

> **Future:** Migrate to Imagen 3 Fast when Vertex AI access is acquired.

### **The Production Engines (Dynamic Routing)**

| Engine | Use Case | Trigger Condition |
|--------|----------|-------------------|
| **Kling AI** | High physics/liquid dynamics | `physics_score > 0.7` |
| **Luma Dream Machine** | "Vibe" transfer, aesthetic motion | `vibe_score > 0.7` |
| **Gemini 3 Pro (Video)** | High logic/text requirements | `logic_score > 0.7` |

**Routing Priority:** Physics > Vibe > Logic (if multiple scores are high)

---

## 2. The Style Reference Pipeline (Maximum Semantic Fidelity)

### Problem Statement
Raw user uploads often contain noise (backgrounds, text overlays, compression artifacts) that cause **semantic drift** when passed directly to generation models.

### Solution: The "Brand Essence Distillation" Process

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STYLE REFERENCE GENERATION FLOW                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [User Upload]                                                           │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 1: GEMINI ANALYSIS                                        │    │
│  │  ───────────────────────────                                     │    │
│  │  • Extract Brand DNA (colors, mood, subject)                     │    │
│  │  • Calculate Scores (physics, vibe, logic)                       │    │
│  │  • Generate `brand_essence_prompt` (distilled description)       │    │
│  │  • Output: JSON + integrity_score                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 2: STYLE REFERENCE SYNTHESIS                              │    │
│  │  ──────────────────────────────────                              │    │
│  │  • Input: Original image + brand_essence_prompt                  │    │
│  │  • Process: Flux-Dev img2img (strength: 0.3-0.5)                 │    │
│  │  • Output: Clean, noise-free style reference                     │    │
│  │  • Store: Supabase Storage → `style_reference_url`               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ├──────────────────────┬──────────────────────┐                   │
│       ▼                      ▼                      ▼                   │
│  [DeepSeek]            [Flux Preview]         [Production]              │
│  Technical             Artistic               Engine Input              │
│  Director              Director               (Kling/Luma)              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Style Reference Specification

```typescript
interface StyleReference {
  /** Original user upload URL */
  original_url: string;
  
  /** Processed style reference (noise-free derivative) */
  style_reference_url: string;
  
  /** Distilled brand description for prompt injection */
  brand_essence_prompt: string;
  
  /** Dominant colors extracted (hex) */
  color_palette: string[];
  
  /** Visual anchors that must persist across all outputs */
  invariant_elements: string[];
  
  /** Processing metadata */
  processing: {
    method: 'flux-dev-img2img';
    strength: number;  // 0.3-0.5 recommended
    seed: number;      // For reproducibility
  };
}
```

### Why This Works
1. **Noise Reduction:** img2img at low strength removes artifacts while preserving essence
2. **Consistency:** Same `style_reference_url` feeds all downstream agents
3. **Reproducibility:** Stored seed allows regeneration if needed
4. **Semantic Anchor:** `brand_essence_prompt` provides textual grounding

---

## 3. Database Schema (Supabase SSOT)

### Table: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  plan VARCHAR(50) DEFAULT 'free' NOT NULL,
  credits_remaining INTEGER DEFAULT 10 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);
```

### Table: `vision_jobs` (Phase 3B - Brand Analysis)
```sql
CREATE TABLE vision_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Original Upload
  image_url TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash VARCHAR(64),  -- SHA256 for deduplication
  
  -- Style Reference (Generated)
  style_reference_url TEXT,
  brand_essence_prompt TEXT,
  
  -- Analysis Results
  status VARCHAR(20) DEFAULT 'pending' NOT NULL
    CHECK (status IN ('pending', 'analyzing', 'completed', 'flagged', 'failed')),
  analysis_data JSONB,  -- Full Gemini output
  
  -- Scores (denormalized for efficient routing queries)
  physics_score DECIMAL(3,2),
  vibe_score DECIMAL(3,2),
  logic_score DECIMAL(3,2),
  integrity_score DECIMAL(3,2),
  
  -- Error Tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- P0 Critical: Indexes on foreign keys and query columns
CREATE INDEX idx_vision_jobs_user_id ON vision_jobs(user_id);
CREATE INDEX idx_vision_jobs_status ON vision_jobs(status);
CREATE INDEX idx_vision_jobs_created_at ON vision_jobs(created_at DESC);
CREATE INDEX idx_vision_jobs_user_status ON vision_jobs(user_id, status);
CREATE INDEX idx_vision_jobs_routing ON vision_jobs(physics_score, vibe_score, logic_score);
```

### Table: `vision_job_video_prompts` (Phase 3C - The Director)
```sql
CREATE TABLE vision_job_video_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES vision_jobs(id) ON DELETE CASCADE,
  
  -- Routing Decision
  production_engine VARCHAR(20) NOT NULL
    CHECK (production_engine IN ('KLING', 'LUMA', 'GEMINI_PRO')),
  routing_reason TEXT,  -- Why this engine was selected
  
  -- Workflow State
  status VARCHAR(30) DEFAULT 'scripting' NOT NULL
    CHECK (status IN ('scripting', 'preview_generation', 'review', 'rendering', 'completed', 'failed')),
  
  -- Scene Data (JSONB array)
  scenes_data JSONB NOT NULL DEFAULT '[]',
  
  -- Conversation Context (for YELLOW flow)
  conversation_history JSONB DEFAULT '[]',
  
  -- External API Tracking
  external_job_id VARCHAR(100),  -- Kling/Luma job ID
  
  -- Cost Tracking
  credits_used DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_video_prompts_job_id ON vision_job_video_prompts(job_id);
CREATE INDEX idx_video_prompts_status ON vision_job_video_prompts(status);
CREATE INDEX idx_video_prompts_engine ON vision_job_video_prompts(production_engine);
```

### Table: `rate_limit_buckets` (P0 Critical)
```sql
CREATE TABLE rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL,  -- user_id:endpoint or ip:endpoint
  endpoint VARCHAR(100) NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  
  UNIQUE(identifier, endpoint)
);

CREATE INDEX idx_rate_limit_identifier ON rate_limit_buckets(identifier, endpoint);
CREATE INDEX idx_rate_limit_window_end ON rate_limit_buckets(window_end);
```

### Table: `audit_logs`
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### Scene Data Schema
```typescript
interface SceneData {
  id: string;  // UUID
  sequence_index: number;
  
  // From DeepSeek (Technical Director)
  cinematography_prompt: string;
  camera_movement: string;
  lighting_notes: string;
  invariant_token: string;  // Visual anchor
  
  // From Flux (Artistic Director)
  preview_image_url: string | null;
  preview_seed: number | null;
  
  // Traffic Light System
  traffic_light: 'PENDING' | 'GREEN' | 'YELLOW' | 'RED';
  user_feedback: string | null;
  
  // Production Output
  final_video_url: string | null;
  
  // Metadata
  attempt_count: number;
  created_at: string;
  updated_at: string;
}
```

---

## 4. The "Financial Firewall" Workflow

### State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DIRECTOR STATE MACHINE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐                                                           │
│  │ SCRIPTING │ ◄─────────────────────────────────────────┐              │
│  └─────┬────┘                                            │              │
│        │ DeepSeek generates script + routing             │              │
│        ▼                                                 │              │
│  ┌─────────────────────┐                                 │              │
│  │ PREVIEW_GENERATION  │                                 │              │
│  └─────────┬───────────┘                                 │              │
│            │ Flux generates 3 scene previews             │              │
│            ▼                                             │              │
│  ┌─────────────────────┐                                 │              │
│  │       REVIEW        │ ◄───────────────────┐           │              │
│  │  (Traffic Light)    │                     │           │              │
│  └─────────┬───────────┘                     │           │              │
│            │                                 │           │              │
│    ┌───────┼───────┬─────────────────┐       │           │              │
│    │       │       │                 │       │           │              │
│    ▼       ▼       ▼                 │       │           │              │
│   🟢      🟡       🔴                │       │           │              │
│  GREEN   YELLOW    RED               │       │           │              │
│    │       │       │                 │       │           │              │
│    │       │       └─────────────────┼───────┼───────────┘              │
│    │       │         Re-roll script  │       │  Re-roll scene           │
│    │       │                         │       │                          │
│    │       ▼                         │       │                          │
│    │  ┌────────────────┐             │       │                          │
│    │  │ YELLOW CONTEXT │             │       │                          │
│    │  │    (Gemini)    │─────────────┘       │                          │
│    │  └────────────────┘                     │                          │
│    │    Conversational edit                  │                          │
│    │                                         │                          │
│    ▼                                         │                          │
│  ┌─────────────────────┐                     │                          │
│  │     RENDERING       │                     │                          │
│  │  (Kling/Luma/Gemini)│                     │                          │
│  └─────────┬───────────┘                     │                          │
│            │                                 │                          │
│            ▼                                 │                          │
│  ┌─────────────────────┐                     │                          │
│  │     COMPLETED       │                     │                          │
│  └─────────────────────┘                     │                          │
│                                                                          │
│  ┌─────────────────────┐                                                │
│  │       FAILED        │ ◄── Error at any stage (with retry logic)      │
│  └─────────────────────┘                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Traffic Light Actions

| Status | Action | Agent Involved | Cost |
|--------|--------|----------------|------|
| 🟢 **GREEN** | Approve → Dispatch to production | Production Engine | $$ |
| 🟡 **YELLOW** | Conversational edit | Gemini 3 Pro | $ |
| 🔴 **RED** | Full re-roll of scene | DeepSeek + Flux | $ |

### YELLOW Flow: Conversational Context

When user selects YELLOW and provides feedback (e.g., "Make it warmer"), Gemini 3 Pro receives:

```typescript
interface YellowContextPayload {
  // Original brand context
  brand_essence_prompt: string;
  style_reference_url: string;
  
  // Current scene state
  current_scene: SceneData;
  
  // Historical context
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  
  // All user uploads (for reference)
  user_assets: Array<{
    url: string;
    type: 'image' | 'video';
    uploaded_at: string;
  }>;
  
  // Previous prompts used
  prompt_history: Array<{
    prompt: string;
    result_url: string;
    feedback: string | null;
  }>;
  
  // Current feedback
  user_feedback: string;
}
```

**Gemini's Task:** Generate an adjusted `cinematography_prompt` that incorporates the feedback while maintaining brand consistency.

---

## 5. Security & Validation (P0 Critical)

### 5.1 Input Validation (Zod Schemas)

All API inputs MUST be validated using Zod schemas before processing.

```typescript
// types/validation.ts

import { z } from 'zod';

// Sanitized string - removes control characters
const sanitizedString = z.string().transform((val) => 
  val.trim().replace(/[\x00-\x1F\x7F]/g, '')
);

// File upload validation
export const FileUploadSchema = z.object({
  filename: sanitizedString.min(1).max(255),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().int().positive().max(10 * 1024 * 1024), // 10MB
  data: z.string(), // base64
});

// Director init validation
export const InitDirectorSchema = z.object({
  jobId: z.string().uuid(),
  forceRemaster: z.boolean().default(false),
  preferredEngine: z.enum(['KLING', 'LUMA', 'GEMINI_PRO']).optional(),
});

// Refine action validation
export const RefineActionSchema = z.object({
  sceneId: z.string().uuid(),
  status: z.enum(['YELLOW', 'RED']),
  feedback: sanitizedString.max(500).optional(),
}).refine(
  (data) => data.status !== 'YELLOW' || (data.feedback && data.feedback.length > 0),
  { message: 'Feedback required for YELLOW status' }
);
```

### 5.2 File Upload Security

**Magic Byte Validation:** All uploads MUST be validated against their declared MIME type.

```typescript
const MAGIC_BYTES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // + WEBP at offset 8
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  
  return signatures.some(sig => 
    sig.every((byte, i) => buffer[i] === byte)
  );
}
```

**Additional Checks:**
- File size limit: 10MB
- Filename sanitization (remove path traversal, null bytes)
- SHA256 hash for deduplication

### 5.3 Rate Limiting

| Endpoint Type | Limit | Window | Identifier |
|---------------|-------|--------|------------|
| Upload | 20 req | 60s | user_id |
| Generate (DeepSeek/Flux) | 10 req | 60s | user_id |
| Refine | 30 req | 60s | user_id |
| Production (Kling/Luma) | 5 req | 60s | user_id |
| General API | 100 req | 60s | user_id or IP |

**Implementation:** Sliding window algorithm with Supabase persistence for distributed rate limiting.

### 5.4 Error Boundaries (React)

All React components MUST be wrapped in error boundaries:

```tsx
// Required error boundary structure
<ErrorBoundary
  fallback={(error, reset) => <ErrorFallback error={error} onReset={reset} />}
  onError={(error) => logToMonitoring(error)}
>
  <DirectorMode />
</ErrorBoundary>
```

### 5.5 Database Security

- All foreign key columns indexed (see schema above)
- Soft deletes (`deleted_at`) - no permanent deletion
- Row Level Security (RLS) policies:

```sql
-- Users can only access their own jobs
ALTER TABLE vision_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs" ON vision_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON vision_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 6. Error Handling & Fallback Strategy

### 6.1 Production Engine Fallbacks

```typescript
const ENGINE_FALLBACK_CHAIN = {
  'KLING': ['LUMA', 'GEMINI_PRO'],
  'LUMA': ['GEMINI_PRO', 'KLING'],
  'GEMINI_PRO': ['LUMA', 'KLING'],
};

async function dispatchToProduction(scene: SceneData, primaryEngine: ProductionEngine) {
  const engines = [primaryEngine, ...ENGINE_FALLBACK_CHAIN[primaryEngine]];
  
  for (const engine of engines) {
    try {
      return await callProductionEngine(engine, scene);
    } catch (error) {
      logError(`${engine} failed`, error);
      
      if (isRetryable(error)) {
        await delay(exponentialBackoff(attempt));
        continue;
      }
      
      // Try next engine in chain
      continue;
    }
  }
  
  throw new Error('All production engines failed');
}
```

### 6.2 Retry Configuration

| Service | Max Retries | Backoff | Timeout |
|---------|-------------|---------|---------|
| Gemini Analysis | 3 | Exponential (2s base) | 60s |
| DeepSeek Script | 3 | Exponential (2s base) | 30s |
| Flux Preview | 3 | Exponential (1s base) | 20s |
| Kling Production | 2 | Fixed (30s) | 300s |
| Luma Production | 2 | Fixed (30s) | 300s |

### 6.3 Error States & Recovery

```typescript
type ErrorState = {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  fallback_available: boolean;
  user_action: 'RETRY' | 'CONTACT_SUPPORT' | 'CHANGE_ENGINE';
};

const ERROR_HANDLERS: Record<string, ErrorState> = {
  'KLING_TIMEOUT': {
    code: 'PRODUCTION_TIMEOUT',
    message: 'Video generation is taking longer than expected',
    retryable: true,
    fallback_available: true,
    user_action: 'RETRY',
  },
  'LUMA_RATE_LIMIT': {
    code: 'EXTERNAL_RATE_LIMIT',
    message: 'Production service is busy. Trying alternate engine.',
    retryable: false,
    fallback_available: true,
    user_action: 'CHANGE_ENGINE',
  },
  'FLUX_GENERATION_FAILED': {
    code: 'PREVIEW_FAILED',
    message: 'Preview generation failed. Please try again.',
    retryable: true,
    fallback_available: false,
    user_action: 'RETRY',
  },
};
```

### 6.4 Circuit Breaker

Prevent cascade failures when external services are down:

```typescript
interface CircuitBreakerConfig {
  failureThreshold: 5;      // Failures before opening
  resetTimeout: 60000;      // ms before trying again
  monitorWindow: 120000;    // ms to track failures
}

// Circuit states: CLOSED (normal) → OPEN (blocked) → HALF_OPEN (testing)
```

---

## 7. Headless TDD Requirements

### Test File: `supabase/functions/tests/director-flow.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient } from './utils/test-client';

describe('Director Flow - Headless Tests', () => {
  
  // =========================================================================
  // TEST 1: Routing Logic
  // =========================================================================
  describe('Production Engine Routing', () => {
    it('should route high-physics content to Kling', async () => {
      const mockAnalysis = {
        physics_score: 0.85,
        vibe_score: 0.3,
        logic_score: 0.2,
      };
      
      const result = await determineProductionEngine(mockAnalysis);
      expect(result.engine).toBe('KLING');
      expect(result.reason).toContain('physics');
    });

    it('should route high-vibe content to Luma', async () => {
      const mockAnalysis = {
        physics_score: 0.2,
        vibe_score: 0.9,
        logic_score: 0.3,
      };
      
      const result = await determineProductionEngine(mockAnalysis);
      expect(result.engine).toBe('LUMA');
    });

    it('should route high-logic content to Gemini Pro', async () => {
      const mockAnalysis = {
        physics_score: 0.3,
        vibe_score: 0.2,
        logic_score: 0.85,
      };
      
      const result = await determineProductionEngine(mockAnalysis);
      expect(result.engine).toBe('GEMINI_PRO');
    });

    it('should prioritize physics when multiple scores are high', async () => {
      const mockAnalysis = {
        physics_score: 0.8,
        vibe_score: 0.8,
        logic_score: 0.8,
      };
      
      const result = await determineProductionEngine(mockAnalysis);
      expect(result.engine).toBe('KLING');
    });
  });

  // =========================================================================
  // TEST 2: Preview Generation
  // =========================================================================
  describe('Flux Preview Generation', () => {
    it('should generate valid preview URLs', async () => {
      const mockScript = {
        cinematography_prompt: 'Product hero shot, slow orbit, soft lighting',
        style_reference_url: 'https://storage.example.com/style_ref.jpg',
      };
      
      const result = await generateFluxPreview(mockScript);
      
      expect(result.preview_image_url).toMatch(/^https:\/\//);
      expect(result.preview_seed).toBeTypeOf('number');
    });

    it('should handle Flux API failure with retry', async () => {
      // Mock first two calls to fail
      mockFluxApi.failNextCalls(2);
      
      const result = await generateFluxPreview(mockScript);
      
      expect(result.preview_image_url).toBeTruthy();
      expect(mockFluxApi.callCount).toBe(3);
    });
  });

  // =========================================================================
  // TEST 3: Integrity Filter (Safety)
  // =========================================================================
  describe('Integrity Filter', () => {
    it('should flag low-integrity inputs', async () => {
      const mockAnalysis = {
        integrity_score: 0.35,  // Below 0.4 threshold
      };
      
      const result = await processAnalysis(mockAnalysis);
      
      expect(result.status).toBe('flagged');
      expect(result.flagged_reason).toContain('integrity');
    });

    it('should allow high-integrity inputs', async () => {
      const mockAnalysis = {
        integrity_score: 0.85,
      };
      
      const result = await processAnalysis(mockAnalysis);
      
      expect(result.status).not.toBe('flagged');
    });
  });

  // =========================================================================
  // TEST 4: Style Reference Generation
  // =========================================================================
  describe('Style Reference Pipeline', () => {
    it('should generate style reference from original image', async () => {
      const mockJob = {
        image_url: 'https://storage.example.com/original.jpg',
        brand_essence_prompt: 'Premium health product, clean aesthetic',
      };
      
      const result = await generateStyleReference(mockJob);
      
      expect(result.style_reference_url).toBeTruthy();
      expect(result.style_reference_url).not.toBe(mockJob.image_url);
      expect(result.processing.method).toBe('flux-dev-img2img');
      expect(result.processing.strength).toBeGreaterThanOrEqual(0.3);
      expect(result.processing.strength).toBeLessThanOrEqual(0.5);
    });
  });

  // =========================================================================
  // TEST 5: YELLOW Flow Context
  // =========================================================================
  describe('YELLOW Conversational Edit', () => {
    it('should maintain context across edits', async () => {
      const initialScene = await createTestScene();
      
      // First YELLOW edit
      const edit1 = await processYellowFeedback(initialScene.id, 'Make it warmer');
      expect(edit1.conversation_history).toHaveLength(2); // user + assistant
      
      // Second YELLOW edit
      const edit2 = await processYellowFeedback(initialScene.id, 'Add more motion');
      expect(edit2.conversation_history).toHaveLength(4);
      
      // Verify context is preserved
      expect(edit2.conversation_history[0].content).toContain('warmer');
    });
  });

  // =========================================================================
  // TEST 6: Error Handling & Fallbacks
  // =========================================================================
  describe('Production Engine Fallbacks', () => {
    it('should fallback to Luma when Kling fails', async () => {
      mockKlingApi.simulateFailure();
      
      const result = await dispatchToProduction(mockScene, 'KLING');
      
      expect(result.engine_used).toBe('LUMA');
      expect(result.fallback_triggered).toBe(true);
    });

    it('should open circuit breaker after repeated failures', async () => {
      mockKlingApi.simulateFailure();
      
      // Trigger 5 failures
      for (let i = 0; i < 5; i++) {
        await dispatchToProduction(mockScene, 'KLING').catch(() => {});
      }
      
      // Circuit should be open
      const circuitState = getCircuitState('KLING');
      expect(circuitState).toBe('OPEN');
    });
  });

  // =========================================================================
  // TEST 7: Rate Limiting
  // =========================================================================
  describe('Rate Limiting', () => {
    it('should block requests exceeding limit', async () => {
      const userId = 'test-user-123';
      
      // Send 11 requests (limit is 10)
      for (let i = 0; i < 10; i++) {
        await makeGenerateRequest(userId);
      }
      
      // 11th request should fail
      await expect(makeGenerateRequest(userId)).rejects.toThrow('TOO_MANY_REQUESTS');
    });
  });

  // =========================================================================
  // TEST 8: Input Validation
  // =========================================================================
  describe('Input Validation', () => {
    it('should reject invalid file types', async () => {
      const invalidUpload = {
        filename: 'test.exe',
        mimeType: 'application/x-executable',
        data: 'base64data',
      };
      
      await expect(uploadFile(invalidUpload)).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should sanitize filenames', async () => {
      const maliciousUpload = {
        filename: '../../../etc/passwd.jpg',
        mimeType: 'image/jpeg',
        data: validJpegBase64,
      };
      
      const result = await uploadFile(maliciousUpload);
      expect(result.stored_filename).not.toContain('..');
    });
  });
});
```

---

## 8. API Endpoints (tRPC)

### Router Structure

```typescript
// server/routers/index.ts
export const appRouter = router({
  health: healthRouter,
  vision: visionRouter,      // Phase 3B
  director: directorRouter,  // Phase 3C
});

// Key endpoints:
// vision.uploadImage
// vision.getJob
// vision.listJobs
// director.initDirector
// director.refineStoryboard
// director.approveScene
// director.approveProduction
// director.getState
```

---

## 9. Environment Variables

```bash
# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI Services
GEMINI_API_KEY=xxx
DEEPSEEK_API_KEY=xxx
FAL_API_KEY=xxx

# Production Engines
KLING_API_KEY=xxx
LUMA_API_KEY=xxx

# Rate Limiting
RATE_LIMIT_ENABLED=true

# Feature Flags
ENABLE_IMAGEN3=false  # Set true when Vertex AI access acquired
```

---

## 10. Migration Checklist

- [ ] Create Supabase project
- [ ] Run schema migrations
- [ ] Configure RLS policies
- [ ] Set up Supabase Storage buckets
- [ ] Configure Fal.ai API access
- [ ] Run headless tests (`director-flow.ts`)
- [ ] Deploy Edge Functions
- [ ] Build React UI

---

**Document Status:** Ready for Implementation  
**Next Step:** Run `director-flow.ts` tests headlessly before any UI work
