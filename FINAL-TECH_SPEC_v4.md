# FINAL-TECH_SPEC.md: Longevity Valley Architecture (v4.0)

**Document Type:** Technical Architecture Specification
**Audience:** CTO & Lead Engineer
**Purpose:** Amended Phase 4 system design with resolved gaps, bottlenecks, and edge cases
**Stack:** Next.js 15 + Supabase (Postgres) + tRPC v11
**Last Updated:** December 8, 2025

---

## 0. Document Control

| Version | Date | Scope | Status |
|---------|------|-------|--------|
| 1.0 | Nov 30, 2025 | Initial architecture | Approved |
| 2.0 | Dec 2, 2025 | Security + Style Reference Pipeline | Approved |
| 3.0 | Dec 8, 2025 | Phase 4: Rashomon Learning System | Approved |
| **4.0** | **Dec 8, 2025** | **Gap Resolution + Bottlenecks + Edge Cases** | **Review Required** |

---

### v4.0 Amendments Summary

| Gap | Resolution | Section |
|-----|------------|---------|
| Gap 1B | 4 Directors (Provocateur formalized) | 2.2 |
| Gap 2C | Dynamic Engine Selection | 2.3 |
| Gap 3 | Minimal A/B Framework | 5.4 |
| Gap 4A | Blocking Consent Modal | 5.5 |
| Gap 5 | Metrics Instrumentation (before Phase 4C) | 5.6 |

| UX Decision | Resolution | Section |
|-------------|------------|---------|
| Q1: Perceived Performance | Step indicator (1/3, 2/3, 3/3) | 4.1 |
| Q2: Flow Integration | Prompt with CTA | 4.2 |
| Q3a: Mobile Layout | Vertical scroll | 4.3 |
| Q3b: Mobile Details | Summary → Expand | 4.3 |
| Q4a: Cache Duration | 24 hours + content hash | 4.4 |
| Q4b: Skip Re-upload | Client-side hash check | 4.4 |
| Q5a: Partial Failure | Graceful degradation + retry per card | 4.5 |
| Q5b: Failed Upload | Auto-retry 3x + manual | 4.5 |

| Bottleneck | Resolution | Section |
|------------|------------|---------|
| B1: 8-12s DeepSeek wait | Progressive Reveal + Pre-warm | 3.1 |
| B2: Profile update latency | Bounded Size + Async Update | 3.2 |
| B3: 10 req/s rate limit | Request Queue + Rate Limiter | 3.3 |
| B4: Legal consent | Blocking Consent Modal | 5.5 |

---

## 1. System Architecture Overview

### Phase 4 Architecture (Final)

```
                                    ┌─────────────────────────────────┐
                                    │         CONSENT GATE            │
                                    │    (Blocking Modal on first     │
                                    │     /lounge visit)              │
                                    └───────────────┬─────────────────┘
                                                    │
                                                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐
│              │    │              │    │                              │
│  User Upload │───▶│   The Eye    │───▶│    Director Selection        │
│  (Signed URL)│    │   (Gemini)   │    │    (4 Directors + A/B)       │
│              │    │              │    │                              │
└──────────────┘    └──────────────┘    └──────────────┬───────────────┘
       │                   │                           │
       ▼                   ▼                           ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐
│ Client Hash  │    │  Objective   │    │     Learning Event           │
│ + Cache Check│    │   Scores     │    │  (if consent = true)         │
└──────────────┘    │ (Truth)      │    └──────────────┬───────────────┘
                    └──────────────┘                   │
                                                       ▼
                                        ┌──────────────────────────────┐
                                        │   Creative Profile Update    │
                                        │      (Async, Bounded)        │
                                        └──────────────────────────────┘
                                                       │
                                                       ▼
                                        ┌──────────────────────────────┐
                                        │      Metrics Capture         │
                                        │   (All success metrics)      │
                                        └──────────────────────────────┘
```

---

## 2. Core Design Decisions

### 2.1 Gemini 2.5 Flash as "The Eye" (Unchanged)

**Status:** Approved in v3

- Provides ground truth Trinity scores (physics, vibe, logic)
- No bias applied at this stage
- Fallback chain: 2.5 Flash → 1.5 Pro → Heuristic

---

### 2.2 Director System: 4 Directors (AMENDED)

**Change from v3:** Added Provocateur as fourth director.

**Rationale:**
- Already implemented in codebase
- Adds creative "chaos" option for experimental users
- Richer Rashomon pattern with 4 perspectives

| Director | Persona | Bias Vector | Risk Level | Dominant |
|----------|---------|-------------|------------|----------|
| **Physicist** | Precision engineer | `{ physics: +0.2, vibe: -0.1, logic: 0 }` | Safe | Physics |
| **Aesthete** | Visual dreamer | `{ physics: -0.1, vibe: +0.2, logic: 0 }` | Balanced | Vibe |
| **Strategist** | Logic architect | `{ physics: 0, vibe: -0.1, logic: +0.2 }` | Safe | Logic |
| **Provocateur** | Chaos agent | `{ physics: +0.1, vibe: +0.1, logic: -0.2 }` | Experimental | Chaos |

**Bias Application:**

```typescript
interface Scores {
  physics: number;  // 0.0 - 1.0
  vibe: number;
  logic: number;
}

interface BiasVector {
  physics: number;  // -0.3 to +0.3
  vibe: number;
  logic: number;
}

const DIRECTOR_BIASES: Record<DirectorId, BiasVector> = {
  physicist:   { physics: +0.2, vibe: -0.1, logic:  0.0 },
  aesthete:    { physics: -0.1, vibe: +0.2, logic:  0.0 },
  strategist:  { physics:  0.0, vibe: -0.1, logic: +0.2 },
  provocateur: { physics: +0.1, vibe: +0.1, logic: -0.2 },
};

function applyBias(raw: Scores, directorId: DirectorId): Scores {
  const bias = DIRECTOR_BIASES[directorId];
  return {
    physics: clamp(raw.physics + bias.physics, 0, 1),
    vibe:    clamp(raw.vibe + bias.vibe, 0, 1),
    logic:   clamp(raw.logic + bias.logic, 0, 1),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
```

