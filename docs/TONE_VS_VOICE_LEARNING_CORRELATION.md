# Tone vs Voice: Learning Correlation Scheme
## Fine-Tuning Cultural Voice Over Time

**Date:** December 8, 2025
**Risk Identified:** Poorly expressed BrandContextForm → Mangled Cultural Voice → Bad Brand Content Output
**Goal:** Define Tone ⊂ Voice relationship + Learning events for correction + Over-engineering verification

---

## 1. VOICE VS TONE HIERARCHY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VOICE ⊃ TONE RELATIONSHIP                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                           VOICE (Container)                            ║  │
│  ║  ═══════════════════════════════════════════════════════════════════  ║  │
│  ║                                                                        ║  │
│  ║  Definition: The COMPLETE linguistic identity of a Director            ║  │
│  ║  Stability: SEMI-STATIC (changes only when region changes)             ║  │
│  ║                                                                        ║  │
│  ║  Components:                                                           ║  │
│  ║  ┌───────────────────────────────────────────────────────────────┐    ║  │
│  ║  │  vocabulary: string[]     ← Word bank (static per region)     │    ║  │
│  ║  │  culturalIdioms: string[] ← Fixed expressions (static)        │    ║  │
│  ║  │  forbidden: string[]      ← Never-use words (static)          │    ║  │
│  ║  │                                                                │    ║  │
│  ║  │  ┌─────────────────────────────────────────────────────────┐  │    ║  │
│  ║  │  │             TONE (Dynamic Subset)                       │  │    ║  │
│  ║  │  │  ═══════════════════════════════════════════════════   │  │    ║  │
│  ║  │  │                                                         │  │    ║  │
│  ║  │  │  Definition: HOW the Voice is EXPRESSED in context      │  │    ║  │
│  ║  │  │  Stability: DYNAMIC (adapts per interaction)            │  │    ║  │
│  ║  │  │                                                         │  │    ║  │
│  ║  │  │  Components:                                            │  │    ║  │
│  ║  │  │  • formality: 'casual' | 'professional' | 'formal'      │  │    ║  │
│  ║  │  │  • intensity: 0.0 - 1.0 (subdued ↔ emphatic)            │  │    ║  │
│  ║  │  │  • warmth: 0.0 - 1.0 (clinical ↔ friendly)              │  │    ║  │
│  ║  │  │  • confidence: 0.0 - 1.0 (tentative ↔ assertive)        │  │    ║  │
│  ║  │  │                                                         │  │    ║  │
│  ║  │  │  Affected by:                                           │  │    ║  │
│  ║  │  │  • BrandContext.targetAudience                          │  │    ║  │
│  ║  │  │  • Brand industry (wellness = warmer tone)              │  │    ║  │
│  ║  │  │  • User interaction history (learning)                  │  │    ║  │
│  ║  │  │                                                         │  │    ║  │
│  ║  │  └─────────────────────────────────────────────────────────┘  │    ║  │
│  ║  └───────────────────────────────────────────────────────────────┘    ║  │
│  ║                                                                        ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. HOW TONE CHANGES ALTER CULTURAL VOICE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TONE MODULATION EFFECTS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  EXAMPLE: Visionary Director + China Region                                  │
│  ════════════════════════════════════════════                                │
│                                                                              │
│  BASE VOICE (Static):                                                        │
│  • vocabulary: ['意境', '神韵', '空灵', '留白', '禅意']                       │
│  • idioms: ['意在画外', '气韵生动', '大象无形']                               │
│  • forbidden: ['技术', '计算', '精确']                                       │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  TONE VARIATION A: Formal + High Intensity                                   │
│  ─────────────────────────────────────────                                   │
│  { formality: 'formal', intensity: 0.9, warmth: 0.3, confidence: 0.9 }      │
│                                                                              │
│  OUTPUT:                                                                     │
│  "此品牌意境深远，气韵非凡。本视觉方案将以留白构图，                          │
│   彰显大象无形之美。Luma引擎必将完美呈现这份神韵。"                           │
│                                                                              │
│  Characteristics:                                                            │
│  • Uses formal pronouns (此, 本)                                             │
│  • Declarative statements (必将)                                             │
│  • Less emotional warmth                                                     │
│  • High certainty language                                                   │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  TONE VARIATION B: Casual + High Warmth                                      │
│  ─────────────────────────────────────                                       │
│  { formality: 'casual', intensity: 0.5, warmth: 0.9, confidence: 0.6 }      │
│                                                                              │
│  OUTPUT:                                                                     │
│  "哇，这个品牌感觉很有意境呢！我想用留白的方式来表达，                        │
│   让它有那种'大象无形'的感觉。Luma应该能很好地呈现这种神韵～"                 │
│                                                                              │
│  Characteristics:                                                            │
│  • Casual interjections (哇, 呢, ～)                                         │
│  • Softer suggestions (我想, 应该能)                                         │
│  • Warmer, conversational                                                    │
│  • Less certainty, more collaborative                                        │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  TONE VARIATION C: Professional + Balanced                                   │
│  ────────────────────────────────────────                                    │
│  { formality: 'professional', intensity: 0.7, warmth: 0.6, confidence: 0.8 }│
│                                                                              │
│  OUTPUT:                                                                     │
│  "这个品牌展现出独特的意境美感。建议采用留白构图策略，                        │
│   以'气韵生动'的方式呈现品牌神韵。推荐使用Luma引擎。"                        │
│                                                                              │
│  Characteristics:                                                            │
│  • Professional vocabulary (展现, 策略, 推荐)                                │
│  • Balanced warmth                                                           │
│  • Clear recommendations                                                     │
│  • Moderately confident                                                      │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  KEY INSIGHT:                                                                │
│  ───────────                                                                 │
│  Voice (vocabulary, idioms) = CONSTANT                                       │
│  Tone (formality, warmth) = VARIABLE                                         │
│                                                                              │
│  Same words ('意境', '留白', 'Luma'), different EXPRESSION.                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. TONE DERIVATION FROM BRAND CONTEXT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               BRAND CONTEXT INPUT → TONE DERIVATION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BrandContext (User Input)          Derived Tone Parameters                  │
│  ═════════════════════════          ════════════════════════                 │
│                                                                              │
│  targetAudience: "35-55岁企业高管"                                           │
│       │                                                                      │
│       ├── Contains: 企业高管 (executives)                                    │
│       │       └── formality: 'formal' (+0.3)                                │
│       │                                                                      │
│       ├── Contains: 35-55岁 (middle-aged)                                   │
│       │       └── warmth: 0.5 (balanced)                                    │
│       │                                                                      │
│       └── Inferred: Professional decision-makers                            │
│               └── confidence: 0.8 (assertive recommendations)               │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  targetAudience: "年轻妈妈群体，注重宝宝健康"                                 │
│       │                                                                      │
│       ├── Contains: 年轻妈妈 (young mothers)                                 │
│       │       └── warmth: 0.9 (+0.4)                                        │
│       │                                                                      │
│       ├── Contains: 宝宝 (baby)                                              │
│       │       └── intensity: 0.4 (gentler)                                  │
│       │                                                                      │
│       └── Inferred: Emotional, caring audience                              │
│               └── formality: 'casual' (approachable)                        │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  industry: "养生健康" (wellness)                                             │
│       │                                                                      │
│       └── Default tone adjustments:                                         │
│           ├── warmth: +0.2 (wellness = caring)                              │
│           ├── intensity: -0.1 (calm, not aggressive)                        │
│           └── formality: 'professional' (trust-building)                    │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  ⚠️ RISK: Poorly Expressed BrandContext                                     │
│  ────────────────────────────────────────                                    │
│                                                                              │
│  BAD INPUT: targetAudience: "人" (just "people")                            │
│       │                                                                      │
│       └── PROBLEM: No tone signals derivable                                │
│           └── Fallback: Default tone (may mismatch brand)                   │
│                                                                              │
│  BAD INPUT: targetAudience: "asfasdfasdf" (gibberish)                       │
│       │                                                                      │
│       └── PROBLEM: No semantic meaning                                      │
│           └── Fallback: Default tone + WARNING flag                         │
│                                                                              │
│  BAD INPUT: Mixed languages without context                                  │
│       │                                                                      │
│       └── PROBLEM: Language mismatch                                        │
│           └── Risk: Mangled output tone                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. LEARNING EVENT CORRELATION SCHEME

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LEARNING EVENT FOR TONE FINE-TUNING                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                    ToneLearningEvent                                   ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                        ║  │
│  ║  // ─────────────────────────────────────────────────────────────     ║  │
│  ║  // CONTEXT (What was the situation?)                                 ║  │
│  ║  // ─────────────────────────────────────────────────────────────     ║  │
│  ║                                                                        ║  │
│  ║  userId: string;                                                       ║  │
│  ║  jobId: string;                                                        ║  │
│  ║                                                                        ║  │
│  ║  culturalContext: {                                                    ║  │
│  ║    language: SupportedLanguage;                                        ║  │
│  ║    region: CulturalRegion;                                             ║  │
│  ║  };                                                                    ║  │
│  ║                                                                        ║  │
│  ║  brandContext: {                                                       ║  │
│  ║    targetAudience: string;      // Original input                      ║  │
│  ║    industry: string;            // Detected/provided                   ║  │
│  ║    inputQuality: 'good' | 'sparse' | 'gibberish';  // Auto-assessed   ║  │
│  ║  };                                                                    ║  │
│  ║                                                                        ║  │
│  ║  // ─────────────────────────────────────────────────────────────     ║  │
│  ║  // TONE PRESENTED (What tone did we use?)                            ║  │
│  ║  // ─────────────────────────────────────────────────────────────     ║  │
│  ║                                                                        ║  │
│  ║  presentedTone: {                                                      ║  │
│  ║    formality: FormalityLevel;                                          ║  │
│  ║    intensity: number;           // 0-1                                 ║  │
│  ║    warmth: number;              // 0-1                                 ║  │
│  ║    confidence: number;          // 0-1                                 ║  │
│  ║  };                                                                    ║  │
│  ║                                                                        ║  │
│  ║  directorId: string;            // Which director                      ║  │
│  ║  outputSample: string;          // First 200 chars of pitch           ║  │
│  ║                                                                        ║  │
│  ║  // ─────────────────────────────────────────────────────────────     ║  │
│  ║  // USER RESPONSE (How did user react?)                               ║  │
│  ║  // ─────────────────────────────────────────────────────────────     ║  │
│  ║                                                                        ║  │
│  ║  userAction: 'selected' | 'skipped' | 'edited' | 'regenerated';       ║  │
│  ║                                                                        ║  │
│  ║  // If edited, what changed?                                           ║  │
│  ║  editSignals?: {                                                       ║  │
│  ║    madeMoreFormal: boolean;     // User formalized the output         ║  │
│  ║    madeMoreCasual: boolean;     // User casualized the output         ║  │
│  ║    madeWarmer: boolean;         // User added warmth                  ║  │
│  ║    madeColder: boolean;         // User removed warmth                ║  │
│  ║    changedLanguage: boolean;    // User switched language             ║  │
│  ║  };                                                                    ║  │
│  ║                                                                        ║  │
│  ║  // Time-based signals                                                 ║  │
│  ║  timeToDecision: number;        // ms from pitch display to action    ║  │
│  ║  dwellTime: number;             // ms viewing this director's pitch   ║  │
│  ║                                                                        ║  │
│  ║  // ─────────────────────────────────────────────────────────────     ║  │
│  ║  // COMPUTED LEARNING DELTA                                           ║  │
│  ║  // ─────────────────────────────────────────────────────────────     ║  │
│  ║                                                                        ║  │
│  ║  learningDelta: {                                                      ║  │
│  ║    // Should we adjust tone for this context?                         ║  │
│  ║    formalityAdjust: number;     // -1.0 to +1.0                       ║  │
│  ║    warmthAdjust: number;        // -1.0 to +1.0                       ║  │
│  ║    intensityAdjust: number;     // -1.0 to +1.0                       ║  │
│  ║    confidenceAdjust: number;    // -1.0 to +1.0                       ║  │
│  ║                                                                        ║  │
│  ║    // Was this a mismatch?                                             ║  │
│  ║    toneMismatch: boolean;                                              ║  │
│  ║    likelyReason: 'poor_input' | 'wrong_region' | 'wrong_tone' | null; ║  │
│  ║  };                                                                    ║  │
│  ║                                                                        ║  │
│  ║  createdAt: Date;                                                      ║  │
│  ║                                                                        ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. LEARNING CORRELATION FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TONE LEARNING CORRELATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER INTERACTION                                                            │
│  ═════════════════                                                           │
│                                                                              │
│  1. User submits BrandContext                                                │
│       │  { targetAudience: "年轻妈妈", industry: "母婴用品" }                │
│       │                                                                      │
│       ▼                                                                      │
│  2. System derives Tone                                                      │
│       │  { formality: 'casual', warmth: 0.9, intensity: 0.4 }               │
│       │                                                                      │
│       ▼                                                                      │
│  3. System generates Director pitches (with derived tone)                    │
│       │  Visionary (China + casual + warm tone):                            │
│       │  "这个品牌给人一种温暖的感觉呢～"                                     │
│       │                                                                      │
│       ▼                                                                      │
│  4. User SKIPS Visionary, selects Newtonian instead                         │
│       │                                                                      │
│       ▼                                                                      │
│  5. ToneLearningEvent captured:                                             │
│       {                                                                      │
│         userAction: 'skipped',                                               │
│         presentedTone: { formality: 'casual', warmth: 0.9 },                │
│         learningDelta: {                                                     │
│           warmthAdjust: -0.2,   // User prefers less warmth                 │
│           toneMismatch: true,                                                │
│           likelyReason: 'wrong_tone'                                         │
│         }                                                                    │
│       }                                                                      │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  AGGREGATION OVER TIME                                                       │
│  ═════════════════════                                                       │
│                                                                              │
│  After N interactions with similar brandContext:                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Context Pattern: { region: 'china', industry: '母婴' }             │    │
│  │                                                                      │    │
│  │  Aggregated Adjustments:                                            │    │
│  │  • warmthAdjust: -0.15 (avg of 5 events)                            │    │
│  │  • formalityAdjust: +0.1 (avg of 5 events)                          │    │
│  │                                                                      │    │
│  │  Learned Tone Override:                                             │    │
│  │  When (region = 'china' AND industry = '母婴'):                     │    │
│  │    warmth = derivedWarmth - 0.15                                    │    │
│  │    formality = derivedFormality + 0.1                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  NEXT SIMILAR BRAND                                                          │
│  ══════════════════                                                          │
│                                                                              │
│  New user, similar context:                                                  │
│  { region: 'china', targetAudience: "准妈妈", industry: "母婴" }            │
│                                                                              │
│  System applies learned adjustments:                                         │
│  • Base derivation: warmth: 0.9, formality: 'casual'                        │
│  • After learning: warmth: 0.75, formality: 'professional'                  │
│                                                                              │
│  Result: More appropriate tone for this demographic                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. JOINT OUTPUT VERIFICATION TEST

