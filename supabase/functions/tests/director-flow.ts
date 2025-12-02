/**
 * Longevity Valley - Director Flow Headless Tests
 * 
 * These tests MUST pass before any React UI is built.
 * Run with: deno test --allow-env --allow-net director-flow.ts
 * Or with: npx vitest run director-flow.ts
 * 
 * @module tests/director-flow
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// =============================================================================
// TYPES (Import from actual types in production)
// =============================================================================

type ProductionEngine = 'KLING' | 'LUMA' | 'GEMINI_PRO';
type TrafficLight = 'PENDING' | 'GREEN' | 'YELLOW' | 'RED';
type VisionJobStatus = 'pending' | 'analyzing' | 'completed' | 'flagged' | 'failed';

interface AnalysisScores {
  physics_score: number;
  vibe_score: number;
  logic_score: number;
  integrity_score?: number;
}

interface RoutingDecision {
  engine: ProductionEngine;
  reason: string;
}

interface SceneData {
  id: string;
  sequence_index: number;
  cinematography_prompt: string;
  camera_movement: string;
  lighting_notes: string;
  invariant_token: string;
  preview_image_url: string | null;
  preview_seed: number | null;
  traffic_light: TrafficLight;
  user_feedback: string | null;
  final_video_url: string | null;
  attempt_count: number;
}

interface StyleReference {
  original_url: string;
  style_reference_url: string;
  brand_essence_prompt: string;
  processing: {
    method: string;
    strength: number;
    seed: number;
  };
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// =============================================================================
// MOCK IMPLEMENTATIONS (Replace with actual implementations)
// =============================================================================

/**
 * Determine production engine based on scores
 * Priority: Physics > Vibe > Logic
 */
function determineProductionEngine(scores: AnalysisScores): RoutingDecision {
  const { physics_score, vibe_score, logic_score } = scores;
  
  // Priority: Physics > Vibe > Logic
  if (physics_score >= 0.7) {
    return {
      engine: 'KLING',
      reason: `High physics score (${physics_score.toFixed(2)}) - routing to Kling for liquid/dynamics`,
    };
  }
  
  if (vibe_score >= 0.7) {
    return {
      engine: 'LUMA',
      reason: `High vibe score (${vibe_score.toFixed(2)}) - routing to Luma for aesthetic motion`,
    };
  }
  
  if (logic_score >= 0.7) {
    return {
      engine: 'GEMINI_PRO',
      reason: `High logic score (${logic_score.toFixed(2)}) - routing to Gemini Pro for text/logic`,
    };
  }
  
  // Default to LUMA for balanced content
  return {
    engine: 'LUMA',
    reason: 'Balanced scores - defaulting to Luma for general aesthetic motion',
  };
}

/**
 * Check if job should be flagged for low integrity
 */
function shouldFlagJob(integrity_score: number | undefined): boolean {
  return integrity_score !== undefined && integrity_score < 0.4;
}

/**
 * Process analysis and determine job status
 */
function processAnalysis(analysis: AnalysisScores): { status: VisionJobStatus; flagged_reason?: string } {
  if (shouldFlagJob(analysis.integrity_score)) {
    return {
      status: 'flagged',
      flagged_reason: `Low integrity score: ${analysis.integrity_score?.toFixed(2)}`,
    };
  }
  return { status: 'completed' };
}

/**
 * Mock Flux API for preview generation
 */
class MockFluxApi {
  private failureCount = 0;
  private failNextCount = 0;
  public callCount = 0;

  simulateFailure() {
    this.failNextCount = 999; // Fail all calls
  }

  failNextCalls(count: number) {
    this.failNextCount = count;
  }

  reset() {
    this.failureCount = 0;
    this.failNextCount = 0;
    this.callCount = 0;
  }

  async generate(prompt: string): Promise<{ url: string; seed: number }> {
    this.callCount++;
    
    if (this.failNextCount > 0) {
      this.failNextCount--;
      this.failureCount++;
      throw new Error('Flux API failure (simulated)');
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      url: `https://storage.example.com/previews/${Date.now()}.jpg`,
      seed: Math.floor(Math.random() * 1000000),
    };
  }
}

const mockFluxApi = new MockFluxApi();

/**
 * Generate Flux preview with retry logic
 */