**Cost Impact:** +33% DeepSeek API cost (4 calls vs 3)

---

### 2.3 Dynamic Engine Selection (AMENDED)

**Change from v3:** Engine determined by score dominance, not director identity.

**Rationale:**
- Removes Gemini Pro Video dependency (not production-ready)
- Simplifies to 2 engines: Kling + Luma
- Engine choice reflects content characteristics

```typescript
type Engine = 'kling' | 'luma';

function selectEngine(biasedScores: Scores): Engine {
  const dominant = getDominantDimension(biasedScores);

  switch (dominant) {
    case 'physics':
      // Motion/dynamics excellence
      return 'kling';
    case 'vibe':
      // Aesthetic/dreamy excellence
      return 'luma';
    case 'logic':
      // Clean/structured execution
      return 'kling';
    default:
      // Tie-breaker: favor aesthetic engine
      return biasedScores.vibe > biasedScores.physics ? 'luma' : 'kling';
  }
}

function getDominantDimension(scores: Scores): keyof Scores {
  const entries = Object.entries(scores) as [keyof Scores, number][];
  return entries.reduce((a, b) => b[1] > a[1] ? b : a)[0];
}
```

| Engine | Strength | Best For |
|--------|----------|----------|
| **Kling AI** | Physics simulation, motion | Action, product demos, precision |
| **Luma** | Aesthetic rendering, mood | Brand films, lifestyle, dreamy |

**Cost Impact:** Zero (removed Gemini Pro Video)

---

### 2.4 Learning Events Schema (Updated)

```sql
CREATE TABLE learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES vision_jobs(id) ON DELETE CASCADE,

  -- Ground truth from The Eye
  raw_scores JSONB NOT NULL,
  -- { physics: 0.65, vibe: 0.45, logic: 0.40 }

  -- All 4 pitches shown to user
  director_pitches JSONB NOT NULL,
  -- [{ directorId, biasedScores, engine, riskLevel }, ...]

  -- User's choice
  selected_director_id VARCHAR(50) NOT NULL,

  -- The learning signal
  learning_delta JSONB NOT NULL,
  -- { objectiveWinner, subjectiveChoice, wasOverride }

  -- A/B test tracking (NEW)
  experiment_variant VARCHAR(100),
  -- { "director_card_layout": "all_cards" }

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_learning_events_user_id ON learning_events(user_id);
CREATE INDEX idx_learning_events_director ON learning_events(selected_director_id);
CREATE INDEX idx_learning_events_variant ON learning_events(experiment_variant);
CREATE INDEX idx_learning_events_created ON learning_events(created_at);
```

---

### 2.5 Creative Profile (Bounded)

**Constraint:** Maximum JSON size ~300 bytes to ensure <150ms updates.

```typescript
interface UserCreativeProfile {
  // Learned bias vector (bounded: -1.0 to +1.0)
  user_bias_vector: {
    physics: number;
    vibe: number;
    logic: number;
  };

  // Win rate per director (bounded: 0.0 to 1.0)
  director_win_rates: {
    physicist: number;
    aesthete: number;
    strategist: number;
    provocateur: number;
  };

  // Counters (bounded: max 999999)
  total_choices: number;
  override_count: number;

  // Derived (recalculated on update)
  override_rate: number;

  // Metadata
  last_updated: string;  // ISO timestamp
}
```

**Update Rules:**
- ±0.05 bias adjustment per override (conservative learning)
- 5-event threshold before personalization activates
- Async update (non-blocking to user flow)

---

## 3. Bottleneck Resolutions

### 3.1 Progressive Reveal + Pre-warm (B1)

**Problem:** 8-12s total wait for 4 DeepSeek calls
**Target:** First director visible at ~5s

**Solution:** Stream directors as they complete + step indicator

```
Timeline:
0.0s  → User clicks "Analyze"
0.5s  → [Step 1/3: Analyzing your brand asset...]
2.0s  → Gemini returns objective scores
2.5s  → [Step 2/3: Directors are reviewing...]
3.0s  → Fire 4× DeepSeek calls in parallel
5.0s  → First director returns → Display immediately
6.0s  → Second director returns → Display
7.0s  → Third director returns → Display
8.0s  → Fourth director returns → [Step 3/3: Complete!]
```

**Implementation:**

