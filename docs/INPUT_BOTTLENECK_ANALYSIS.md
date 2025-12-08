# Input Bottleneck Analysis
## Cultural DNA → Director Interpretation → Decision Making Flow

**Date:** December 8, 2025
**Purpose:** Identify and resolve input bottlenecks before Cultural DNA can animate Directors

---

## 1. CURRENT DATA FLOW (Bottlenecks Identified)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CURRENT FLOW (WITH BOTTLENECKS)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER INPUT LAYER                                                            │
│  ═══════════════                                                             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ❌ BOTTLENECK 1: No Cultural Context Capture                        │   │
│  │                                                                       │   │
│  │  BrandContextForm.tsx                                                 │   │
│  │  - productInfo (English placeholder)                                  │   │
│  │  - sellingPoints (English placeholder)                                │   │
│  │  - targetAudience (English placeholder)                               │   │
│  │  - NO language field                                                  │   │
│  │  - NO region field                                                    │   │
│  │  - NO cultural context                                                │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│       │                                                                      │
│       ▼                                                                      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ❌ BOTTLENECK 2: brandContext String Only (No Structure)            │   │
│  │                                                                       │   │
│  │  vision.ts:191                                                        │   │
│  │  analyzeRawPixels(imageUrl: string, brandContext?: string)           │   │
│  │                                                                       │   │
│  │  Problem: brandContext is just a string, not a structured object     │   │
│  │  - No language indicator                                              │   │
│  │  - No region indicator                                                │   │
│  │  - THE EYE can't know what cultural lens to apply                     │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│       │                                                                      │
│       ▼                                                                      │
│                                                                              │
│  THE EYE (Gemini Analysis)                                                   │
│  ═════════════════════════                                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ❌ BOTTLENECK 3: RAW_ANALYSIS_PROMPT is Culture-Blind               │   │
│  │                                                                       │   │
│  │  vision.ts:55-106                                                     │   │
│  │  - Prompt is English-only                                             │   │
│  │  - No cultural context injection                                      │   │
│  │  - Scoring criteria are Western-centric                               │   │
│  │    - "luxury" = Western luxury codes                                  │   │
│  │    - "premium" = Western premium signals                              │   │
│  │                                                                       │   │
│  │  Example Issue:                                                       │   │
│  │  Chinese brand with 红色 (red) = prosperity                          │   │
│  │  THE EYE might score it as "aggressive" (Western interpretation)     │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│       │                                                                      │
│       ▼                                                                      │
│                                                                              │
│  THE VOICE (Director Pitch)                                                  │
│  ══════════════════════════                                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ❌ BOTTLENECK 4: Director Prompt has No Cultural Layer              │   │
│  │                                                                       │   │
│  │  vision.ts:112-176                                                    │   │
│  │  buildDirectorPitchPrompt(director, rawAnalysis)                     │   │
│  │                                                                       │   │
│  │  Missing parameter: culturalContext                                   │   │
│  │                                                                       │   │
│  │  Currently:                                                           │   │
│  │  - Uses director.voice.vocabulary (English words)                     │   │
│  │  - Uses director.voice.tone (English description)                     │   │
│  │  - systemPromptModifier is English-only                               │   │
│  │                                                                       │   │
│  │  Needed:                                                              │   │
│  │  - Cultural voice overlay from DIRECTOR_CULTURAL_VOICES              │   │
│  │  - Language-appropriate vocabulary                                    │   │
│  │  - Region-specific idioms                                             │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│       │                                                                      │
│       ▼                                                                      │
│                                                                              │
│  OUTPUT (Decision + Commentary)                                              │
│  ══════════════════════════════                                              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ❌ BOTTLENECK 5: Output is Always English                           │   │
│  │                                                                       │   │
│  │  DirectorPitch object:                                                │   │
│  │  - three_beat_pulse: { vision, safety, magic } → English             │   │
│  │  - director_commentary → English                                      │   │
│  │  - scene_board descriptions → English                                 │   │
│  │                                                                       │   │
│  │  UI receives English, displays English, even for China user          │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. REQUIRED INPUT: CulturalContextInput

To resolve all 5 bottlenecks, we need a **single structured input** that flows through the entire pipeline:

