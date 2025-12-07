# CTO Review: Proprietary Scoring Matrix - Input to Output Process

**Document Version:** 1.0
**Date:** December 2025
**Branch:** `feature/proprietary-scoring`
**Reviewer:** Gemini CTO

---

## Executive Summary

The Proprietary Scoring Matrix ("The Trinity") is an AI-powered image analysis system that determines optimal video production engine routing. It transforms a brand image into actionable video production parameters through a 3-stage pipeline.

---

## 1. INPUT SPECIFICATION

### 1.1 Primary Input
| Field | Type | Description |
|-------|------|-------------|
| `imageUrl` | `string` | Public URL of brand image (JPEG, PNG, WebP) |
| `mimeType` | `string` | Image MIME type for Gemini API |
| `base64Data` | `string` | Base64-encoded image data |

### 1.2 Input Constraints
```
MAX_FILE_SIZE: 10MB
ALLOWED_FORMATS: image/jpeg, image/png, image/webp
MIN_RESOLUTION: None (Gemini handles any size)
```

### 1.3 Input Flow
```
User Upload → File Validation → Malware Scan → Supabase Storage → Public URL → Gemini API
```

---

## 2. PROCESSING PIPELINE

### 2.1 Stage 1: Image Ingestion
**File:** `src/server/visionRouter.ts`

```typescript
// Input: Base64 file data from frontend
const validatedFile = await processUploadedFile(data, mimeType, filename);
const scanResult = await scanForMalware(validatedFile.buffer);
const imageUrl = await uploadToSupabaseStorage(buffer, filename, mimeType, userId);
```

### 2.2 Stage 2: AI Analysis (The Strategist)
**File:** `src/server/services/vision.ts`

```typescript
// Input: Public image URL
// Output: GeminiAnalysisOutput

const analysis = await analyzeBrandImage(imageUrl);
```

**Gemini Model:** `gemini-2.5-flash`

**System Prompt Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  PROPRIETARY SCORING MATRIX PROMPT                          │
├─────────────────────────────────────────────────────────────┤
│  1. Role Definition (Brand Strategist)                      │
│  2. Scoring Criteria (Physics/Vibe/Logic)                   │
│  3. Engine Routing Rules                                    │
│  4. Director Commentary Format (3-Beat Pulse)               │
│  5. Tone Guide (Forbidden words, style rules)               │
│  6. JSON Output Schema                                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Stage 3: Database Persistence
**File:** `src/server/visionRouter.ts`

```typescript
await db.update(visionJobs).set({
  status: 'completed',
  geminiOutput: analysis,           // Full JSONB
  physicsScore: analysis.physics_score,  // Denormalized
  vibeScore: analysis.vibe_score,
  logicScore: analysis.logic_score,
  integrityScore: analysis.integrity_score,
});
```

---

## 3. OUTPUT SPECIFICATION

### 3.1 Raw Gemini Output (`GeminiAnalysisOutput`)
**File:** `src/types/index.ts`

```typescript
interface GeminiAnalysisOutput {
  // Brand Identity
  brand_attributes: {
    primary_colors: string[];      // ["#FFFFFF", "#4D9ED0", "#B07548"]
    typography_style?: string;     // "Bold, sans-serif"
    mood: string;                  // "Dynamic, powerful, adventurous"
    industry?: string;             // "Automotive, Luxury"
  };

  // Visual Analysis
  visual_elements: {
    composition: string;           // "Car positioned left of center..."
    focal_points: string[];        // ["The white BMW", "Dust cloud"]
    style_keywords: string[];      // ["Performance", "Adventure", "Luxury"]
  };

  // Quality Metrics
  quality_score: number;           // 0-10
  integrity_score: number;         // 0-1

  // THE TRINITY (Proprietary Scores)
  physics_score: number;           // 0-10: Motion complexity
  vibe_score: number;              // 0-10: Emotional impact
  logic_score: number;             // 0-10: Narrative clarity

  // Rationale
  scoring_rationale?: {
    physics: string;
    vibe: string;
    logic: string;
  };

  // Director Commentary (3-Beat Pulse)
  director_commentary?: string;

  // Routing Decision
  recommended_style_id?: string;
  recommended_engine?: 'kling' | 'luma';
}
```

### 3.2 Frontend Output (`BrandAnalysisData`)
**File:** `src/server/utils/visionAdapter.ts`

```typescript
interface BrandAnalysisData {
  jobId: string;
  imageUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';

  brandIdentity: {
    colors: string[];
    typography?: string;
    mood: string;
    industry?: string;
  };

  composition: {
    layout: string;
    focalPoints: string[];
    styleKeywords: string[];
  };

  quality: {
    score: number;
    integrity: number;
  };

  // NEW: Proprietary Scores
  proprietaryScores?: {
    physics: number;
    vibe: number;
    logic: number;
    rationale?: { physics: string; vibe: string; logic: string; };
  };

  // NEW: Director Commentary
  directorCommentary?: string;

  // NEW: Engine Recommendation
  recommendedEngine?: 'kling' | 'luma';

  recommendedStyleId?: string;
  createdAt: Date;
  processedAt?: Date;
}
```

---

## 4. SCORING MATRIX LOGIC

### 4.1 The Trinity Scores