```typescript
// Server: Stream results via Server-Sent Events or Realtime
async function analyze4Directors(rawScores: Scores, jobId: string) {
  const directorIds: DirectorId[] = ['physicist', 'aesthete', 'strategist', 'provocateur'];

  // Fire all in parallel, emit as each completes
  await Promise.all(
    directorIds.map(async (id) => {
      const pitch = await generateDirectorPitch(rawScores, id);

      // Emit to Supabase Realtime channel
      await supabase
        .from('director_pitches')
        .insert({ job_id: jobId, director_id: id, pitch });
    })
  );
}

// Client: Subscribe to progressive updates
function useDirectorStream(jobId: string) {
  const [directors, setDirectors] = useState<DirectorPitch[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const channel = supabase
      .channel(`directors-${jobId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'director_pitches',
        filter: `job_id=eq.${jobId}`,
      }, (payload) => {
        setDirectors(prev => [...prev, payload.new.pitch]);
        if (directors.length === 0) setStep(2);
        if (directors.length === 3) setStep(3);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [jobId]);

  return { directors, step, isComplete: directors.length === 4 };
}
```

**Step Indicator Component:**

```typescript
interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { step: 1, label: 'Analyzing your brand asset' },
  { step: 2, label: 'Directors are reviewing' },
  { step: 3, label: 'Complete' },
];

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {STEPS.map(({ step, label }) => (
        <div
          key={step}
          className={`step ${step <= currentStep ? 'active' : ''} ${step === currentStep ? 'current' : ''}`}
        >
          <span className="step-number">{step}</span>
          <span className="step-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
```

**Cost Impact:** Zero (same API calls, better UX)

---

### 3.2 Bounded Profile + Async Update (B2)

**Problem:** JSONB updates could exceed 150ms target
**Target:** <150ms p95

**Solution:** Bounded profile size + non-blocking async update

```typescript
// Profile update is async - doesn't block user flow
async function selectDirector(
  userId: string,
  jobId: string,
  directorId: DirectorId,
  rawScores: Scores
): Promise<SelectDirectorResponse> {
  const startTime = Date.now();

  // 1. Insert learning event (required, fast)
  const learningEvent = await db.learningEvents.insert({
    userId,
    jobId,
    rawScores,
    selectedDirectorId: directorId,
    learningDelta: calculateLearningDelta(rawScores, directorId),
  });

  // 2. Return success immediately
  const response: SelectDirectorResponse = {
    success: true,
    learningRecorded: true,
    selectedDirector: directorId,
  };

  // 3. Update profile async (non-blocking)
  setImmediate(async () => {
    const profileStart = Date.now();
    try {
      await updateCreativeProfile(userId, learningEvent);

      // Track latency
      await trackMetric({
        name: 'profile_update_latency_ms',
        value: Date.now() - profileStart,
        tags: { userId, async: 'true' },
      });
    } catch (error) {
      console.error('Profile update failed (non-critical):', error);
    }
  });

  return response;
}
```

**Cost Impact:** Zero

---

### 3.3 Request Queue + Rate Limiter (B3)

**Problem:** DeepSeek 10 req/s limit → Max 2.5 analyses/second
**Target:** 10+ users/second with graceful degradation

**Solution:** p-queue with backpressure handling

```typescript
import PQueue from 'p-queue';

// Global DeepSeek queue
const deepseekQueue = new PQueue({
  concurrency: 10,      // Match API limit
  interval: 1000,       // Per second
  intervalCap: 10,      // Max 10 per interval
});

// Queue thresholds
const QUEUE_THRESHOLDS = {
  INSTANT: 20,       // No user notice
  HIGH_DEMAND: 40,   // Show "High demand" banner
  QUEUED: 100,       // Show queue position
  OVERFLOW: 200,     // Defer to email notification
};

export async function queuedPitchGeneration(
  rawScores: Scores,
  directorId: DirectorId
): Promise<DirectorPitch> {
  return deepseekQueue.add(
    () => generateDirectorPitch(rawScores, directorId),
    { priority: 1 }
  );
}

export function getQueueStatus(): QueueStatus {
  const depth = deepseekQueue.size + deepseekQueue.pending;

  if (depth >= QUEUE_THRESHOLDS.OVERFLOW) {
    return {
      status: 'overflow',
      message: 'High traffic! We\'ll email you when ready.',
      estimatedWait: Math.ceil(depth / 2.5),
    };
  }

  if (depth >= QUEUE_THRESHOLDS.QUEUED) {
    return {
      status: 'queued',
      position: depth - QUEUE_THRESHOLDS.HIGH_DEMAND,
      estimatedWait: Math.ceil((depth - QUEUE_THRESHOLDS.HIGH_DEMAND) / 2.5),
    };
  }

  if (depth >= QUEUE_THRESHOLDS.HIGH_DEMAND) {
    return {
      status: 'high_demand',
      message: 'High demand - your analysis may take a moment longer',
    };
  }

  return { status: 'instant' };
}
```

**Scaling Triggers:**

| Condition | Action |
|-----------|--------|
| Queue >100 for 5min | Alert on-call |
| Queue >200 for 10min | Upgrade DeepSeek plan |
| Error rate >5% | Investigate immediately |

**Cost Impact:** Zero (p-queue is free library)

---

## 4. UX Decisions

### 4.1 Perceived Performance: Step Indicator (Q1)

**Decision:** Step indicator (1/3, 2/3, 3/3) instead of skeleton or percentage

**Rationale:**
- Honest about progress without fake percentages
- Users know "Step 2 of 3" means they're making progress
- Works with progressive director reveal

**UI:**
```
┌─────────────────────────────────────────────┐
│  Step 2 of 3                                │
│  ○────●────○                                │
│  Directors are reviewing your asset...      │
└─────────────────────────────────────────────┘
```

---

### 4.2 Flow Integration: Prompt with CTA (Q2)

**Decision:** Show prompt with CTA after studio analysis completes

**Rationale:**
- User controls pace (not auto-redirected)
- Clear next action
- Option to stay and review analysis

**UI:**
```
┌─────────────────────────────────────────────┐
│  ✓ Analysis Complete!                       │
│                                             │
│  Quality Score: 8.5/10                      │
│  Mood: Modern, Energetic                    │
│  Industry: Technology                       │
│                                             │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Choose Director │  │   Stay Here    │  │
│  │       →         │  │                │  │
│  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────┘
```

**Header Navigation:**
```
┌─────────────────────────────────────────────────────────┐
│  🏔️ Longevity Valley     [Studio]  [Lounge]  [⚙️]      │
└─────────────────────────────────────────────────────────┘
```

---

### 4.3 Mobile Strategy (Q3)

**Q3a Decision:** Vertical scroll (native mobile pattern)

**Rationale:**
- Native feel on mobile
- No additional library needed
- Works with progressive reveal

**Q3b Decision:** Summary → Expand (accordion pattern)

**Collapsed State:**
```
┌─────────────────────────────────────────────┐
│  🔬 The Physicist                           │
│  "Precision in every frame"                 │
│  ⚡ Physics: 8.5  🎨 Vibe: 4.5  🧠 Logic: 6.2│
│                                             │
│  [Expand ▼]                                 │
└─────────────────────────────────────────────┘
```

**Expanded State:**
```
┌─────────────────────────────────────────────┐
│  🔬 The Physicist                           │
│  "Precision in every frame"                 │
│  ⚡ Physics: 8.5  🎨 Vibe: 4.5  🧠 Logic: 6.2│
├─────────────────────────────────────────────┤
│  👀 Vision:                                 │
│  High-mass object with significant          │
│  velocity potential...                      │
│                                             │
│  🛡️ Safety:                                 │
│  Precise motion control ensures brand       │
│  integrity...                               │
│                                             │
│  ✨ Magic:                                   │
│  Physics excellence creates memorable       │
│  impact...                                  │
├─────────────────────────────────────────────┤
│  [🎬 GREENLIGHT THIS DIRECTOR]              │
│                                             │
│  [Collapse ▲]                               │
└─────────────────────────────────────────────┘
```

---

### 4.4 Caching Strategy (Q4)

**Q4a Decision:** 24 hours + content hash

**Rationale:**
- Balance between freshness and cost savings
- Content hash ensures exact duplicates are caught
- 24hr TTL allows for brand updates

```typescript
// Cache lookup with TTL
async function getOrAnalyze(contentHash: string, file: File) {
  const cached = await db.visionJobs.findFirst({
    where: {
      contentHash,
      status: 'completed',
      createdAt: { gte: subHours(new Date(), 24) },  // 24hr TTL
    },
    orderBy: { createdAt: 'desc' },
  });

  if (cached) {
    return { cached: true, data: cached };
  }

  return { cached: false, data: await analyze(file) };
}
```

**Q4b Decision:** Client-side hash check (skip re-upload)

**Rationale:**
- Instant detection of duplicates
- Saves upload bandwidth
- Better UX for repeat users

```typescript
// Client-side before upload
async function handleFileSelect(file: File) {
  // Compute hash locally
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Check cache on server
  const { cached, jobId } = await trpc.vision.checkCache.query({ hash });

  if (cached) {
    showToast('Using your previous analysis');
    return navigateToResults(jobId);
  }

  // Proceed with upload
  await uploadFile(file);
}
```

**Database Change:**
```sql
ALTER TABLE vision_jobs ADD COLUMN content_hash VARCHAR(64);
CREATE INDEX idx_vision_jobs_hash ON vision_jobs(content_hash);
```

---

### 4.5 Error Recovery (Q5)

**Q5a Decision:** Graceful degradation + retry per card

**Rationale:**
- Show what we have instead of all-or-nothing
- Per-card retry reduces user frustration
- Transparent about failures

```typescript
async function analyze4Directors(rawScores: Scores) {
  const results = await Promise.allSettled([
    generatePitch(rawScores, 'physicist'),
    generatePitch(rawScores, 'aesthete'),
    generatePitch(rawScores, 'strategist'),
    generatePitch(rawScores, 'provocateur'),
  ]);

  return results.map((result, i) => {
    const directorId = DIRECTOR_IDS[i];

    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      id: directorId,
      status: 'unavailable',
      error: 'This director is temporarily unavailable',
      retryable: true,
    };
  });
}
```

**Unavailable Director UI:**
```
┌─────────────────────────────────────────────┐
│  🔬 The Physicist                           │
│                                             │
│  ⚠️ Temporarily Unavailable                 │
│                                             │
│  [↻ Retry This Director]                    │
└─────────────────────────────────────────────┘
```

**Q5b Decision:** Auto-retry 3x with exponential backoff + manual

```typescript
async function uploadWithRetry(file: File, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await uploadFile(file);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      // Exponential backoff: 1s, 2s, 4s
      await delay(1000 * Math.pow(2, attempt));
    }
  }
}

