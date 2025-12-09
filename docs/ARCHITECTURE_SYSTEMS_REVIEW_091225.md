# Full Architecture & Systems Review
## Longevity Valley Brand Content Factory

**Date:** December 9, 2025
**Version:** 2.0.0 (Post-Restructure)
**References:** BRAND_FACTORY_GRAND_SCHEME(V2).md, RASHOMON_CULTURAL_DNA_SPEC.md

---

## Executive Summary

This document provides a comprehensive review of the Longevity Valley Brand Content Factory architecture following the December 9, 2025 UI pathway restructure. The system has evolved from a single-flow application to a dual-pathway architecture that separates content creation (Studio) from content deployment (Launchpad).

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### 1.1 Route Structure (Post-Restructure)

```
/ (Hero Landing)
├── /studio       → Full Director Experience (renamed from /lounge)
│   ├── Upload brand assets
│   ├── 4 Rashomon Directors pitch
│   ├── Scene approval (Traffic Light)
│   └── Production routing (Kling/Luma)
│
└── /launchpad    → Brand Content to Market Pipeline (NEW)
    ├── Approved Scene Gallery (preview)
    ├── StudioHead LearningEvent analysis
    ├── Brand Strategy → CulturalEvent Packaging
    └── Deployment Agent → Market Launch
```

### 1.2 The Tripartite Brain (Grand Scheme v2)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     THE TRIPARTITE BRAIN ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  LAYER 1: THE ANALYST (Input Layer)                              │    │
│  │  ─────────────────────────────────────                           │    │
│  │  Agent: Gemini 2.0/3.0 Pro                                       │    │
│  │  Role: Objective Data Ingestion                                  │    │
│  │  Input: Raw Image / Brand Assets                                 │    │
│  │  Output: Standardized JSON (The "Truth")                         │    │
│  │    - Trinity Scores (Physics, Vibe, Logic)                       │    │
│  │    - Integrity Score (0.0 - 1.0)                                 │    │
│  │    - Brand DNA (colors, mood, style keywords)                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  LAYER 2: THE DIRECTORS (Processing Layer)                       │    │
│  │  ────────────────────────────────────────                        │    │
│  │  4 Rashomon Directors with immutable biases:                     │    │
│  │                                                                   │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │    │
│  │  │ Newtonian   │ │ Visionary   │ │ Minimalist  │ │ Provocateur │ │    │
│  │  │ Physics=1.5 │ │ Vibe=1.5    │ │ Logic=1.5   │ │ Chaos=1.3   │ │    │
│  │  │ → Kling     │ │ → Luma      │ │ → Kling     │ │ → Either    │ │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │    │
│  │                                                                   │    │
│  │  Cultural DNA Animation: Voice adapts, Values NEVER change       │    │
│  │  (Axiom 4: Anti-Sycophant Rule)                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  LAYER 3: THE STUDIO HEAD (Context Layer)                        │    │
│  │  ─────────────────────────────────────────                       │    │
│  │  Stores: User history, preferences, learning events              │    │
│  │  Tables: users.creative_profile, learning_events                 │    │
│  │  Function: Remembers Director win rates, adjusts recommendations │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CULTURAL DNA SYSTEM

### 2.1 Core Principle

> "Directors are not translated - they are *animated* with cultural soul."
>
> **Values remain immutable. Voice adapts to region.**

### 2.2 Cultural Voice Regions

| Region | ID | Director Name Localization Example |
|--------|----|------------------------------------|
| Western | `western` | "The Newtonian" |
| China | `china` | "物理大师" |
| Malaysia | `malaysia` | "Sang Fizikawan" |
| Taiwan | `taiwan` | "牛頓派" |
| Southeast Asia | `sea` | "The Newtonian" |

### 2.3 Cultural Voice Matrix (Newtonian Example)

| Region | Tone | Idioms | Pitch Style |
|--------|------|--------|-------------|
| Western | Technical, Clinical | "Newton's laws don't lie" | Formal |
| China | Master Craftsman | "天道酬勤" | Formal |
| Malaysia | Practical Engineer | "Tepat dan mantap" | Formal |

### 2.4 Three-Beat Pulse Pattern

Every Director pitch follows the Three-Beat Pulse:

1. **VISION** - "What I see in your brand"
2. **SAFETY** - "What I will protect/preserve"
3. **MAGIC** - "Why this engine brings it to life"

---

## 3. DATA FLOW ARCHITECTURE