```typescript
/**
 * CulturalContextInput
 *
 * The unified cultural signal that flows from User → THE EYE → THE VOICE → UI
 * Solves all 5 bottlenecks with one type.
 */
interface CulturalContextInput {
  // ═══════════════════════════════════════════════════════════════════
  // DETECTION (Auto or Manual)
  // ═══════════════════════════════════════════════════════════════════

  /** Detected/selected language code */
  language: SupportedLanguage;  // 'en' | 'zh-CN' | 'zh-TW' | 'ms'

  /** Cultural region (affects interpretation, not just translation) */
  region: CulturalRegion;  // 'western' | 'china' | 'malaysia' | 'taiwan' | 'sea'

  /** How was this context determined? */
  source: 'auto_browser' | 'auto_ip' | 'user_explicit' | 'url_param' | 'default';

  /** Confidence in detection (0-1) */
  confidence: number;

  // ═══════════════════════════════════════════════════════════════════
  // CULTURAL SIGNALS (Affect THE EYE interpretation)
  // ═══════════════════════════════════════════════════════════════════

  /** Cultural color meanings (overrides Western defaults) */
  colorSemantics?: {
    red?: 'prosperity' | 'danger' | 'passion';  // China: prosperity
    white?: 'purity' | 'mourning' | 'clean';     // China: mourning
    gold?: 'wealth' | 'premium' | 'sacred';      // Universal: wealth
  };

  /** Industry terminology mapping */
  industryLocalization?: {
    wellness?: string;  // '养生' (yangsheng) vs 'wellness'
    luxury?: string;    // '奢华' vs 'luxury'
    tech?: string;      // '科技' vs 'tech'
  };

  // ═══════════════════════════════════════════════════════════════════
  // UI PREFERENCES (Affect output formatting)
  // ═══════════════════════════════════════════════════════════════════

  /** Output language for commentary */
  outputLanguage: SupportedLanguage;

  /** Emoji style preference */
  emojiStyle: 'full' | 'minimal' | 'none';

  /** Formality level */
  formality: 'casual' | 'professional' | 'formal';
}

type SupportedLanguage = 'en' | 'zh-CN' | 'zh-TW' | 'ms' | 'id';
type CulturalRegion = 'western' | 'china' | 'malaysia' | 'taiwan' | 'sea';
```

---

## 3. BOTTLENECK RESOLUTION MAP

### Bottleneck 1: No Cultural Context Capture

**Current:** BrandContextForm has no cultural fields
**Solution:** Add CulturalContextInput detection at form mount

```typescript
// BrandContextForm.tsx - Add auto-detection
useEffect(() => {
  const culturalContext = detectCulturalContext();
  setCulturalContext(culturalContext);
  // Also update form labels/placeholders based on language
}, []);
```

### Bottleneck 2: brandContext is Unstructured String

**Current:** `analyzeRawPixels(imageUrl, brandContext?: string)`
**Solution:** New signature with structured input

```typescript
// vision.ts - New signature
interface AnalysisInput {
  imageUrl: string;
  brandContext?: BrandContext;        // Structured form data
  culturalContext: CulturalContextInput;  // Cultural signals
}

export async function analyzeRawPixels(input: AnalysisInput): Promise<RawPixelAnalysis>
```

### Bottleneck 3: RAW_ANALYSIS_PROMPT is Culture-Blind

**Current:** Single English prompt with Western scoring criteria
**Solution:** Culturally-aware prompt builder

```typescript
function buildCulturalAnalysisPrompt(culturalContext: CulturalContextInput): string {
  const basePrompt = RAW_ANALYSIS_PROMPT;

  // Inject cultural color semantics
  if (culturalContext.region === 'china') {
    return `${basePrompt}

## CULTURAL CONTEXT
You are analyzing for a Chinese market audience.
- Red (红色) signifies prosperity and good fortune, NOT danger
- White may have mourning associations, use sparingly
- Gold represents wealth and success
- Numbers: 8 is lucky, 4 should be avoided
- Wellness products may relate to Traditional Chinese Medicine concepts (养生)

Adjust your mood and industry assessments accordingly.`;
  }

  if (culturalContext.region === 'malaysia') {
    return `${basePrompt}

## CULTURAL CONTEXT
You are analyzing for a Malaysian market audience.
- Consider both Malay and Chinese cultural codes
- Islamic aesthetics may be relevant (geometric patterns, no figurative imagery)
- Green has positive associations (nature, Islam)
- Halal considerations may affect food/wellness industries