| Score | Range | Measures | High Score Examples |
|-------|-------|----------|---------------------|
| **Physics** | 0-10 | Motion complexity, dynamic potential | Cars, explosions, water, fire, sports |
| **Vibe** | 0-10 | Emotional impact, aesthetic appeal | Cinematic lighting, luxury, art |
| **Logic** | 0-10 | Narrative clarity, message coherence | Clear CTA, product focus, brand story |

### 4.2 Engine Routing Algorithm

```
IF physics_score > vibe_score THEN
    recommended_engine = "kling"    // Realistic motion engine
ELSE
    recommended_engine = "luma"     // Aesthetic/emotional engine
END IF
```

### 4.3 Decision Matrix

```
                    VIBE LOW (0-5)         VIBE HIGH (6-10)
                ┌─────────────────────┬─────────────────────┐
PHYSICS HIGH    │  KLING              │  KLING (if P > V)   │
(6-10)          │  (Pure Motion)      │  LUMA  (if V >= P)  │
                ├─────────────────────┼─────────────────────┤
PHYSICS LOW     │  LUMA               │  LUMA               │
(0-5)           │  (Functional)       │  (Pure Aesthetic)   │
                └─────────────────────┴─────────────────────┘
```

---

## 5. DIRECTOR COMMENTARY FORMAT

### 5.1 The 3-Beat Pulse Structure

```
👀 Vision: [What's the subject? Max 15 words.]
🛡️ Safety: [What must we protect? Max 15 words.]
✨ The Magic: [Why this engine? What feeling? Max 15 words.]
```

### 5.2 Tone Guidelines

**FORBIDDEN WORDS:**
- resonance, paramount, juxtaposition, utilize, exemplify
- articulate, profound, decisively, brilliantly

**REQUIRED TONE:**
- Simple English
- Short, punchy sentences
- Creative partner voice (not robotic)
- Goal: User thinks "Yes, that's exactly what I want"

### 5.3 Example Output

```
👀 Vision: White luxury car powers through dirt, kicking up dust.
🛡️ Safety: Preserve the BMW brand, car detail, and dynamic dust flow.
✨ The Magic: Luma brings the raw power and adventurous vibe to life.
```

---

## 6. DATA FLOW DIAGRAM

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   UPLOAD    │     │   STORAGE   │     │   GEMINI    │     │  DATABASE   │
│  (Frontend) │────▶│  (Supabase) │────▶│   (AI)      │────▶│ (Postgres)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │                   │
      │                    │                   │                   │
      ▼                    ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Base64 File │     │ Public URL  │     │ JSON Output │     │ JSONB +     │
│ + Metadata  │     │             │     │ (Trinity +  │     │ Denormalized│
│             │     │             │     │  Commentary)│     │ Scores      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                  │
                                                                  │
                                              ┌───────────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │  FRONTEND   │
                                        │  (Adapter)  │
                                        └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │ BrandData + │
                                        │ Scores +    │
                                        │ Commentary  │
                                        └─────────────┘
```

---

## 7. TEST RESULTS

### 7.1 Evaluation Matrix Results (Latest Run)

| Test Case | Image | Physics | Vibe | Logic | Engine | Expected | Result |
|-----------|-------|---------|------|-------|--------|----------|--------|
| Physics | BMW Race Car | 7.0 | 8.0 | 7.5 | luma | physics | ❌ |
| Vibe | Starry Night | 6.5 | 9.0 | 7.0 | luma | vibe | ✅ |
| Logic | Stop Sign | 6.5 | 6.0 | 7.5 | kling | logic | ✅ |

**Pass Rate:** 2/3 (67%)

### 7.2 Director Soul Test Results

```
✅ Vision Beat (👀):  FOUND
✅ Safety Beat (🛡️):  FOUND
✅ Magic Beat (✨):   FOUND

🎉 TONE CHECK: PASSED
```

---

## 8. FILES MODIFIED

| File | Changes |
|------|---------|
| `src/types/index.ts` | Added `scoring_rationale`, `director_commentary` to `GeminiAnalysisOutput` |
| `src/server/services/vision.ts` | New prompt with 3-Beat format, JSON sanitization, model upgrade to `gemini-2.5-flash` |
| `src/server/visionRouter.ts` | Denormalized score persistence |
| `src/server/utils/visionAdapter.ts` | Added `proprietaryScores`, `directorCommentary`, `recommendedEngine` to frontend output |

---

## 9. RECOMMENDATIONS

### 9.1 Immediate
1. ✅ **DONE** - Implement 3-Beat Director Commentary
2. ✅ **DONE** - Add tone guidelines to prevent academic language
3. ✅ **DONE** - Create evaluation scripts for CI/CD

### 9.2 Future Enhancements
1. **Score Calibration** - Tune physics detection for action shots (currently biased toward vibe)
2. **A/B Testing** - Compare kling vs luma output quality per score range
3. **User Feedback Loop** - Allow users to rate commentary helpfulness

---

## 10. APPROVAL

| Role | Status | Date |
|------|--------|------|
| Developer | ✅ Complete | Dec 2025 |
| CTO Review | ⏳ Pending | - |
| QA Sign-off | ⏳ Pending | - |

---

**End of Document**