// Usage with manual retry fallback
try {
  await uploadWithRetry(file);
} catch (error) {
  showError({
    message: 'Upload failed after 3 attempts',
    action: {
      label: 'Try Again',
      onClick: () => uploadWithRetry(file),
    },
  });
}
```

---

## 5. New Infrastructure Components

### 5.1 Database Schema (Complete)

```sql
-- ================================================
-- USER TABLES
-- ================================================

-- Amended users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_consent BOOLEAN DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creative_profile JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_updated_at TIMESTAMPTZ;

-- ================================================
-- VISION TABLES
-- ================================================

-- Amended vision_jobs table
ALTER TABLE vision_jobs ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_vision_jobs_hash ON vision_jobs(content_hash);

-- Director pitches (for progressive reveal)
CREATE TABLE IF NOT EXISTS director_pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES vision_jobs(id) ON DELETE CASCADE,
  director_id VARCHAR(50) NOT NULL,
  pitch JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(job_id, director_id)
);

CREATE INDEX idx_director_pitches_job ON director_pitches(job_id);

-- ================================================
-- LEARNING TABLES
-- ================================================

-- Learning events (with experiment tracking)
CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES vision_jobs(id) ON DELETE CASCADE,
  raw_scores JSONB NOT NULL,
  director_pitches JSONB NOT NULL,
  selected_director_id VARCHAR(50) NOT NULL,
  learning_delta JSONB NOT NULL,
  experiment_variant VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_events_user_id ON learning_events(user_id);
CREATE INDEX idx_learning_events_director ON learning_events(selected_director_id);
CREATE INDEX idx_learning_events_variant ON learning_events(experiment_variant);
CREATE INDEX idx_learning_events_created ON learning_events(created_at);

-- ================================================
-- METRICS TABLE (Phase 4C requirement)
-- ================================================

CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  value DECIMAL NOT NULL,
  tags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_name ON metrics(name);
CREATE INDEX idx_metrics_created ON metrics(created_at);
CREATE INDEX idx_metrics_name_created ON metrics(name, created_at);

-- ================================================
-- AUDIT LOG (for consent tracking)
-- ================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
```

---

### 5.2 RLS Policies

```sql
-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

-- Enable RLS on all tables
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Learning events: Only if user has consented
CREATE POLICY "learning_events_insert_with_consent"
ON learning_events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
    AND learning_consent = true
  )
);

CREATE POLICY "learning_events_select_own"
ON learning_events FOR SELECT
USING (user_id = auth.uid());