async function generateFluxPreview(
  script: { cinematography_prompt: string; style_reference_url: string },
  maxRetries = 3
): Promise<{ preview_image_url: string; preview_seed: number }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await mockFluxApi.generate(script.cinematography_prompt);
      return {
        preview_image_url: result.url,
        preview_seed: result.seed,
      };
    } catch (error) {
      lastError = error as Error;
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Generate style reference from original image
 */
async function generateStyleReference(job: {
  image_url: string;
  brand_essence_prompt: string;
}): Promise<StyleReference> {
  // Simulate Flux-Dev img2img processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const strength = 0.35; // Optimal range: 0.3-0.5
  const seed = Math.floor(Math.random() * 1000000);
  
  return {
    original_url: job.image_url,
    style_reference_url: `https://storage.example.com/style-refs/${Date.now()}.jpg`,
    brand_essence_prompt: job.brand_essence_prompt,
    processing: {
      method: 'flux-dev-img2img',
      strength,
      seed,
    },
  };
}

/**
 * Mock scene for testing
 */
function createMockScene(overrides: Partial<SceneData> = {}): SceneData {
  return {
    id: `scene-${Date.now()}`,
    sequence_index: 1,
    cinematography_prompt: 'Product hero shot, slow orbit, soft lighting',
    camera_movement: 'slow orbit',
    lighting_notes: 'soft diffused lighting',
    invariant_token: 'premium health product bottle',
    preview_image_url: null,
    preview_seed: null,
    traffic_light: 'PENDING',
    user_feedback: null,
    final_video_url: null,
    attempt_count: 0,
    ...overrides,
  };
}

/**
 * Conversation history storage (in-memory for tests)
 */
const conversationStore = new Map<string, ConversationMessage[]>();

/**
 * Process YELLOW feedback with context preservation
 */
async function processYellowFeedback(
  sceneId: string,
  feedback: string
): Promise<{ conversation_history: ConversationMessage[] }> {
  const history = conversationStore.get(sceneId) || [];
  
  // Add user message
  history.push({
    role: 'user',
    content: feedback,
    timestamp: new Date().toISOString(),
  });
  
  // Simulate Gemini processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Add assistant response
  history.push({
    role: 'assistant',
    content: `Adjusted prompt incorporating: "${feedback}"`,
    timestamp: new Date().toISOString(),
  });
  
  conversationStore.set(sceneId, history);
  
  return { conversation_history: history };
}

/**
 * Mock production engines
 */
class MockProductionEngine {
  private shouldFail = false;
  
  simulateFailure() {
    this.shouldFail = true;
  }
  
  reset() {
    this.shouldFail = false;
  }
  
  async render(scene: SceneData): Promise<{ video_url: string }> {
    if (this.shouldFail) {
      throw new Error('Production engine failure (simulated)');
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    return { video_url: `https://storage.example.com/videos/${Date.now()}.mp4` };
  }
}

const mockKlingApi = new MockProductionEngine();
const mockLumaApi = new MockProductionEngine();
const mockGeminiProApi = new MockProductionEngine();

/**
 * Engine fallback chain
 */
const ENGINE_FALLBACK_CHAIN: Record<ProductionEngine, ProductionEngine[]> = {
  'KLING': ['LUMA', 'GEMINI_PRO'],
  'LUMA': ['GEMINI_PRO', 'KLING'],
  'GEMINI_PRO': ['LUMA', 'KLING'],
};

/**
 * Get engine instance by name
 */
function getEngineInstance(engine: ProductionEngine): MockProductionEngine {
  switch (engine) {
    case 'KLING': return mockKlingApi;
    case 'LUMA': return mockLumaApi;
    case 'GEMINI_PRO': return mockGeminiProApi;
  }
}

/**
 * Circuit breaker state
 */
const circuitBreakers = new Map<ProductionEngine, {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailure: number;
}>();

function getCircuitState(engine: ProductionEngine): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
  return circuitBreakers.get(engine)?.state || 'CLOSED';
}

function recordFailure(engine: ProductionEngine) {
  const breaker = circuitBreakers.get(engine) || { state: 'CLOSED', failures: 0, lastFailure: 0 };
  breaker.failures++;
  breaker.lastFailure = Date.now();
  
  if (breaker.failures >= 5) {
    breaker.state = 'OPEN';
  }
  
  circuitBreakers.set(engine, breaker);
}

/**
 * Dispatch to production with fallback
 */
async function dispatchToProduction(
  scene: SceneData,
  primaryEngine: ProductionEngine
): Promise<{ video_url: string; engine_used: ProductionEngine; fallback_triggered: boolean }> {
  const engines = [primaryEngine, ...ENGINE_FALLBACK_CHAIN[primaryEngine]];
  
  for (let i = 0; i < engines.length; i++) {
    const engine = engines[i];
    const engineInstance = getEngineInstance(engine);
    
    try {
      const result = await engineInstance.render(scene);
      return {
        video_url: result.video_url,
        engine_used: engine,
        fallback_triggered: i > 0,
      };
    } catch (error) {
      recordFailure(engine);
      console.log(`${engine} failed, trying fallback...`);
    }
  }
  
  throw new Error('All production engines failed');
}

/**
 * Rate limiting
 */
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMITS = {
  generate: { limit: 10, windowMs: 60000 },
};

async function makeGenerateRequest(userId: string): Promise<void> {
  const key = `${userId}:generate`;
  const now = Date.now();
  const config = RATE_LIMITS.generate;
  
  let bucket = rateLimitStore.get(key);
  
  if (!bucket || now - bucket.windowStart > config.windowMs) {
    bucket = { count: 0, windowStart: now };
  }
  
  bucket.count++;
  rateLimitStore.set(key, bucket);
  
  if (bucket.count > config.limit) {
    throw new Error('TOO_MANY_REQUESTS');
  }
}

/**
 * File validation
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function uploadFile(file: {
  filename: string;
  mimeType: string;
  data: string;
}): Promise<{ stored_filename: string }> {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
    throw new Error('VALIDATION_ERROR: Invalid file type');
  }
  
  // Sanitize filename
  let sanitized = file.filename
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[/\\]/g, '') // Remove slashes
    .replace(/\x00/g, ''); // Remove null bytes
  
  // Default if empty
  if (!sanitized || sanitized === '.') {
    sanitized = `upload_${Date.now()}.jpg`;
  }
  
  return { stored_filename: sanitized };
}

// Valid JPEG base64 (1x1 pixel)
const validJpegBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQA/AL+AAf/Z';

// =============================================================================
// TESTS
// =============================================================================

describe('Director Flow - Headless Tests', () => {
  
  beforeEach(() => {
    // Reset all mocks
    mockFluxApi.reset();
    mockKlingApi.reset();
    mockLumaApi.reset();
    mockGeminiProApi.reset();
    conversationStore.clear();
    circuitBreakers.clear();
    rateLimitStore.clear();
  });

  // =========================================================================
  // TEST 1: Routing Logic
  // =========================================================================
  describe('Production Engine Routing', () => {
    
    it('should route high-physics content to Kling', () => {
      const mockAnalysis: AnalysisScores = {
        physics_score: 0.85,
        vibe_score: 0.3,
        logic_score: 0.2,
      };
      
      const result = determineProductionEngine(mockAnalysis);
      
      expect(result.engine).toBe('KLING');
      expect(result.reason).toContain('physics');
    });

    it('should route high-vibe content to Luma', () => {
      const mockAnalysis: AnalysisScores = {
        physics_score: 0.2,
        vibe_score: 0.9,
        logic_score: 0.3,
      };
      
      const result = determineProductionEngine(mockAnalysis);
      
      expect(result.engine).toBe('LUMA');
      expect(result.reason).toContain('vibe');
    });

    it('should route high-logic content to Gemini Pro', () => {
      const mockAnalysis: AnalysisScores = {
        physics_score: 0.3,
        vibe_score: 0.2,
        logic_score: 0.85,
      };
      
      const result = determineProductionEngine(mockAnalysis);
      
      expect(result.engine).toBe('GEMINI_PRO');
      expect(result.reason).toContain('logic');
    });

    it('should prioritize physics when multiple scores are high', () => {
      const mockAnalysis: AnalysisScores = {
        physics_score: 0.8,
        vibe_score: 0.8,
        logic_score: 0.8,
      };
      
      const result = determineProductionEngine(mockAnalysis);
      
      expect(result.engine).toBe('KLING');
    });

    it('should default to Luma when all scores are low', () => {
      const mockAnalysis: AnalysisScores = {
        physics_score: 0.4,
        vibe_score: 0.5,
        logic_score: 0.3,
      };
      
      const result = determineProductionEngine(mockAnalysis);
      
      expect(result.engine).toBe('LUMA');
      expect(result.reason).toContain('default');
    });

    it('should handle Sports Drink brand (high physics)', () => {
      // Sports drink = splashing liquid = high physics
      const sportsDrinkAnalysis: AnalysisScores = {
        physics_score: 0.92,
        vibe_score: 0.45,
        logic_score: 0.2,
      };
      
      const result = determineProductionEngine(sportsDrinkAnalysis);
      
      expect(result.engine).toBe('KLING');
    });

    it('should handle Fashion brand (high vibe)', () => {
      // Fashion = aesthetic, mood = high vibe
      const fashionAnalysis: AnalysisScores = {
        physics_score: 0.2,
        vibe_score: 0.88,
        logic_score: 0.35,
      };
      
      const result = determineProductionEngine(fashionAnalysis);
      
      expect(result.engine).toBe('LUMA');
    });

    it('should handle Medical brand (high logic)', () => {
      // Medical = text, precision = high logic
      const medicalAnalysis: AnalysisScores = {
        physics_score: 0.15,
        vibe_score: 0.25,
        logic_score: 0.9,
      };
      
      const result = determineProductionEngine(medicalAnalysis);
      
      expect(result.engine).toBe('GEMINI_PRO');
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
      expect(result.preview_seed).toBeGreaterThan(0);
    });

    it('should handle Flux API failure with retry', async () => {
      mockFluxApi.failNextCalls(2);
      
      const mockScript = {
        cinematography_prompt: 'Test prompt',
        style_reference_url: 'https://example.com/ref.jpg',
      };
      
      const result = await generateFluxPreview(mockScript);
      
      expect(result.preview_image_url).toBeTruthy();
      expect(mockFluxApi.callCount).toBe(3); // 2 failures + 1 success
    });

    it('should throw after max retries exceeded', async () => {
      mockFluxApi.simulateFailure();
      
      const mockScript = {
        cinematography_prompt: 'Test prompt',
        style_reference_url: 'https://example.com/ref.jpg',
      };
      
      await expect(generateFluxPreview(mockScript, 3)).rejects.toThrow();
      expect(mockFluxApi.callCount).toBe(3);
    });
  });

  // =========================================================================
  // TEST 3: Integrity Filter (Safety)
  // =========================================================================
  describe('Integrity Filter', () => {
    
    it('should flag low-integrity inputs (< 0.4)', () => {
      const mockAnalysis: AnalysisScores = {
        physics_score: 0.5,
        vibe_score: 0.5,
        logic_score: 0.5,
        integrity_score: 0.35,
      };
      
      const result = processAnalysis(mockAnalysis);
      
      expect(result.status).toBe('flagged');
      expect(result.flagged_reason).toContain('integrity');
    });

    it('should allow high-integrity inputs (>= 0.4)', () => {
      const mockAnalysis: AnalysisScores = {
        physics_score: 0.5,
        vibe_score: 0.5,
        logic_score: 0.5,
        integrity_score: 0.85,
      };
      
      const result = processAnalysis(mockAnalysis);
      
      expect(result.status).not.toBe('flagged');
      expect(result.status).toBe('completed');
    });

    it('should handle edge case at threshold (0.4)', () => {
      const mockAnalysis: AnalysisScores = {
        physics_score: 0.5,
        vibe_score: 0.5,
        logic_score: 0.5,
        integrity_score: 0.4,
      };
      
      const result = processAnalysis(mockAnalysis);
      
      // 0.4 is exactly at threshold, should NOT be flagged
      expect(result.status).toBe('completed');
    });

    it('should handle missing integrity score', () => {
      const mockAnalysis: AnalysisScores = {
        physics_score: 0.5,
        vibe_score: 0.5,
        logic_score: 0.5,
        // integrity_score is undefined
      };
      
      const result = processAnalysis(mockAnalysis);
      
      expect(result.status).toBe('completed');
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

    it('should preserve brand essence prompt', async () => {
      const mockJob = {
        image_url: 'https://storage.example.com/original.jpg',
        brand_essence_prompt: 'Luxury skincare, gold accents, spa atmosphere',
      };
      
      const result = await generateStyleReference(mockJob);
      
      expect(result.brand_essence_prompt).toBe(mockJob.brand_essence_prompt);
    });

    it('should generate reproducible seed', async () => {
      const mockJob = {
        image_url: 'https://storage.example.com/original.jpg',
        brand_essence_prompt: 'Test prompt',
      };
      
      const result = await generateStyleReference(mockJob);
      
      expect(result.processing.seed).toBeTypeOf('number');
      expect(result.processing.seed).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // TEST 5: YELLOW Flow Context
  // =========================================================================
  describe('YELLOW Conversational Edit', () => {
    
    it('should maintain context across edits', async () => {
      const sceneId = 'test-scene-001';
      
      // First YELLOW edit
      const edit1 = await processYellowFeedback(sceneId, 'Make it warmer');
      expect(edit1.conversation_history).toHaveLength(2); // user + assistant
      expect(edit1.conversation_history[0].role).toBe('user');
      expect(edit1.conversation_history[1].role).toBe('assistant');
      
      // Second YELLOW edit
      const edit2 = await processYellowFeedback(sceneId, 'Add more motion');
      expect(edit2.conversation_history).toHaveLength(4);
      
      // Verify context is preserved
      expect(edit2.conversation_history[0].content).toContain('warmer');
      expect(edit2.conversation_history[2].content).toContain('motion');
    });

    it('should store timestamps for each message', async () => {
      const sceneId = 'test-scene-002';
      
      const result = await processYellowFeedback(sceneId, 'Test feedback');
      
      expect(result.conversation_history[0].timestamp).toBeTruthy();
      expect(new Date(result.conversation_history[0].timestamp)).toBeInstanceOf(Date);
    });

    it('should handle multiple scenes independently', async () => {
      const scene1 = 'scene-a';
      const scene2 = 'scene-b';
      
      await processYellowFeedback(scene1, 'Feedback for scene A');
      await processYellowFeedback(scene2, 'Feedback for scene B');
      
      const result1 = await processYellowFeedback(scene1, 'More feedback A');
      const result2 = await processYellowFeedback(scene2, 'More feedback B');
      
      // Each scene should have its own history
      expect(result1.conversation_history).toHaveLength(4);
      expect(result2.conversation_history).toHaveLength(4);
      
      // Histories should be independent
      expect(result1.conversation_history[0].content).toContain('scene A');
      expect(result2.conversation_history[0].content).toContain('scene B');
    });
  });

  // =========================================================================
  // TEST 6: Error Handling & Fallbacks
  // =========================================================================
  describe('Production Engine Fallbacks', () => {
    
    it('should fallback to Luma when Kling fails', async () => {
      mockKlingApi.simulateFailure();
      
      const mockScene = createMockScene();
      const result = await dispatchToProduction(mockScene, 'KLING');
      
      expect(result.engine_used).toBe('LUMA');
      expect(result.fallback_triggered).toBe(true);
    });

    it('should fallback to Gemini Pro when Luma fails', async () => {
      mockLumaApi.simulateFailure();
      
      const mockScene = createMockScene();
      const result = await dispatchToProduction(mockScene, 'LUMA');
      
      expect(result.engine_used).toBe('GEMINI_PRO');
      expect(result.fallback_triggered).toBe(true);
    });

    it('should try full fallback chain', async () => {
      mockKlingApi.simulateFailure();
      mockLumaApi.simulateFailure();
      
      const mockScene = createMockScene();
      const result = await dispatchToProduction(mockScene, 'KLING');
      
      expect(result.engine_used).toBe('GEMINI_PRO');
      expect(result.fallback_triggered).toBe(true);
    });

    it('should throw when all engines fail', async () => {
      mockKlingApi.simulateFailure();
      mockLumaApi.simulateFailure();
      mockGeminiProApi.simulateFailure();
      
      const mockScene = createMockScene();
      
      await expect(dispatchToProduction(mockScene, 'KLING'))
        .rejects.toThrow('All production engines failed');
    });

    it('should open circuit breaker after repeated failures', async () => {
      mockKlingApi.simulateFailure();
      
      const mockScene = createMockScene();
      
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
    
    it('should allow requests within limit', async () => {
      const userId = 'test-user-123';
      
      // Send 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        await expect(makeGenerateRequest(userId)).resolves.toBeUndefined();
      }
    });

    it('should block requests exceeding limit', async () => {
      const userId = 'test-user-456';
      
      // Send 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        await makeGenerateRequest(userId);
      }
      
      // 11th request should fail
      await expect(makeGenerateRequest(userId)).rejects.toThrow('TOO_MANY_REQUESTS');
    });

    it('should track different users independently', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      
      // User 1 exhausts limit
      for (let i = 0; i < 10; i++) {
        await makeGenerateRequest(user1);
      }
      
      // User 2 should still be able to make requests
      await expect(makeGenerateRequest(user2)).resolves.toBeUndefined();
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

    it('should accept valid image types', async () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      
      for (const mimeType of validTypes) {
        const upload = {
          filename: `test.${mimeType.split('/')[1]}`,
          mimeType,
          data: validJpegBase64,
        };
        
        await expect(uploadFile(upload)).resolves.toBeTruthy();
      }
    });

    it('should sanitize filenames with path traversal', async () => {
      const maliciousUpload = {
        filename: '../../../etc/passwd.jpg',
        mimeType: 'image/jpeg',
        data: validJpegBase64,
      };
      
      const result = await uploadFile(maliciousUpload);
      expect(result.stored_filename).not.toContain('..');
      expect(result.stored_filename).not.toContain('/');
    });

    it('should sanitize filenames with null bytes', async () => {
      const maliciousUpload = {
        filename: 'test\x00.jpg',
        mimeType: 'image/jpeg',
        data: validJpegBase64,
      };
      
      const result = await uploadFile(maliciousUpload);
      expect(result.stored_filename).not.toContain('\x00');
    });

    it('should handle empty filenames', async () => {
      const emptyUpload = {
        filename: '',
        mimeType: 'image/jpeg',
        data: validJpegBase64,
      };
      
      const result = await uploadFile(emptyUpload);
      expect(result.stored_filename).toBeTruthy();
      expect(result.stored_filename.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // TEST 9: Scene Data Structure
  // =========================================================================
  describe('Scene Data Structure', () => {
    
    it('should create valid scene with all required fields', () => {
      const scene = createMockScene();
      
      expect(scene.id).toBeTruthy();
      expect(scene.sequence_index).toBe(1);
      expect(scene.cinematography_prompt).toBeTruthy();
      expect(scene.traffic_light).toBe('PENDING');
      expect(scene.attempt_count).toBe(0);
    });

    it('should allow overriding scene properties', () => {
      const scene = createMockScene({
        sequence_index: 3,
        traffic_light: 'GREEN',
        user_feedback: 'Looks great!',
      });
      
      expect(scene.sequence_index).toBe(3);
      expect(scene.traffic_light).toBe('GREEN');
      expect(scene.user_feedback).toBe('Looks great!');
    });
  });

  // =========================================================================
  // TEST 10: End-to-End Flow
  // =========================================================================
  describe('End-to-End Director Flow', () => {
    
    it('should complete full flow: Upload → Analysis → Routing → Preview → Production', async () => {
      // Step 1: Upload (simulated)
      const uploadResult = await uploadFile({
        filename: 'product.jpg',
        mimeType: 'image/jpeg',
        data: validJpegBase64,
      });
      expect(uploadResult.stored_filename).toBeTruthy();
      
      // Step 2: Analysis scores (simulated from Gemini)
      const analysisScores: AnalysisScores = {
        physics_score: 0.85,
        vibe_score: 0.4,
        logic_score: 0.3,
        integrity_score: 0.9,
      };
      
      // Step 3: Check integrity
      const analysisResult = processAnalysis(analysisScores);
      expect(analysisResult.status).toBe('completed');
      
      // Step 4: Generate style reference
      const styleRef = await generateStyleReference({
        image_url: 'https://example.com/upload.jpg',
        brand_essence_prompt: 'Premium sports drink, dynamic energy',
      });
      expect(styleRef.style_reference_url).toBeTruthy();
      
      // Step 5: Determine routing
      const routing = determineProductionEngine(analysisScores);
      expect(routing.engine).toBe('KLING'); // High physics
      
      // Step 6: Generate preview
      const preview = await generateFluxPreview({
        cinematography_prompt: 'Liquid splash in slow motion',
        style_reference_url: styleRef.style_reference_url,
      });
      expect(preview.preview_image_url).toBeTruthy();
      
      // Step 7: Dispatch to production
      const scene = createMockScene({
        preview_image_url: preview.preview_image_url,
        traffic_light: 'GREEN',
      });
      const production = await dispatchToProduction(scene, routing.engine);
      expect(production.video_url).toBeTruthy();
      expect(production.engine_used).toBe('KLING');
    });
  });
});

// =============================================================================
// EXPORT FOR MANUS AI
// =============================================================================

export {
  determineProductionEngine,
  shouldFlagJob,
  processAnalysis,
  generateFluxPreview,
  generateStyleReference,
  processYellowFeedback,
  dispatchToProduction,
  makeGenerateRequest,
  uploadFile,
  createMockScene,
  getCircuitState,
};