**Purpose:** Determine if Cultural DNA (Dynamic) + Brand DNA (Static) produces valid output, and detect over-engineering.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OVER-ENGINEERING VERIFICATION TEST                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TEST NAME: Joint Cultural-Brand DNA Output Verification                     │
│  ════════════════════════════════════════════════════════                    │
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  TEST MATRIX                                                           ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                        ║  │
│  ║  Inputs:                                                               ║  │
│  ║  • Brand DNA (Static): RawPixelAnalysis from THE EYE                   ║  │
│  ║  • Cultural DNA (Dynamic): CulturalContextInput                        ║  │
│  ║                                                                        ║  │
│  ║  Output:                                                               ║  │
│  ║  • CulturalDirectorPitch                                               ║  │
│  ║                                                                        ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  TEST 1: STATIC INVARIANCE TEST                                             │
│  ────────────────────────────────                                            │
│  Question: Does changing Cultural DNA alter Brand DNA outputs?               │
│                                                                              │
│  Procedure:                                                                  │
│  1. Fix Brand DNA (same image, same BrandContext)                           │
│  2. Vary Cultural DNA (western → china → malaysia)                          │
│  3. Compare outputs                                                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  EXPECTED RESULTS:                                                   │    │
│  │                                                                       │    │
│  │  ✅ MUST BE IDENTICAL:                                               │    │
│  │  • biased_scores.physics                                             │    │
│  │  • biased_scores.vibe                                                │    │
│  │  • biased_scores.logic                                               │    │
│  │  • recommended_engine                                                │    │
│  │  • risk_level                                                        │    │
│  │                                                                       │    │
│  │  ✅ MUST BE DIFFERENT:                                               │    │
│  │  • director_name (localized)                                         │    │
│  │  • quote (localized)                                                 │    │
│  │  • three_beat_pulse.* (language/idioms)                              │    │
│  │  • scene_board descriptions (language)                               │    │
│  │                                                                       │    │
│  │  ❌ IF DIFFERENT (FAILURE):                                          │    │
│  │  • biased_scores changed by cultural context                         │    │
│  │  • recommended_engine changed by language                            │    │
│  │  → OVER-ENGINEERING: Cultural layer is bleeding into Brand logic     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  TEST 2: VOICE-TONE SEPARATION TEST                                         │
│  ────────────────────────────────────                                        │
│  Question: Does changing Tone alter Voice vocabulary?                        │
│                                                                              │
│  Procedure:                                                                  │
│  1. Fix Cultural DNA (china)                                                │
│  2. Fix Director (visionary)                                                │
│  3. Vary Tone (formal → casual → professional)                              │
│  4. Check vocabulary usage                                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  EXPECTED RESULTS:                                                   │    │
│  │                                                                       │    │
│  │  ✅ MUST BE PRESENT IN ALL OUTPUTS:                                  │    │
│  │  • At least 2 words from voice.vocabulary                            │    │
│  │  • At least 1 idiom from voice.culturalIdioms                        │    │
│  │  • Zero words from voice.forbidden                                   │    │
│  │                                                                       │    │
│  │  ✅ MUST VARY:                                                       │    │
│  │  • Sentence structure (formal: 此/本 vs casual: 呢/～)               │    │
│  │  • Punctuation style                                                 │    │
│  │  • Degree of certainty in language                                   │    │
│  │                                                                       │    │
│  │  ❌ IF FAILED:                                                       │    │
│  │  • Vocabulary missing (Voice not applied)                            │    │
│  │  • Forbidden words present (Voice violated)                          │    │
│  │  • Tone unchanged despite parameter change (Tone not working)        │    │
│  │  → BUG: Voice/Tone separation broken                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  TEST 3: INPUT QUALITY DEGRADATION TEST                                     │
│  ────────────────────────────────────────                                    │
│  Question: How does output quality degrade with poor input?                  │
│                                                                              │
│  Procedure:                                                                  │
│  1. Good input: { targetAudience: "35-55岁企业高管" }                       │
│  2. Sparse input: { targetAudience: "人" }                                  │
│  3. Gibberish: { targetAudience: "asdfasdf" }                               │
│  4. Compare output quality                                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  EXPECTED RESULTS:                                                   │    │
│  │                                                                       │    │
│  │  Good Input → Good Output                                            │    │
│  │  • Tone correctly derived                                            │    │
│  │  • Output feels appropriate to audience                              │    │
│  │                                                                       │    │
│  │  Sparse Input → Default Output + Warning                             │    │
│  │  • System uses default tone (professional, 0.5 warmth)               │    │
│  │  • Metadata includes: inputQuality: 'sparse'                         │    │
│  │  • Output is functional but generic                                  │    │
│  │                                                                       │    │
│  │  Gibberish → Fallback Output + Error Flag                            │    │
│  │  • System uses safest defaults                                       │    │
│  │  • Metadata includes: inputQuality: 'gibberish'                      │    │
│  │  • Output is safe but disconnected from brand                        │    │
│  │                                                                       │    │
│  │  ❌ FAILURE MODES:                                                   │    │
│  │  • System crashes on bad input (unhandled)                           │    │
│  │  • Output includes gibberish from input (injection)                  │    │
│  │  • No warning/flag for degraded input                                │    │
│  │  → BUG: Input validation missing                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  TEST 4: OVER-ENGINEERING SMELL TEST                                        │
│  ────────────────────────────────────                                        │
│  Question: Is the Cultural DNA system adding unnecessary complexity?         │
│                                                                              │
│  SMELL INDICATORS:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                       │    │
│  │  🔴 RED FLAGS (Over-Engineered):                                     │    │
│  │                                                                       │    │
│  │  • CulturalContextInput has >10 fields                               │    │
│  │    → Simplify: Most contexts need only language + region             │    │
│  │                                                                       │    │
│  │  • Tone has >4 dimensions                                            │    │
│  │    → Simplify: formality + warmth is usually sufficient              │    │
│  │                                                                       │    │
│  │  • Learning events captured but never used                           │    │
│  │    → Remove: Dead code                                               │    │
│  │                                                                       │    │
│  │  • 50+ lines of tone derivation logic                                │    │
│  │    → Simplify: Use lookup table, not algorithms                      │    │
│  │                                                                       │    │
│  │  • Director pitches take >5s to generate                             │    │
│  │    → Optimize: Cultural layer adds latency                           │    │
│  │                                                                       │    │
│  │  ───────────────────────────────────────────────────────────────    │    │
│  │                                                                       │    │
│  │  🟢 GREEN FLAGS (Right-Sized):                                       │    │
│  │                                                                       │    │
│  │  • CulturalContextInput has 5-7 fields                               │    │
│  │  • Tone derivation is a simple mapping function                      │    │
│  │  • Learning events inform quarterly voice updates                    │    │
│  │  • Cultural layer adds <500ms latency                                │    │
│  │  • 80% of users never change auto-detected settings                  │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. SIMPLIFIED TYPE SYSTEM (Post-Review)