-- Director pitches: Users can read their own jobs
CREATE POLICY "director_pitches_select_own"
ON director_pitches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vision_jobs
    WHERE id = job_id
    AND user_id = auth.uid()
  )
);

-- Metrics: Server-only writes
CREATE POLICY "metrics_insert_service"
ON metrics FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "metrics_select_service"
ON metrics FOR SELECT
USING (auth.role() = 'service_role');

-- Audit log: Server-only
CREATE POLICY "audit_log_insert_service"
ON audit_log FOR INSERT
WITH CHECK (auth.role() = 'service_role');
```

---

### 5.3 API Surface (Complete)

```typescript
// ================================================
// tRPC ROUTER DEFINITIONS
// ================================================

// Storage Router (NEW)
storage: {
  // Get signed URL for direct upload
  getUploadUrl: publicProcedure
    .input(z.object({
      filename: z.string(),
      mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    }))
    .mutation(async ({ input }) => {
      return { signedUrl: string, path: string };
    }),
}

// Vision Router (AMENDED)
vision: {
  // Check cache by content hash
  checkCache: publicProcedure
    .input(z.object({ hash: z.string().length(64) }))
    .query(async ({ input }) => {
      return { cached: boolean, jobId?: string };
    }),

  // Process uploaded file
  processUpload: publicProcedure
    .input(z.object({ path: z.string(), contentHash: z.string() }))
    .mutation(async ({ input }) => {
      return { jobId: string, cached: boolean, data?: VisionJob };
    }),

  // Get job (deprecated - use Realtime)
  getJob: publicProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .query(async ({ input }) => {
      return VisionJob;
    }),
}

// Director Router (AMENDED for 4 directors)
director: {
  // Analyze with 4 directors (progressive)
  analyze4Directors: publicProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      // Streams results via Supabase Realtime
      return { started: true, channel: string };
    }),

  // Retry single failed director
  retryDirector: publicProcedure
    .input(z.object({
      jobId: z.string().uuid(),
      directorId: z.enum(['physicist', 'aesthete', 'strategist', 'provocateur']),
    }))
    .mutation(async ({ input }) => {
      return DirectorPitch;
    }),

  // Select director (captures learning event)
  selectDirector: publicProcedure
    .input(z.object({
      jobId: z.string().uuid(),
      directorId: z.enum(['physicist', 'aesthete', 'strategist', 'provocateur']),
      rawScores: z.object({
        physics: z.number().min(0).max(1),
        vibe: z.number().min(0).max(1),
        logic: z.number().min(0).max(1),
      }),
    }))
    .mutation(async ({ input }) => {
      return {
        success: boolean,
        learningRecorded: boolean,
        experimentVariant?: string,
        wasOverride: boolean,
      };
    }),

  // Get user profile
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      return UserCreativeProfile | null;
    }),
}