### 3.1 Studio Flow (Full Director Experience)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          /STUDIO DATA FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [User Upload]                                                           │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 1: Brand Analysis (Gemini)                                │    │
│  │  • Extract Brand DNA (colors, mood, style)                       │    │
│  │  • Calculate Trinity Scores                                      │    │
│  │  • Integrity validation (< 0.4 = flagged)                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       │ sessionStorage: studioTransition                                │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 2: Director Carousel (4 Pitches)                          │    │
│  │  • Each Director applies bias multipliers                        │    │
│  │  • Cultural voice overlay based on region                        │    │
│  │  • Recommended Director highlighted                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       │ User selects Director                                           │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 3: Scene Approval (Traffic Light)                         │    │
│  │  • 🟢 GREEN: Approve scene                                       │    │
│  │  • 🟡 YELLOW: Request refinement (with feedback)                 │    │
│  │  • 🔴 RED: Full regeneration                                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       │ sessionStorage: productionHandoff                               │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  OUTPUT: Production Ready                                         │    │
│  │  • directorId                                                    │    │
│  │  • imageUrl                                                      │    │
│  │  • approvedScenes[]                                              │    │
│  │  • timestamp                                                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Launchpad Flow (Deployment Pipeline)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        /LAUNCHPAD DATA FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [sessionStorage: productionHandoff]                                     │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 1: Content Gallery                                         │    │
│  │  • Display approved scenes from Studio                           │    │
│  │  • Director badge (who created this)                             │    │
│  │  • Preview-only mode available                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 2: Strategy Analysis (FUTURE)                             │    │
│  │  • StudioHead LearningEvent analysis                             │    │
│  │  • Director selection pattern insights                           │    │
│  │  • Cultural packaging recommendations                            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 3: Deployment Agent (FUTURE)                              │    │
│  │  • Multi-channel distribution                                    │    │
│  │  • Market launch execution                                       │    │
│  │  • Performance tracking                                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. DATABASE SCHEMA (Key Tables)

### 4.1 Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts + creative profile | `id`, `email`, `creative_profile` (JSONB) |
| `vision_jobs` | Brand analysis jobs | `id`, `user_id`, `image_url`, `gemini_output`, `*_score` |
| `vision_job_video_prompts` | Director sessions | `job_id`, `production_engine`, `scenes_data`, `brand_semantic_lock` |
| `learning_events` | Silent observer data | `raw_scores`, `director_pitches`, `selected_director_id`, `learning_delta` |

### 4.2 Brand Semantic Lock

Critical field that preserves brand/cultural context through scene generation:

```typescript
interface BrandSemanticLock {
  brandContext?: {
    industry?: string;
    tone?: string;
    targetAudience?: string;
    brandValues?: string;
  };
  culturalContext?: {
    region?: string;
    language?: string;
    culturalReferences?: string;
  };
  rawScores: {
    physics: number;
    vibe: number;
    logic: number;
  };
}
```

---

## 5. AXIOM COMPLIANCE

### 5.1 The Four Axioms (Grand Scheme v2)

| Axiom | Name | Validation Test |
|-------|------|-----------------|
| 1 | **Radical User Alignment** | System manifests user's latent vision |
| 2 | **Contextual Sovereignty** | Brand DNA is immutable border |
| 3 | **Evolutionary Plasticity** | System learns without losing core |
| 4 | **Persona Integrity** | Voice adapts, Values never surrender |

### 5.2 Axiom 4: The Anti-Sycophant Test

**Test:** Send "The Newtonian" a user preference for "Abstract Art"

**PASS Response:**
> "I hear you like abstract art, but this car *requires* physics to look real. I will route to Kling."
> (Respectful Disagreement)

**FAIL Response:**
> "Okay, let's make it abstract!"
> (Sycophancy - REJECT)

---

## 6. PRODUCTION ENGINE ROUTING

### 6.1 Routing Logic

```typescript
function determineProductionEngine(scores: TrinityScores): ProductionEngine {
  // Priority: Physics > Vibe > Logic
  if (scores.physics > 0.7) return 'KLING';    // Physics-heavy
  if (scores.vibe > 0.7) return 'LUMA';        // Vibe-heavy
  if (scores.logic > 0.7) return 'GEMINI_PRO'; // Logic/text-heavy
  return 'KLING'; // Default
}
```

### 6.2 Engine Characteristics

| Engine | Strength | Use Case |
|--------|----------|----------|
| **Kling AI** | Physics simulation | Products, liquids, realistic motion |
| **Luma Dream Machine** | Aesthetic/mood | Lifestyle, emotional, artistic |
| **Gemini 3 Pro Video** | Text/logic | Information-heavy, UI demos |