Adjust your mood and industry assessments accordingly.`;
  }

  return basePrompt;  // Western default
}
```

### Bottleneck 4: Director Prompt has No Cultural Layer

**Current:** `buildDirectorPitchPrompt(director, rawAnalysis)`
**Solution:** Add cultural voice overlay

```typescript
function buildDirectorPitchPrompt(
  director: DirectorProfile,
  rawAnalysis: RawPixelAnalysis,
  culturalContext: CulturalContextInput  // NEW PARAMETER
): string {

  // Get cultural voice overlay
  const culturalVoice = DIRECTOR_CULTURAL_VOICES[director.id]?.[culturalContext.region];

  if (culturalVoice) {
    return `You are an AI Brand Analyst with a distinct personality.

## CURRENT PERSONA
${culturalVoice.systemPromptModifier}

## TONE GUIDE (${culturalContext.region.toUpperCase()} VOICE)
Use vocabulary: [${culturalVoice.voice.vocabulary.join(', ')}]
Use idioms: [${culturalVoice.voice.culturalIdioms.join(', ')}]
Avoid: [${culturalVoice.voice.forbidden.join(', ')}]
Speak with: ${culturalVoice.voice.tone}

## OUTPUT LANGUAGE
Respond in: ${culturalContext.outputLanguage}

## YOUR TASK
...`;
  }

  // Fallback to English default
  return buildEnglishDirectorPrompt(director, rawAnalysis);
}
```

### Bottleneck 5: Output is Always English

**Current:** DirectorPitch fields are English strings
**Solution:** LLM generates in target language based on culturalContext.outputLanguage

```typescript
// The prompt already tells LLM to respond in outputLanguage
// Example output for China user:

{
  "three_beat_pulse": {
    "vision": "如水墨画般，意境深远",  // Chinese
    "safety": "保护这份空灵与神韵",    // Chinese
    "magic": "Luma引擎将让诗意流淌"   // Chinese + Engine name
  },
  "scene_board": {
    "start": {
      "time": "0秒",                   // Localized time format
      "visual": "产品缓缓浮现...",      // Chinese
      "camera": "静态镜头"             // Chinese
    }
  }
}
```

---

