# Schema Integrity Audit - Proprietary Scoring Matrix Integration

**Audit Date:** December 8, 2025
**Auditor:** Claude Opus 4.5
**Reference:** ARCH_SNAPSHOT_081225.md
**Status:** SWEETSPOT IDENTIFIED

---

## Executive Summary

This audit analyzes the current schema architecture to identify the optimal integration point ("sweetspot") for the Proprietary Scoring Matrix ("The Trinity"). The analysis reveals a well-designed two-layer persistence strategy with clear separation between raw AI output and denormalized routing scores.

### Key Finding: The Sweetspot

**Location:** `vision_jobs` table with dual-storage pattern

```
JSONB Storage (Complete)     ←→     Denormalized Columns (Fast Routing)
─────────────────────────────────────────────────────────────────────────
gemini_output                       physics_score, vibe_score, logic_score
(Full AI response)                  (Indexed for query performance)
```

---

## 1. Current Schema Topology

### 1.1 Proprietary Scoring Matrix Data Locations

| Location | Data Stored | Purpose | Index Status |
|----------|-------------|---------|--------------|
| `vision_jobs.gemini_output` | Full JSONB | Complete AI response | None (JSONB) |
| `vision_jobs.physics_score` | DECIMAL(3,2) | Denormalized for routing | `idx_vision_jobs_routing` |
| `vision_jobs.vibe_score` | DECIMAL(3,2) | Denormalized for routing | `idx_vision_jobs_routing` |
| `vision_jobs.logic_score` | DECIMAL(3,2) | Denormalized for routing | `idx_vision_jobs_routing` |
| `vision_jobs.integrity_score` | DECIMAL(3,2) | Health checkpoint | None (standalone) |
| `learning_events.raw_scores` | JSONB | Training data capture | None (JSONB) |
| `learning_events.director_pitches` | JSONB | Biased scores per director | None (JSONB) |
| `users.creative_profile` | JSONB | User bias vector | None (JSONB) |

### 1.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROPRIETARY SCORING MATRIX DATA FLOW                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────────────────────────────────────────┐    │
│  │   UPLOAD    │     │              THE EYE (Gemini AI)                 │    │
│  │  (Frontend) │────▶│  Extracts: physics_score, vibe_score, logic_score│    │
│  └─────────────┘     │            integrity_score, brand_attributes     │    │
│                      └─────────────────────────────────────────────────┘    │
│                                          │                                   │
│                    ┌─────────────────────┴─────────────────────┐             │
│                    ▼                                           ▼             │
│         ┌──────────────────────┐                 ┌──────────────────────┐    │
│         │  JSONB STORAGE       │                 │  DENORMALIZED COLS   │    │
│         │  gemini_output       │                 │  physics_score       │    │
│         │  (Complete Response) │                 │  vibe_score          │    │
│         │                      │                 │  logic_score         │    │
│         └──────────────────────┘                 └──────────────────────┘    │
│                    │                                           │             │
│                    ▼                                           ▼             │
│         ┌──────────────────────┐                 ┌──────────────────────┐    │
│         │  THE VOICE           │                 │  ROUTING ENGINE      │    │
│         │  (Director Persona)  │                 │  idx_vision_jobs_    │    │
│         │  Applies bias to     │                 │  routing index       │    │
│         │  generate commentary │                 │  (Fast engine        │    │
│         │                      │                 │   selection)         │    │
│         └──────────────────────┘                 └──────────────────────┘    │
│                    │                                           │             │
│                    ▼                                           │             │
│         ┌──────────────────────┐                               │             │
│         │  FRONTEND DISPLAY    │◀──────────────────────────────┘             │
│         │  BrandScanner.tsx    │                                             │
│         │  • Integrity Health  │                                             │
│         │  • Brand Essence     │                                             │
│         │  • CTA → /lounge     │                                             │
│         └──────────────────────┘                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Sweetspot Analysis

### 2.1 Why This Is The Sweetspot

The current architecture achieves optimal balance through **dual-storage strategy**:

| Aspect | JSONB (gemini_output) | Denormalized (score columns) |
|--------|----------------------|------------------------------|
| **Completeness** | Full AI response preserved | Only routing-critical fields |
| **Query Speed** | Slow (JSONB parsing) | Fast (indexed columns) |
| **Flexibility** | Schema-free evolution | Fixed schema |
| **Use Case** | Director commentary, rationale | Production engine routing |

### 2.2 Integration Points by Layer

#### Layer 1: THE EYE (Raw Analysis)
**File:** `src/server/services/vision.ts:analyzeRawPixels()`

```typescript
// The Eye outputs raw Trinity scores
interface RawPixelAnalysis {
  physics_score: number;  // 0-10
  vibe_score: number;     // 0-10
  logic_score: number;    // 0-10
  integrity_score: number; // 0-1
  scoring_rationale: { physics: string; vibe: string; logic: string; };
}
```