Based on over-engineering test, here's the RIGHT-SIZED type system:

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// PRIMITIVES (Keep minimal)
// ═══════════════════════════════════════════════════════════════════════════

type SupportedLanguage = 'en' | 'zh-CN' | 'zh-TW' | 'ms';  // Only 4, not 5+
type CulturalRegion = 'western' | 'china' | 'malaysia';     // Only 3 active
type FormalityLevel = 'casual' | 'professional' | 'formal';

// ═══════════════════════════════════════════════════════════════════════════
// CULTURAL CONTEXT (6 fields - not 10+)
// ═══════════════════════════════════════════════════════════════════════════

interface CulturalContextInput {
  language: SupportedLanguage;
  region: CulturalRegion;
  source: 'auto' | 'manual';           // Simplified from 5 options
  outputLanguage: SupportedLanguage;
  formality: FormalityLevel;
  warmth: number;                       // 0-1, single warmth dimension
}

// ═══════════════════════════════════════════════════════════════════════════
// VOICE (Static per region) + TONE (Dynamic per context)
// ═══════════════════════════════════════════════════════════════════════════

interface CulturalVoice {
  vocabulary: string[];
  idioms: string[];
  forbidden: string[];
  systemPrompt: string;
  localizedName: string;
  localizedQuote: string;
}