## 4. COMPLETE FLOW (AFTER FIX)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     RESOLVED FLOW (WITH CULTURAL DNA)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER INPUT LAYER                                                            │
│  ═══════════════                                                             │
│                                                                              │
│  1. Page Load → detectCulturalContext()                                     │
│     ├── Check localStorage (user preference)                                 │
│     ├── Check URL params (?lang=zh-CN)                                       │
│     ├── Check navigator.language                                             │
│     └── Fallback: 'en' + 'western'                                          │
│                                                                              │
│  2. CulturalContextInput Created                                            │
│     {                                                                        │
│       language: 'zh-CN',                                                     │
│       region: 'china',                                                       │
│       source: 'auto_browser',                                                │
│       confidence: 0.9,                                                       │
│       colorSemantics: { red: 'prosperity' },                                 │
│       outputLanguage: 'zh-CN',                                               │
│       formality: 'professional'                                              │
│     }                                                                        │
│                                                                              │
│  3. BrandContextForm Renders with Chinese Labels                            │
│     ├── "品牌背景" (not "Brand Context")                                     │
│     ├── "产品信息" (not "Product Information")                               │
│     └── Chinese placeholder examples                                         │
│                                                                              │
│       │                                                                      │
│       ▼                                                                      │
│                                                                              │
│  THE EYE (Gemini Analysis)                                                   │
│  ═════════════════════════                                                   │
│                                                                              │
│  4. analyzeRawPixels({ imageUrl, brandContext, culturalContext })           │
│     ├── buildCulturalAnalysisPrompt(culturalContext)                        │
│     │   └── "Red signifies prosperity..." injected                           │
│     └── Gemini analyzes WITH cultural awareness                             │
│                                                                              │
│  5. RawPixelAnalysis (Culture-Aware)                                        │
│     {                                                                        │
│       brand_attributes: {                                                    │
│         mood: "prosperous and auspicious",  // Not "aggressive"             │
│         industry: "养生健康"                // Chinese industry term          │
│       },                                                                     │
│       physics_score: 7.5,  // Objective, unchanged                          │
│       vibe_score: 8.0,     // Objective, unchanged                          │
│       logic_score: 7.0     // Objective, unchanged                          │
│     }                                                                        │
│                                                                              │
│       │                                                                      │
│       ▼                                                                      │
│                                                                              │
│  THE VOICE (Director Pitch)                                                  │
│  ══════════════════════════                                                  │
│                                                                              │
│  6. generateDirectorPitch(rawAnalysis, 'visionary', culturalContext)        │
│     ├── Get cultural voice: DIRECTOR_CULTURAL_VOICES['visionary']['china'] │
│     │   {                                                                    │
│     │     tone: '诗意, 意境, 空灵',                                          │
│     │     idioms: ['意在画外', '气韵生动'],                                   │
│     │     systemPrompt: '你是一位诗意画家...'                                │
│     │   }                                                                    │
│     │                                                                        │
│     └── LLM generates pitch in Chinese with cultural voice                  │
│                                                                              │
│  7. DirectorPitch (Chinese Output)                                          │
│     {                                                                        │
│       director_id: 'visionary',                                              │
│       three_beat_pulse: {                                                    │
│         vision: "如水墨画般，意境深远",                                       │
│         safety: "保护这份空灵与神韵",                                         │
│         magic: "Luma引擎将让诗意流淌"                                        │
│       },                                                                     │
│       biased_scores: { physics: 5.5, vibe: 9.8, logic: 6.5 },  // Math same│
│       recommended_engine: 'luma'  // Decision unchanged                     │
│     }                                                                        │
│                                                                              │
│       │                                                                      │
│       ▼                                                                      │
│                                                                              │
│  OUTPUT (Interactive Commentary)                                             │
│  ═══════════════════════════════                                             │
│                                                                              │
│  8. TheLounge.tsx Displays Chinese Pitch                                    │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  🎨 愿景大师                                                     │     │
│     │  "意在画外，境生象外。"                                          │     │
│     │                                                                  │     │
│     │  👀 视野: 如水墨画般，意境深远                                   │     │
│     │  🛡️ 安全: 保护这份空灵与神韵                                     │     │
│     │  ✨ 魔力: Luma引擎将让诗意流淌                                   │     │
│     │                                                                  │     │
│     │  推荐引擎: Luma (美学优先)                                       │     │
│     │                                                                  │     │
│     │  [ 选择愿景大师 ]                                                │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. IMPLEMENTATION ORDER

### Phase 1: Create Type System (Foundation)

```
src/types/cultural.ts
├── CulturalContextInput
├── SupportedLanguage
├── CulturalRegion
└── ColorSemantics
```

### Phase 2: Create Detection Utility

```
src/config/cultural/detection.ts
├── detectCulturalContext()
├── detectFromBrowser()
├── detectFromURL()
└── storeCulturalPreference()
```

### Phase 3: Create Cultural Voice Registry

```
src/config/cultural/directorVoices.ts
├── DIRECTOR_CULTURAL_VOICES
├── DIRECTOR_NAMES
└── getCulturalVoice(directorId, region)
```

### Phase 4: Update Vision Service

```
src/server/services/vision.ts
├── buildCulturalAnalysisPrompt()  // NEW
├── analyzeRawPixels()             // MODIFIED - add culturalContext param
├── buildDirectorPitchPrompt()     // MODIFIED - add cultural voice
└── generateDirectorPitch()        // MODIFIED - pass cultural context
```

### Phase 5: Update Frontend

```
src/client/components/
├── BrandContextForm.tsx           // Add cultural detection
├── lounge/TheLounge.tsx           // Pass cultural context to API
└── CulturalLanguageSwitcher.tsx   // NEW - manual override
```

---

## 6. KEY INSIGHT

> **The bottleneck is not translation. The bottleneck is INPUT CONTEXT.**
>
> Without `CulturalContextInput`, the system cannot:
> 1. Know what language to display forms in
> 2. Know how to interpret color/imagery meanings
> 3. Know what voice/idioms the Director should use
> 4. Know what language to generate output in
>
> Once `CulturalContextInput` flows through the pipeline, everything downstream adapts automatically.

---

## 7. NEXT STEP

**Implement Phase 1: Create Type System**

Create `src/types/cultural.ts` with `CulturalContextInput` and related types.

This is the **foundation** - all other changes depend on this type existing.

---

**Document Status:** APPROVED
**Ready to Implement:** Yes
**First File:** `src/types/cultural.ts`