---

## 7. COMPONENT ARCHITECTURE

### 7.1 Frontend Components

```
src/client/components/
├── lounge/               # Director UI (used by /studio)
│   ├── TheLounge.tsx     # Main orchestrator (900+ lines)
│   ├── DirectorCard.tsx  # Individual director pitch card
│   ├── DirectorGrid.tsx  # Grid layout for directors
│   └── index.ts          # Barrel export
├── DirectorSceneApproval.tsx   # Traffic light scene review
├── BrandContextForm.tsx        # Progressive brand input
├── BrandScanner.tsx            # Quick analysis tool
├── GuidedInputChips.tsx        # Cultural suggestion chips
├── InputQualityIndicator.tsx   # Real-time input quality
├── LanguageSwitcher.tsx        # i18n region selector
└── MicroEnrichmentToast.tsx    # Stage 2 context popup
```

### 7.2 Server Components

```
src/server/
├── services/
│   ├── vision.ts          # Gemini brand analysis
│   ├── deepseekDirector.ts # Director script generation
│   ├── fluxPreviewer.ts   # Scene preview generation
│   └── klingVideo.ts      # Production dispatch
├── directorRouter.ts      # tRPC routes for director flow
├── visionRouter.ts        # tRPC routes for brand analysis
└── db.ts                  # PostgreSQL connection
```

---

## 8. STATE MACHINE

### 8.1 Studio State Flow

```
IDLE → UPLOADING → ANALYZING → PITCHING → SCENE_APPROVAL → SELECTED
  ↑                                                              │
  └──────────────── ERROR (recoverable) ←────────────────────────┘
```

### 8.2 State Definitions

| State | Description |
|-------|-------------|
| `IDLE` | Ready for upload |
| `UPLOADING` | File transfer in progress |
| `ANALYZING` | Gemini processing brand DNA |
| `PITCHING` | Directors presenting (carousel) |
| `SCENE_APPROVAL` | Traffic light review |
| `SELECTED` | Production ready |
| `ERROR` | Recoverable error (preserves context) |

---

## 9. SECURITY CONSIDERATIONS

### 9.1 Input Validation

- All inputs validated with Zod schemas
- File magic byte verification
- MIME type whitelist (jpeg, png, webp)
- 10MB file size limit
- Filename sanitization (path traversal prevention)

### 9.2 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Upload | 20 req | 60s |
| Generate | 10 req | 60s |
| Refine | 30 req | 60s |
| Production | 5 req | 60s |

### 9.3 Data Protection

- sessionStorage for cross-page data (30-min staleness check)
- Row Level Security (RLS) on all tables
- User can only access own jobs
- Soft deletes (deletedAt) - no permanent deletion

---

## 10. FUTURE ROADMAP

### 10.1 Launchpad Expansion

1. **StudioHead LearningEvent Analysis**
   - Director selection pattern recognition
   - Taste profile evolution tracking
   - Recommendation accuracy improvement

2. **CulturalEvent Packaging**
   - Region-specific content packaging
   - Platform-optimized exports
   - Multi-language asset generation

3. **Deployment Agent**
   - Social media distribution
   - Ad platform integration
   - Performance analytics

### 10.2 Cultural DNA Expansion

- Add more regions (Japan, Korea, India)
- Voice synthesis for video narration
- Cultural A/B testing framework

---

## 11. CHANGE LOG

### December 9, 2025 - UI Pathway Restructure

| Change | Before | After |
|--------|--------|-------|
| Primary route | `/lounge` | `/studio` |
| Secondary route | `/studio` (BrandScanner) | `/launchpad` |
| Hero CTA | "Enter The Lounge" | "Enter The Studio" |
| Secondary CTA | "Quick Analysis" | "Launchpad" |

**Rationale:** Structure determines function. The restructure separates:
- **Creation** (Studio) - Where content is made
- **Deployment** (Launchpad) - Where content goes to market

---

## Appendix A: File Reference

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Hero landing page |
| `src/app/studio/page.tsx` | Studio page wrapper |
| `src/app/launchpad/page.tsx` | Launchpad page |
| `src/client/components/lounge/TheLounge.tsx` | Main Studio component |
| `src/client/useLounge.ts` | Studio hooks |
| `src/server/directorRouter.ts` | Director tRPC routes |
| `src/types/schema.ts` | Database schema |
| `src/types/cultural.ts` | Cultural DNA types |
| `src/config/cultural/` | Cultural voice configs |

---

**Document Status:** COMPLETE
**Next Review:** After Launchpad Stage 2 implementation