interface DerivedTone {
  formality: FormalityLevel;
  warmth: number;                       // 0-1
}

// ═══════════════════════════════════════════════════════════════════════════
// LEARNING EVENT (Focused on actionable signals)
// ═══════════════════════════════════════════════════════════════════════════

interface ToneLearningEvent {
  // Context
  userId: string;
  region: CulturalRegion;
  industry: string;
  inputQuality: 'good' | 'sparse' | 'gibberish';

  // What we showed
  presentedTone: DerivedTone;
  directorId: string;

  // User response
  action: 'selected' | 'skipped' | 'edited';

  // Learning delta (simple)
  warmthDelta: number;      // -1 to +1
  formalityDelta: number;   // -1 to +1

  timestamp: Date;
}
```

---

## 8. VERIFICATION CHECKLIST

Before implementation, verify:

| Check | Question | Expected |
|-------|----------|----------|
| **Static Invariance** | Do scores change when culture changes? | NO |
| **Voice Application** | Are vocabulary/idioms present in output? | YES |
| **Tone Separation** | Does tone change affect vocabulary? | NO |
| **Input Degradation** | Does bad input crash system? | NO (graceful fallback) |
| **Field Count** | CulturalContextInput fields <= 7? | YES |
| **Latency** | Cultural layer adds <500ms? | YES |
| **Learning Utility** | Are learning events actionable? | YES |

---

## 9. SUMMARY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KEY DISTINCTIONS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  VOICE (Container)                    TONE (Expression)                      │
│  ═════════════════                    ══════════════════                     │
│  • vocabulary                         • formality                            │
│  • idioms                             • warmth                               │
│  • forbidden words                                                           │
│  • systemPrompt                                                              │
│                                                                              │
│  Static per (Director + Region)       Dynamic per (BrandContext + Learning) │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  BRAND DNA (Static)                   CULTURAL DNA (Dynamic)                 │
│  ══════════════════                   ═══════════════════════                │
│  • physics_score                      • language                             │
│  • vibe_score                         • region                               │
│  • logic_score                        • formality                            │
│  • recommended_engine                 • warmth                               │
│                                                                              │
│  From THE EYE (image pixels)          From User (browser/preference)         │
│  NEVER changes based on culture       Adapts voice expression                │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  JOINT OUTPUT = Brand DNA (math) + Cultural DNA (expression)                 │
│                                                                              │
│  If math changes when culture changes → OVER-ENGINEERED (bug)               │
│  If expression doesn't change when culture changes → UNDER-ENGINEERED (bug) │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Document Status:** READY FOR REVIEW
**Key Risk Mitigated:** Poor BrandContext input → Mangled output
**Over-Engineering Detection:** Verification tests defined
**Learning Correlation:** ToneLearningEvent captures fine-tuning signals