**Sweetspot Integration:**
- Raw scores are **immutable** after extraction
- Stored in both JSONB (complete) and columns (fast)
- Normalization: Gemini returns 0-10, DB stores 0-1 (divide by 10)

#### Layer 2: THE VOICE (Director Pitch)
**File:** `src/server/services/vision.ts:generateDirectorPitch()`

```typescript
// The Voice applies Director bias to raw scores
interface DirectorPitch {
  biased_scores: { physics: number; vibe: number; logic: number; };
  recommended_engine: 'kling' | 'luma';
  director_commentary: string;
}
```

**Sweetspot Integration:**
- Biased scores are **ephemeral** (computed on-demand)
- NOT persisted to `vision_jobs` (would cause data duplication)
- Stored only in `learning_events` for training purposes

#### Layer 3: Learning Delta (Silent Observer)
**File:** `supabase/migrations/20251207_add_creative_profile_learning.sql`

```sql
CREATE TABLE learning_events (
  raw_scores JSONB NOT NULL,           -- The Eye's truth
  director_pitches JSONB NOT NULL,     -- All biased versions
  selected_director_id VARCHAR(50),    -- User's choice
  learning_delta JSONB NOT NULL        -- objective vs subjective
);
```

**Sweetspot Integration:**
- Captures the **gap** between AI recommendation and user preference
- Enables Studio Head to learn user taste over time
- Feeds into `users.creative_profile` bias vector

---

## 3. Routing Index Analysis

### 3.1 Current Index Definition

```sql
-- From schema.ts:461
routingIdx: index('idx_vision_jobs_routing')
  .on(table.physicsScore, table.vibeScore, table.logicScore)
```

### 3.2 Index Efficiency

| Query Pattern | Index Used? | Performance |
|---------------|-------------|-------------|
| `WHERE physics_score > 0.7` | Partial (leftmost) | Fast |
| `WHERE vibe_score > 0.7` | No (not leftmost) | Full scan |
| `ORDER BY physics_score DESC` | Yes | Fast |
| `WHERE physics_score > vibe_score` | Covers both columns | Fast |

### 3.3 Recommended Index Enhancement

For optimal routing queries, consider adding a **computed column** for the winner:

```sql
-- Future Enhancement (not implemented)
ALTER TABLE vision_jobs
ADD COLUMN dominant_score VARCHAR(10)
GENERATED ALWAYS AS (
  CASE
    WHEN physics_score > vibe_score AND physics_score > logic_score THEN 'physics'
    WHEN vibe_score > logic_score THEN 'vibe'
    ELSE 'logic'
  END
) STORED;

CREATE INDEX idx_vision_jobs_dominant ON vision_jobs(dominant_score);
```

---

## 4. Integrity Score Health Checkpoint

### 4.1 Current Implementation

The Integrity Score serves as the **quality gate** before proceeding to Director's Lounge:

| Score Range | Health Status | UI Indicator | User Action |
|-------------|---------------|--------------|-------------|
| 0.8 - 1.0 | Healthy | Green circle | Proceed to Lounge |
| 0.6 - 0.79 | Caution | Yellow circle | Proceed with warning |
| 0.0 - 0.59 | Unhealthy | Red circle | Re-upload recommended |

### 4.2 Frontend Integration (BrandScanner.tsx)

```typescript
// Integrity Health Check Display
<div className={`w-20 h-20 rounded-full ${
  analysisData.quality.integrity >= 0.8
    ? 'bg-green-100 border-4 border-green-500'  // GREEN
    : analysisData.quality.integrity >= 0.6
      ? 'bg-yellow-100 border-4 border-yellow-500'  // YELLOW
      : 'bg-red-100 border-4 border-red-500'  // RED
}`}>
  {Math.round(analysisData.quality.integrity * 100)}%
</div>

// CTA only appears if integrity >= 0.6
{analysisData.quality.integrity >= 0.6 && (
  <a href="/lounge">Proceed to Director's Lounge</a>
)}
```

### 4.3 Sweetspot for Integrity

The Integrity Score is the **single source of truth** for quality gating:
- Extracted by THE EYE (objective)
- NOT modified by THE VOICE (Directors cannot override)
- Persisted in `vision_jobs.integrity_score` (denormalized)
- Also present in `gemini_output.integrity_score` (JSONB backup)

---

## 5. Hidden Scores Strategy (Abstraction Layer)

### 5.1 What's Hidden from Users

| Score | Visibility | Reason |
|-------|------------|--------|
| `physics_score` | Hidden | Internal routing metric |
| `vibe_score` | Hidden | Internal routing metric |
| `logic_score` | Hidden | Internal routing metric |
| `integrity_score` | Visible (as %) | User needs quality feedback |
| `recommended_engine` | Hidden | Implementation detail |
| `director_commentary` | Visible | User-facing explanation |

### 5.2 Why Hide The Trinity?