// User Router (NEW)
user: {
  // Set learning consent
  setLearningConsent: protectedProcedure
    .input(z.object({ consent: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return { success: boolean };
    }),

  // Get learning consent status
  getLearningConsent: protectedProcedure
    .query(async ({ ctx }) => {
      return { consent: boolean | null };
    }),
}

// Experiments Router (NEW)
experiments: {
  // Get variant assignment
  getVariant: publicProcedure
    .input(z.object({
      experimentName: z.enum(['director_card_layout']),
    }))
    .query(async ({ input, ctx }) => {
      return { variant: string };
    }),
}

// Metrics Router (NEW - service role only)
metrics: {
  // Batch insert metrics
  track: serviceProcedure
    .input(z.object({
      metrics: z.array(z.object({
        name: z.string(),
        value: z.number(),
        tags: z.record(z.string()).optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      return { inserted: number };
    }),
}
```

---

### 5.4 Minimal A/B Framework (Gap 3)

**File:** `src/lib/experiments.ts`

```typescript
// ================================================
// MINIMAL A/B TEST FRAMEWORK
// ================================================

export type ExperimentName = 'director_card_layout';

export type DirectorCardLayoutVariant = 'all_cards' | 'recommended_first';

interface ExperimentConfig<V extends string> {
  name: ExperimentName;
  variants: V[];
  weights: number[];  // Must sum to 1.0
  enabled: boolean;
}

const EXPERIMENTS: Record<ExperimentName, ExperimentConfig<string>> = {
  director_card_layout: {
    name: 'director_card_layout',
    variants: ['all_cards', 'recommended_first'],
    weights: [0.5, 0.5],  // 50/50 split
    enabled: true,
  },
};

/**
 * Deterministic variant assignment
 * Same user always gets same variant
 */
export function getVariant<V extends string>(
  userId: string,
  experimentName: ExperimentName
): V {
  const config = EXPERIMENTS[experimentName];

  if (!config.enabled) {
    return config.variants[0] as V;
  }

  const hash = djb2Hash(userId + experimentName);
  const bucket = (hash % 100) / 100;

  let cumulative = 0;
  for (let i = 0; i < config.variants.length; i++) {
    cumulative += config.weights[i];
    if (bucket < cumulative) {
      return config.variants[i] as V;
    }
  }

  return config.variants[0] as V;
}

/**
 * DJB2 hash function
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Track experiment exposure
 */
export function getExperimentContext(userId: string): Record<string, string> {
  return {
    director_card_layout: getVariant(userId, 'director_card_layout'),
  };
}
```

**Usage:**

```typescript
// TheLounge.tsx
import { getVariant, DirectorCardLayoutVariant } from '@/lib/experiments';

function TheLounge({ userId }: Props) {
  const variant = getVariant<DirectorCardLayoutVariant>(userId, 'director_card_layout');

  if (variant === 'recommended_first') {
    const recommended = getRecommendedDirector(directors, userProfile);
    const alternates = directors.filter(d => d.id !== recommended.id);

    return (
      <>
        <RecommendedDirectorCard director={recommended} highlighted />
        <DirectorGrid directors={alternates} />
      </>
    );
  }

  return <DirectorGrid directors={directors} />;
}
```

---

### 5.5 Blocking Consent Modal (Gap 4A)

**File:** `src/components/ConsentModal.tsx`

```typescript
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';

interface ConsentModalProps {
  onConsentGiven: () => void;
  onConsentDeclined: () => void;
}

export function ConsentModal({ onConsentGiven, onConsentDeclined }: ConsentModalProps) {
  const [isChecked, setIsChecked] = useState(false);
  const setConsent = trpc.user.setLearningConsent.useMutation();

  const handleAccept = async () => {
    await setConsent.mutateAsync({ consent: true });
    onConsentGiven();
  };

  const handleDecline = async () => {
    await setConsent.mutateAsync({ consent: false });
    onConsentDeclined();
  };

  return (
    <div className="consent-overlay">
      <div className="consent-modal">
        <div className="consent-icon">🎓</div>

        <h2>Personalized Experience</h2>

        <p className="consent-description">
          The Director's Lounge learns from your choices to provide
          better recommendations over time.
        </p>

        <div className="consent-details">
          <h4>What we learn:</h4>
          <ul>
            <li>Which director styles you prefer</li>
            <li>Your creative bias (physics, vibe, or logic)</li>
            <li>How often you override our suggestions</li>
          </ul>

          <h4>What we don't do:</h4>
          <ul>
            <li>Share your preferences with third parties</li>
            <li>Use data for advertising</li>
            <li>Store personally identifiable information</li>
          </ul>
        </div>

        <label className="consent-checkbox">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
          />
          <span>
            I consent to preference learning.{' '}
            <a href="/privacy" target="_blank">Privacy Policy</a>
          </span>
        </label>

        <div className="consent-actions">
          <button
            className="btn-primary"
            onClick={handleAccept}
            disabled={!isChecked || setConsent.isPending}
          >
            {setConsent.isPending ? 'Saving...' : 'Enable Personalization'}
          </button>

          <button
            className="btn-secondary"
            onClick={handleDecline}
            disabled={setConsent.isPending}
          >
            Skip for Now
          </button>
        </div>

        <p className="consent-note">
          You can change this anytime in Settings.
        </p>
      </div>
    </div>
  );
}
```

**Integration:**

```typescript
// src/app/lounge/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ConsentModal } from '@/components/ConsentModal';
import { TheLounge } from '@/components/TheLounge';
import { trpc } from '@/lib/trpc';

export default function LoungePage() {
  const [showConsent, setShowConsent] = useState<boolean | null>(null);
  const { data: consent, isLoading } = trpc.user.getLearningConsent.useQuery();

  useEffect(() => {
    if (!isLoading) {
      setShowConsent(consent?.consent === null);
    }
  }, [consent, isLoading]);

  if (isLoading || showConsent === null) {
    return <LoadingSpinner />;
  }

  if (showConsent) {
    return (
      <ConsentModal
        onConsentGiven={() => setShowConsent(false)}
        onConsentDeclined={() => setShowConsent(false)}
      />
    );
  }

  return <TheLounge />;
}
```

---

### 5.6 Metrics Instrumentation (Gap 5 - Before Phase 4C)

**File:** `src/lib/metrics.ts`

```typescript
// ================================================
// LIGHTWEIGHT METRICS LAYER
// Must be deployed BEFORE Phase 4C production
// ================================================

export type MetricName =
  // Technical Metrics (spec targets)
  | 'learning_event_capture_rate'    // Target: >95%
  | 'profile_update_latency_ms'      // Target: <150ms p95
  | 'lounge_page_load_ms'            // Target: <2000ms p95
  // Product Metrics
  | 'director_selection_time_ms'     // Target: <30000ms avg
  | 'director_diversity_score'       // Target: >20%
  | 'cache_hit_rate'                 // Track efficiency
  // System Metrics
  | 'deepseek_queue_depth'
  | 'deepseek_request_latency_ms'
  | 'gemini_request_latency_ms'
  | 'error_rate';

export interface Metric {
  name: MetricName;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

class MetricsClient {
  private buffer: Metric[] = [];
  private flushInterval = 10000;  // 10s
  private maxBufferSize = 100;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.startFlushTimer();
      window.addEventListener('beforeunload', () => this.flush());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this.flush();
      });
    }
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  track(metric: Metric): void {
    this.buffer.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    });

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const toSend = [...this.buffer];
    this.buffer = [];

    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: toSend }),
        keepalive: true,  // Survives page unload
      });
    } catch (error) {
      // Re-add failed metrics (at front, capped)
      this.buffer = [...toSend.slice(-50), ...this.buffer].slice(0, this.maxBufferSize);
      console.error('[Metrics] Flush failed:', error);
    }
  }
}

export const metrics = new MetricsClient();

// ================================================
// HELPER FUNCTIONS
// ================================================

/**
 * Track page load timing
 */
export function usePageLoadMetric(pageName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      metrics.track({
        name: 'lounge_page_load_ms',
        value: performance.now() - startTime,
        tags: { page: pageName },
      });
    };
  }, [pageName]);
}

/**
 * Track director selection
 */
export function trackDirectorSelection(
  startTime: number,
  directorId: string,
  wasOverride: boolean
): void {
  metrics.track({
    name: 'director_selection_time_ms',
    value: Date.now() - startTime,
    tags: { directorId, wasOverride: String(wasOverride) },
  });
}

/**
 * Track learning capture (server-side)
 */
export function trackLearningCapture(success: boolean, latencyMs: number): void {
  metrics.track({
    name: 'learning_event_capture_rate',
    value: success ? 1 : 0,
  });

  metrics.track({
    name: 'profile_update_latency_ms',
    value: latencyMs,
  });
}

/**
 * Track cache performance
 */
export function trackCacheHit(hit: boolean): void {
  metrics.track({
    name: 'cache_hit_rate',
    value: hit ? 1 : 0,
  });
}

/**
 * Track queue depth (server-side, periodic)
 */
export function trackQueueDepth(depth: number): void {
  metrics.track({
    name: 'deepseek_queue_depth',
    value: depth,
  });
}
```

**API Endpoint:**

```typescript
// src/app/api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { metrics as metricsTable } from '@/drizzle/schema';