1. **Cognitive Load:** Users don't need to understand routing mechanics
2. **Brand Mystique:** Proprietary algorithm stays "magical"
3. **Flexibility:** Can change routing logic without UI changes
4. **Focus:** User attention on Brand Essence and Integrity health

### 5.3 What Users See Instead

```
┌─────────────────────────────────────────────────────────────────┐
│                    BRAND ANALYSIS RESULTS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │   INTEGRITY HEALTH   │  │      BRAND ESSENCE SUMMARY       │ │
│  │                      │  │                                  │ │
│  │      ┌──────┐        │  │  Mood: Dynamic, powerful         │ │
│  │      │ 85%  │        │  │  Industry: Automotive, Luxury    │ │
│  │      │GREEN │        │  │  Style: Performance, Adventure   │ │
│  │      └──────┘        │  │                                  │ │
│  │                      │  │  Colors: #FFF, #4D9, #B07        │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
│                                                                  │
│         [ Proceed to Director's Lounge → ]                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Schema Integrity Verification

### 6.1 Drizzle Schema vs SQL Migration

| Column | Drizzle (schema.ts) | SQL (001_initial_schema.sql) | Match |
|--------|---------------------|------------------------------|-------|
| physics_score | `numeric('physics_score', {precision: 3, scale: 2})` | `DECIMAL(3,2)` | Yes |
| vibe_score | `numeric('vibe_score', {precision: 3, scale: 2})` | `DECIMAL(3,2)` | Yes |
| logic_score | `numeric('logic_score', {precision: 3, scale: 2})` | `DECIMAL(3,2)` | Yes |
| integrity_score | `numeric('integrity_score', {precision: 3, scale: 2})` | `DECIMAL(3,2)` | Yes |
| gemini_output | `jsonb('gemini_output')` | `JSONB` | Yes |

### 6.2 Normalization Audit

**Critical Finding:** Score normalization is handled in `visionRouter.ts:507`

```typescript
// Gemini returns 0-10, DB constraint expects 0-1
const normalizeScore = (score: number) => String((score / 10).toFixed(2));

await db.update(visionJobs).set({
  physicsScore: normalizeScore(analysis.physics_score),  // "0.70"
  vibeScore: normalizeScore(analysis.vibe_score),        // "0.80"
  logicScore: normalizeScore(analysis.logic_score),      // "0.75"
  integrityScore: normalizeScore(analysis.integrity_score), // "0.85"
});
```

**Status:** Correctly implemented with DECIMAL(3,2) constraint enforcement.

---

## 7. Integration Sweetspot Summary

### 7.1 Optimal Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SWEETSPOT ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER 1: EXTRACTION (The Eye)                                               │
│  ════════════════════════════                                                │
│  • Gemini AI extracts raw Trinity scores                                     │
│  • Scores stored: gemini_output (JSONB) + denormalized columns               │
│  • Integrity score gates user progression                                    │
│                                                                              │
│  LAYER 2: INTERPRETATION (The Voice)                                         │
│  ════════════════════════════════════                                        │
│  • Director personas apply bias multipliers                                  │
│  • Biased scores NOT persisted (computed on-demand)                          │
│  • Commentary and scene_board stored in gemini_output                        │
│                                                                              │
│  LAYER 3: LEARNING (Silent Observer)                                         │
│  ════════════════════════════════════                                        │
│  • learning_events captures user selections                                  │
│  • Delta between objective/subjective recorded                               │
│  • Feeds users.creative_profile for personalization                          │
│                                                                              │
│  LAYER 4: ROUTING (Production Engine)                                        │
│  ══════════════════════════════════════                                      │
│  • idx_vision_jobs_routing enables fast engine selection                     │
│  • Simple rule: physics > vibe ? 'kling' : 'luma'                            │
│  • Fallback chain: KLING → LUMA → GEMINI_PRO                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Recommended Actions

| Priority | Action | Rationale |
|----------|--------|-----------|
| P0 | Keep dual-storage pattern | Optimal balance of flexibility and performance |
| P1 | Add integrity_score index | Frequently queried for health gating |
| P2 | Consider computed dominant_score column | Simplifies routing queries |
| P3 | Add learning_events partitioning | Will grow large with usage |

---

## 8. Conclusion

The Proprietary Scoring Matrix is **optimally integrated** at the `vision_jobs` table level with:

1. **Complete JSONB storage** for audit trail and Director access
2. **Denormalized columns** for fast routing queries
3. **Composite routing index** for production engine selection
4. **Learning events table** for capturing user preferences
5. **User creative profile** for evolving personalization

**Sweetspot Confidence:** HIGH

The current architecture supports both the immediate routing needs (via indexed columns) and the future learning capabilities (via JSONB + learning_events) without requiring schema modifications.

---

**Audit Complete**

*Generated by Schema Integrity Audit Tool*
*Reference: ARCH_SNAPSHOT_081225.md*