export async function POST(req: NextRequest) {
  try {
    const { metrics } = await req.json();

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid metrics' }, { status: 400 });
    }

    await db.insert(metricsTable).values(
      metrics.map((m: Metric) => ({
        name: m.name,
        value: m.value,
        tags: m.tags || {},
        createdAt: new Date(m.timestamp || Date.now()),
      }))
    );

    return NextResponse.json({ success: true, inserted: metrics.length });
  } catch (error) {
    console.error('[Metrics API] Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
```

**Dashboard Queries:**

```sql
-- ================================================
-- SUCCESS METRICS DASHBOARD QUERIES
-- ================================================

-- 1. Learning Event Capture Rate (target: >95%)
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(CASE WHEN value = 1 THEN 1 END)::float / NULLIF(COUNT(*), 0) AS capture_rate
FROM metrics
WHERE name = 'learning_event_capture_rate'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;

-- 2. Profile Update Latency p95 (target: <150ms)
SELECT
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY value) AS p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value) AS p99,
  MAX(value) AS max
FROM metrics
WHERE name = 'profile_update_latency_ms'
  AND created_at > NOW() - INTERVAL '24 hours';

-- 3. Lounge Page Load p95 (target: <2000ms)
SELECT
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY value) AS p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95,
  AVG(value) AS avg
FROM metrics
WHERE name = 'lounge_page_load_ms'
  AND created_at > NOW() - INTERVAL '24 hours';

-- 4. Director Selection Time (target: <30000ms avg)
SELECT
  tags->>'directorId' AS director,
  AVG(value) AS avg_time_ms,
  COUNT(*) AS selections
FROM metrics
WHERE name = 'director_selection_time_ms'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY tags->>'directorId'
ORDER BY selections DESC;

-- 5. Cache Hit Rate
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(CASE WHEN value = 1 THEN 1 END)::float / NULLIF(COUNT(*), 0) AS hit_rate
FROM metrics
WHERE name = 'cache_hit_rate'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;

-- 6. Queue Depth Over Time
SELECT
  DATE_TRUNC('minute', created_at) AS minute,
  AVG(value) AS avg_depth,
  MAX(value) AS max_depth
FROM metrics
WHERE name = 'deepseek_queue_depth'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute;

-- 7. Error Rate
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  SUM(value) AS error_count
FROM metrics
WHERE name = 'error_rate'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

---

## 6. Edge Case Handling

### 6.1 Batch Brand Asset Uploads (Phase 4D)

**Status:** Deferred to Phase 4D

**Design:**
- Upload up to 10 brand assets
- Parallel Gemini calls for each asset
- Single aggregated Brand DNA
- Single director pitch pass

```typescript
// Future API
vision.batchAnalyze({
  assets: [
    { filename: 'logo.png', category: 'logo' },
    { filename: 'package.jpg', category: 'packaging' },
    // ...
  ],
}) → {
  individualScores: [...],
  aggregatedDNA: { physics, vibe, logic, brandConsistency },
  directors: [...],
}
```

---

### 6.2 API Fallback Chains

**DeepSeek Fallback:**
```
DeepSeek V3 → DeepSeek V2 → Template Pitches
```

**Gemini Fallback:**
```
Gemini 2.5 Flash → Gemini 1.5 Pro → Heuristic Analysis
```

```typescript
async function generatePitchWithFallback(scores: Scores, directorId: DirectorId) {
  // Primary: DeepSeek V3
  try {
    return await generatePitch(scores, directorId, 'deepseek-v3');
  } catch (e) {
    console.warn('DeepSeek V3 failed');
  }

  // Secondary: DeepSeek V2
  try {
    return await generatePitch(scores, directorId, 'deepseek-v2');
  } catch (e) {
    console.warn('DeepSeek V2 failed');
  }

  // Tertiary: Template
  return getTemplatePitch(scores, directorId);
}
```

---

### 6.3 Cache Stampede Prevention

```typescript
const analysisLocks = new Map<string, Promise<VisionJob>>();

async function getOrAnalyze(hash: string, file: File) {
  // Check cache
  const cached = await checkCache(hash);
  if (cached) return { cached: true, data: cached };

  // Check if already in progress
  if (analysisLocks.has(hash)) {
    return { cached: true, data: await analysisLocks.get(hash) };
  }

  // Start with lock
  const promise = analyze(file);
  analysisLocks.set(hash, promise);

  try {
    const result = await promise;
    return { cached: false, data: result };
  } finally {
    analysisLocks.delete(hash);
  }
}
```

---

### 6.4 Consent State Machine

| Current State | Action | New State | Side Effect |
|---------------|--------|-----------|-------------|
| `null` | Accept | `true` | Enable learning |
| `null` | Decline | `false` | Disable learning |
| `true` | Revoke | `false` | Stop new captures |
| `false` | Grant | `true` | Resume captures |
| `*` | Delete account | - | CASCADE delete all |

```typescript
async function handleConsentChange(userId: string, newState: boolean) {
  await db.users.update({
    where: { id: userId },
    data: {
      learning_consent: newState,
      consent_updated_at: new Date(),
    },
  });

  await db.auditLog.insert({
    userId,
    action: newState ? 'consent_granted' : 'consent_revoked',
    details: { timestamp: new Date().toISOString() },
  });
}
```

---

### 6.5 Large File Handling

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB

async function prepareForUpload(file: File): Promise<File> {
  if (file.size <= MAX_FILE_SIZE) {
    return file;
  }

  // Compress
  const compressed = await compressImage(file, {
    maxWidth: 4096,
    maxHeight: 4096,
    quality: 0.85,
    format: 'webp',
  });

  if (compressed.size > MAX_FILE_SIZE) {
    throw new FileTooLargeError('Image too large even after compression');
  }

  return compressed;
}
```

---

## 7. Rate Limiting Summary

| API | Limit | Usage per Analysis | Max Throughput | Mitigation |
|-----|-------|-------------------|----------------|------------|
| **Gemini 2.5 Flash** | 60 req/min | 1 | 60/min | Fallback to 1.5 Pro |
| **DeepSeek V3** | 10 req/s | 4 | 2.5/s | Queue + rate limiter |
| **Supabase Storage** | 50MB/file | 10MB max | N/A | Client compression |
| **Supabase Realtime** | 200 concurrent | 1 per user | 200 users | Connection pooling |
| **Supabase DB** | 500 connections | 1-2 | 250-500 users | Pooling |

---

## 8. Rollout Plan

### Phase 4A: Backend Infrastructure

**Scope:** Database + API + Fallbacks

- [ ] Deploy schema migrations
  - `users.learning_consent`, `consent_updated_at`
  - `users.creative_profile`
  - `vision_jobs.content_hash`
  - `director_pitches` table
  - `learning_events` with `experiment_variant`
  - `metrics` table
  - `audit_log` table
- [ ] Implement signed URL upload
- [ ] Implement content-hash caching (24hr TTL)
- [ ] Implement cache stampede prevention
- [ ] Implement DeepSeek request queue
- [ ] Implement API fallback chains
- [ ] Implement consent endpoints
- [ ] Implement 4-director bias logic
- [ ] Implement dynamic engine selection
- [ ] Deploy RLS policies

**Success Criteria:**
- All migrations applied
- Signed URL upload working
- Queue handling 10+ users/sec
- Fallback chains tested

---

### Phase 4B: Frontend UI

**Scope:** Lounge + Consent + Progressive Reveal

- [ ] Implement ConsentModal component
- [ ] Integrate consent check in /lounge
- [ ] Implement A/B experiment framework
- [ ] Implement step indicator component
- [ ] Implement progressive director reveal
- [ ] Implement mobile accordion pattern
- [ ] Implement post-analysis CTA in /studio
- [ ] Add header navigation
- [ ] Implement error retry per card
- [ ] Implement upload retry with backoff
- [ ] Add Supabase Realtime subscriptions

**Success Criteria:**
- Consent modal blocks until decision
- Step indicator shows 1/3 → 2/3 → 3/3
- Directors appear progressively
- Mobile accordion works
- A/B variants render correctly

---

### Phase 4C: Production + Metrics (Gap 5)

**Prerequisite:** Metrics instrumentation BEFORE production deploy

**Scope:** Metrics + Deploy + Monitor

- [ ] Deploy metrics client (frontend)
- [ ] Deploy metrics API endpoint
- [ ] Implement all tracking hooks:
  - [ ] Page load timing
  - [ ] Director selection timing
  - [ ] Learning capture rate
  - [ ] Profile update latency
  - [ ] Cache hit rate
  - [ ] Queue depth
  - [ ] Error rate
- [ ] Create dashboard queries
- [ ] Set up alerts:
  - [ ] Capture rate <95%
  - [ ] Profile latency >150ms p95
  - [ ] Page load >2000ms p95
  - [ ] Queue depth >100
  - [ ] Error rate >1%
- [ ] Deploy to production
- [ ] Monitor 48 hours

**Success Criteria:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Learning Event Capture Rate | >95% | <90% |
| Profile Update Latency | <150ms p95 | >200ms p95 |
| Lounge Page Load | <2000ms p95 | >3000ms p95 |
| Director Selection Time | <30000ms avg | >45000ms avg |
| Error Rate | <1% | >2% |
| Queue Depth | <100 | >150 |

---

### Phase 4D: Enhancements (Post-Launch)

- [ ] Batch brand asset uploads
- [ ] Confidence indicators in UI
- [ ] "Surprise Me" random director
- [ ] Analytics dashboard
- [ ] Export learning data (GDPR)

---

## 9. Cost Summary

| Component | Cost Impact | Notes |
|-----------|-------------|-------|
| 4 Directors | +33% DeepSeek | Mitigated by caching |
| Dynamic Engine | $0 | Removed Gemini Pro Video |
| Signed URL | $0 | Uses existing Supabase |
| Supabase Realtime | $0 | Included in plan |
| Content-Hash Cache | ~$0 | 64-byte column |
| Request Queue | $0 | p-queue library |
| A/B Framework | $0 | Client-side logic |
| Consent Modal | $0 | Client component |
| Metrics Table | ~$1/month | Minimal storage |

**Net:** +33% DeepSeek per analysis, offset by 24hr caching

---

## 10. Approval Checklist

### CTO Approval Required

- [ ] 4-director system (Provocateur formalized)
- [ ] Dynamic engine selection (Kling/Luma only)
- [ ] +33% DeepSeek cost for 4 directors
- [ ] 24-hour cache TTL
- [ ] Progressive reveal UX
- [ ] Minimal A/B framework scope
- [ ] Blocking consent modal approach
- [ ] Metrics before Phase 4C requirement

### Lead Engineer Approval Required

- [ ] Schema migrations
- [ ] Signed URL upload flow
- [ ] Request queue implementation
- [ ] Fallback chain logic
- [ ] Cache stampede prevention
- [ ] Supabase Realtime integration
- [ ] Metrics instrumentation
- [ ] RLS policies
- [ ] Rollout timeline

### Legal Approval Required

- [ ] Consent modal copy
- [ ] Privacy policy updates
- [ ] GDPR compliance (learning events)
- [ ] Audit log retention policy

---

## 11. Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| Nov 30, 2025 | 1.0 | - | Initial architecture |
| Dec 2, 2025 | 2.0 | - | Security + Style Pipeline |
| Dec 8, 2025 | 3.0 | - | Rashomon Learning System |
| Dec 8, 2025 | **4.0** | Claude | Gap resolution, bottlenecks, edge cases, UX decisions |

---

**Document Status:** 🟡 Awaiting CTO, Lead Engineer & Legal Review
**Review Deadline:** December 10, 2025
**Target Start Date:** December 11, 2025 (pending approval)
