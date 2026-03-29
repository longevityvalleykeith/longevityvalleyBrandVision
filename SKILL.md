---
name: geo-content-pipeline
description: "Orchestrates daily GEO content production for Longevity Valley tenants (Dr MAGfield, Eterna Science, and others). Use this skill whenever the user mentions GEO content, brand content production, image-to-video generation, Higgsfield automation, content pipeline, social media asset creation, or scheduled content runs for any LV tenant. Also trigger when the user asks about content cadence, pipeline status, or wants to generate brand videos/images for Instagram Reels, TikTok, or Telegram."
---

# GEO Content Pipeline — Longevity Valley

## Purpose

This skill orchestrates daily GEO-tagged brand content production across Longevity Valley tenants. It manages the full lifecycle: asset sourcing → knowledge-graph-informed topic selection → prompt engineering → generation via Higgsfield.ai → quality verification → platform formatting → delivery to Telegram and Instagram/TikTok Reels.

**Grounding:** This pipeline is informed by LIVE data from the LV platform — see `references/lv-system-grounding.md` for the full intelligence layer including expert profiles, knowledge graph state, patient demographics, brand asset inventory, and quality metrics. READ THAT FILE before every run.

## Architecture Overview

```
┌───────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Opus)                      │
│  Owns: pipeline logic, quality gates, tenant rotation      │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  0. GROUND      → Read lv-system-grounding.md + pipeline_log│
│  1. PLAN        → Select tenant, topic (from knowledge      │
│                   graph), content type, demographic variant  │
│  2. SOURCE      → Pull brand assets from Google Drive       │
│  3. PROMPT      → Craft bilingual structured prompt         │
│  4. GENERATE    → Dispatch to Claude in Chrome (Higgsfield) │
│  5. VERIFY      → ffprobe specs + OCR brand + motion check  │
│  6. FORMAT      → 9:16 Reels + Telegram variants            │
│  7. DELIVER     → Save + tag with GEO metadata              │
│  8. LOG         → Record for progressive improvement loop   │
│                                                             │
│  INPUTS: LV Knowledge Graph (182 units, 181 rules)          │
│          Patient Demographics (44 patients, bilingual)       │
│          GEO Publish Variants (direct/harmonious/formal)     │
│          Google Drive Brand Assets (4 tenant folders)        │
│                                                             │
│  AGENTS: Chief of Staff (governance, health_check, relay)    │
│          Claude in Chrome (Higgsfield executor)              │
└───────────────────────────────────────────────────────────┘
```

## Expert-Tenant Architecture

- **Platform Admin:** Keith Koo (`keith-koo`) — Longevity Valley platform owner & orchestrator across ALL tenants. NOT the patient-facing expert for Dr MAGfield.
- **Tenant UUID:** `313a6002-5718-4c28-8fe1-82f831b83cdf`
- **Dr MAGfield Expert:** Arie Ong Jia Qi (王泇淇) — Pain & Performance specialist using magnetic vortex technology. Patient-facing expert — all Dr MAGfield content should reference Arie Ong, NOT Keith Koo.
- **Eterna Science Expert:** Keith Koo (sole expert for Eterna Science)
- Chief of Staff agent available for coordination: `e522b535-69f6-41e5-89cd-573c34c9da5b`

## Tenant Rotation

Four brand tenants identified in the LV ecosystem. Rotate daily, each gets 1 asset per day.

| Tenant | Drive Folder ID | Brand Focus | GEO Anchor | Status |
|--------|----------------|-------------|------------|--------|
| Dr MAGfield | `1S85YpSd4xeentFcgh_GBZ-htnv1szMId` | Pain & Performance, 3-in-1 MAGfield therapy (magnetic vortex) | KRPM Sungai Buloh | Active (primary) |
| Eterna Science | `16eXZhhtnOuIcnJmEBhMeACDkTgJ0J3az` | EECP + PEMF therapy, cardiovascular recovery | TBD | Active |
| RENN | `1kIWMQunZYzzqCU03SVsD0q2SdZaeFnxK` | TBD — logo assets exist | TBD | Early-stage |
| Carol Triple Wealth | `1F_8OcLGATmOHmnw5i3GZJDEUdXjUeqD8` | TBD — brand assets exist | TBD | Early-stage |

### Weekly Rotation (Active Tenants)

| Day | Primary Tenant | Secondary Tenant | Content Focus |
|-----|---------------|-----------------|---------------|
| Mon | Dr MAGfield | Eterna Science | Image-to-Video |
| Tue | Eterna Science | Dr MAGfield | Text-to-Image |
| Wed | Dr MAGfield | RENN (when ready) | Image-to-Video |
| Thu | Eterna Science | Dr MAGfield | Text-to-Image |
| Fri | Dr MAGfield | Eterna Science | Iteration/Retake |
| Sat | Eterna Science | Dr MAGfield | Audio + Voiceover |
| Sun | ALL | — | Best-of retakes, review pipeline_log |

As RENN and Carol Triple Wealth brand voices are extracted, add them to the active rotation.

## Knowledge-Graph-Driven Topic Selection

The pipeline does NOT invent topics. It sources content themes from the LV knowledge graph:

1. **Query the knowledge graph** — 182 active knowledge units represent validated clinical/wellness topics
2. **Rank by engagement** — 809 rule applications indicate which topics patients ask about most
3. **Match to demographic variant** — Each piece of content is tagged to one of 3 audience variants:
   - `direct` → Active golfer segment (male 40-60, performance-focused)
   - `harmonious` → Health-conscious women (40-65, wellness-journey)
   - `formal` → Family groups + clinical referrals (trust-building)
4. **Map to visual template** — Use the topic-to-visual mapping in `references/lv-system-grounding.md`

### Priority Topics (from knowledge graph + patient demographics + Notion)
1. **3-in-1 MAGfield Therapy Bed** — Core differentiator: Heat + Magnetic Vortex + Vibration
2. **Golf Swing → Back Pain (L4-L5) → Recovery** — Hero narrative for golfer segment (28-35% lumbar injury rate)
3. **EV-Mimetic Nanotechnology** — 2-week educational campaign already designed, targets 45+ degeneration
4. **Hair Mineral Analysis** — Nutritional assessment (Ca/Mg, Fe/Cu ratios), Arie Ong's clinical tool
5. **Spinal Therapy AI Assessment** — WhatsApp bot → AI-guided assessment → book with Arie Ong
6. EECP Therapy — Eterna Science core (cardiovascular recovery)
7. PEMF Therapy — Eterna Science secondary (pain/cellular regeneration)
8. Preventive Health Screening — Trust-building for family segment
9. Longevity Science Overview — Umbrella LV brand content

## Bilingual Content Strategy

Patient base is ~60% female, ~40% male, predominantly Chinese-Malaysian, bilingual English + Mandarin.

### Language Rules
- Brand names ALWAYS in English: "DR MAGfield", "Eterna Science", "RENN"
- Taglines maintain established bilingual versions from existing brand ads
- Instagram Reels: English headline + Chinese body caption (or reverse)
- TikTok: Chinese primary, English hashtags (higher MY local engagement)
- Telegram: Full bilingual — English + Chinese side by side
- Text overlays in video: Never mix languages mid-sentence
- Generate BOTH language versions as separate caption options per asset

## Content Types

Cycle through these content types to maintain variety:

1. **Image-to-Video (Animate)** — Animate existing brand images into motion content
2. **Text-to-Image (New assets)** — Generate fresh brand visuals from structured prompts
3. **Iteration / Retake** — Re-generate previous outputs with improved prompts based on quality log
4. **Audio + Voiceover layer** — Add branded audio to existing video assets (post-production stage)

Content type selection follows a weekly cycle per tenant:
- Day 1: Image-to-Video
- Day 2: Text-to-Image
- Day 3: Iteration (re-run lowest-scored asset from past week with improved prompt)
- Repeat

## Prompt Engineering Framework

NEVER send a monolithic prompt to the generation model. Always use this structured format:

### For Image-to-Video (Higgsfield / Kling 3.0)

```
[PRIMARY MOTION]: Single, clear motion directive (1 action only for 5s video)
  Example: "Slow cinematic zoom from full frame into treatment room panel"

[STYLE]: Atmosphere and lighting
  Example: "Warm golden lighting, professional medical spa atmosphere"

[CONSTRAINT]: What must be preserved
  Example: "Maintain text legibility and logo sharpness throughout all frames"

[NEGATIVE]: What to avoid (critical for quality)
  Example: "No text warping, no abrupt transitions, no color shifting, no static opening frames"
```

### For Text-to-Image (Nano Banana Pro)

```
[SUBJECT]: Primary visual subject
  Example: "Professional golfer mid-swing on lush green fairway"

[BRAND ELEMENTS]: Logo, text, colors that must appear
  Example: "DR MAGfield logo top-left, tagline 'Malaysia's 1st Golfers Health Lounge' bottom"

[STYLE]: Visual style and mood
  Example: "Premium health advertisement, warm tones, clean layout, 4K quality"

[GEO ANCHOR]: Location-specific visual cues (not text metadata)
  Example: "Tropical Malaysian golf course setting, KRPM clubhouse visible in background"

[NEGATIVE]: "No distorted text, no extra fingers, no watermarks, no blurry elements"
```

### GEO Metadata (separate from creative prompt)

GEO location data is NEVER embedded in the generation prompt. It is applied as post-production metadata:

```json
{
  "tenant_id": "longevityvalley",
  "brand": "Dr MAGfield",
  "geo_location": "Kelab Rahman Putra Malaysia (KRPM), Sungai Buloh",
  "geo_coordinates": "3.1884, 101.6072",
  "geo_tags": ["KRPM", "Sungai Buloh", "Malaysia", "golfers health lounge"],
  "content_type": "image-to-video",
  "platform_targets": ["instagram_reels", "tiktok", "telegram"],
  "generation_date": "ISO-8601",
  "prompt_hash": "sha256 of structured prompt",
  "quality_score": null
}
```

## Platform Output Specifications

### Instagram Reels / TikTok (Primary)

| Parameter | Value |
|-----------|-------|
| Aspect Ratio | 9:16 (vertical) |
| Resolution | 1080×1920 minimum |
| Duration | 5-15s (start with 5s, extend when chaining is available) |
| Format | MP4, H.264, AAC audio |
| Opening requirement | Visible motion within first 0.5 seconds |

### Telegram Channel

| Parameter | Value |
|-----------|-------|
| Aspect Ratio | Flexible (deliver both 9:16 and 1:1 variants) |
| Resolution | 720p minimum |
| Duration | 5-30s |
| Format | MP4 |
| Caption | Include GEO tags and brand hashtags |

## Content Engine Matrix

### Engine Priority (by execution context)

**CRITICAL:** The VM sandbox cannot reach external APIs (Luma, FAL, Higgsfield API all return HTTP 000). The scheduled task runs on native macOS where API calls work. The interactive session has Chrome browser MCP access.

| Engine | Type | Access Method | Scheduled Task (macOS) | Interactive (VM) | Use Case |
|--------|------|--------------|----------------------|-----------------|----------|
| **Luma Ray-2** | Video (API) | Bash: `scripts/luma-generate.sh` | PRIMARY | BLOCKED (no API access) | All video generation |
| **Higgsfield Nano Banana** | Image (browser) | `mcp__Claude_in_Chrome` | N/A (no browser) | PRIMARY for T2I | Text-to-image only |
| **Kling 3.0** | Video (browser) | `mcp__Claude_in_Chrome` via Higgsfield | N/A (no browser) | FALLBACK for I2V | Video fallback if Luma exhausted |
| **FAL.ai** | Image+Video (API) | Not yet integrated | FUTURE Tier 2 | BLOCKED | Fast generation backup |

### Engine Selection Logic

```
IF scheduled_task:
  VIDEO → Luma Ray-2 API (scripts/luma-generate.sh)
    ON_FAIL → reschedule +2h retry (Tier 2)
    ON_RETRY_FAIL → notify for interactive fallback (Tier 3)
  IMAGE → SKIP (no browser in scheduled context)
    → Queue for interactive session or evening social task

IF interactive_session:
  VIDEO → Chrome browser → Higgsfield Kling 3.0
    ON_FAIL (site unreachable) → ask user to run Luma script manually
  IMAGE → Chrome browser → Higgsfield Nano Banana Pro
    ON_FAIL → text description fallback for social caption-only post
```

### Luma Ray-2 Configuration (PRIMARY — Video)

| Parameter | Value |
|-----------|-------|
| Model | `ray-2` |
| API | `https://api.lumalabs.ai/dream-machine/v1/generations` |
| Script | `scripts/luma-generate.sh "prompt" [aspect_ratio] [model] [duration]` |
| Default Aspect | 9:16 (vertical Reels/TikTok) |
| Default Duration | 5s |
| Output Path | `outputs/dr-magfield/inbox/luma_YYYYMMDD_HHMMSS_<genId>.mp4` |
| Poll Interval | 10s, max 30 attempts (5 min timeout) |
| Exit Codes | 0=success, 1=API error, 2=timeout |

### Luma Prompt Adaptation

Luma Ray-2 uses a single text prompt (no separate negative field). Adapt the structured prompt format:

```
Assembled prompt = [PRIMARY MOTION] + " — " + [STYLE] + " — " + [CONSTRAINT]
Append: " — Avoid: " + [NEGATIVE items comma-separated]
```

Example:
```
Smooth cinematic zoom from golfer mid-swing into MAGfield therapy room with warm golden glow pulsing — Warm Gold accent lighting, premium clinical warmth, Recovery Protocol design — DR MAGfield spiral vortex logo sharp and legible throughout — Avoid: static opening, text distortion, abrupt cuts, extra limbs, color banding
```

### Higgsfield Settings (SECONDARY — Images + Video Fallback)

| Parameter | Image-to-Video | Text-to-Image |
|-----------|---------------|---------------|
| Model | Kling 3.0 | Nano Banana 2 |
| Preset | GENERAL | (model default) |
| Duration | 5 seconds | N/A |
| Quality | 720p (verify actual output) | 4K if available |
| Aspect Ratio | 9:16 for Reels, 1:1 for Telegram | Match platform target |
| Enhance | ON | ON |

### Browser Agent Instructions (Higgsfield — interactive sessions only)

When dispatching to Claude in Chrome for Higgsfield generation:

1. Navigate to higgsfield.ai
2. Select the correct generation mode (Video > Animate for I2V, Image > Create for T2I)
3. Upload or select source asset
4. Configure ALL settings explicitly — do not rely on defaults
5. Paste the structured prompt (PRIMARY MOTION + STYLE + CONSTRAINT + NEGATIVE concatenated)
6. Start generation and WAIT for completion
7. **CRITICAL**: Download the output file before declaring success
8. Return the file path for quality verification

Do NOT declare "COMPLETED" until the output file is downloaded and verified.

## Operational Model (Post-Audit v4.0 — March 26)

### What Works (ONLY use these routes)
1. **Scheduled task → local file read/write** (plan + prepare dispatch) — 100% success, ~10K tokens
2. **Interactive Chrome → Higgsfield T2I** (generate) — 100% success, 6.0/6.0, ~30K tokens
3. **Interactive Chrome → Telegram Web / Instagram / TikTok** (distribute) — untested but viable
4. **Knowledge extraction → populate_knowledge** (KU pipeline) — 100% success

### What's Dead (NEVER attempt from scheduled tasks)
- ☠️ Bash curl to ANY external API (VM blocks all outbound HTTP)
- ☠️ bootstrap_telegram for sending messages (it's a setup tool, not a sender)
- ☠️ PSV personalized routing (all 48 patients cold, no channel IDs)
- ☠️ Tier 2 deferred retry (retries same architectural failure)
- ☠️ Evening social cascade (depends on dead upstream distribution)

### Task Architecture (1 scheduled + interactive)

| Task | Schedule | Purpose | Token Budget |
|------|----------|---------|-------------|
| `lv-geo-content-daily` | 8:55 AM | Write dispatch file (local only) | ~10K |
| `lv-geo-content-distribute` | DISABLED | Dead — no sender tool | 0 |
| `lv-geo-social-evening` | DISABLED | Dead — cascading dependency | 0 |
| `dr-magfield-daily-geo` | DISABLED | Duplicate | 0 |
| **Interactive session** | When Keith opens Cowork | Generate + distribute via Chrome | ~60K |

### SLI Definition (simplified)
```
SLI = days_with_delivery / total_days
Target: 99% (≤3 misses/year)
Current: 0/3 = 0% (Day 1-3: generation works, distribution blocked)
```

### Blocker to 99%: Distribution
Generation is solved (6.0/6.0 via Chrome → Higgsfield). Distribution needs:
1. A way to SEND content to channels (Chrome → Telegram Web is the only current path)
2. Patient profiles with telegram_id / whatsapp_id populated
3. Welcome broadcast to convert cold → warm patients

### Meta-Learning: Auto-Prune Rules
Applied at every pipeline run start. See WORKFLOW_AUDIT_20260326.md for full details.
1. Route failed ≥2x for architectural reason → KILL permanently
2. Upstream dead → downstream dead too (cascade kill)
3. >50K tokens + 0 prior successes → require approval
4. Same root cause as prior failure → skip retry (0 tokens)
5. Verify MCP tool actually does what name implies before building workflow
6. Read last 3 pipeline_log entries only — archive rest

## Quality Verification Gate

After every generation, run these checks before the asset enters the pipeline:

### Automated Checks (run via ffprobe / ImageMagick)

```bash
# Video output verification
ffprobe -v quiet -print_format json -show_streams output.mp4

# Check against specs:
# 1. Resolution matches requested (±5% tolerance)
# 2. Aspect ratio matches platform target
# 3. Duration matches requested (±0.5s tolerance)
# 4. Frame rate ≥ 24fps
# 5. File size is reasonable (not a failed/corrupt generation)
```

### Brand Integrity Check

Extract first and last frames, then verify:
- Brand logo text is legible (no warping/distortion)
- Brand colors are consistent with tenant's palette
- No unintended text artifacts

### Motion Quality Check

Extract frames at 0.5s intervals and compare:
- Frame 1 vs Frame 2 should show visible difference (no "dead" opening)
- Optical flow should be >0 across all frame pairs
- Flag if >30% of frames are near-identical (static waste)

### Quality Scoring

Score each output 1-5 on these dimensions:
- **Resolution compliance** (0 or 1): Did output match requested specs?
- **Motion quality** (1-5): Opening hook strength, smoothness, variety
- **Brand integrity** (1-5): Logo preservation, color consistency, text legibility
- **Platform readiness** (0 or 1): Correct aspect ratio for target platform

**Composite score** = (Resolution × 1) + (Motion × 0.4) + (Brand × 0.4) + (Platform × 1)
- Maximum: 6.0
- Threshold for publication: ≥ 4.0
- Below 4.0: Queue for iteration/retake

## Progressive Improvement Loop

After each generation cycle, log the following to `pipeline_log.json` in the workspace:

```json
{
  "run_id": "uuid",
  "date": "ISO-8601",
  "tenant": "dr-magfield",
  "content_type": "image-to-video",
  "prompt_structured": { ... },
  "output_specs": { "width": 0, "height": 0, "duration": 0, "fps": 0 },
  "quality_score": { "resolution": 0, "motion": 0, "brand": 0, "platform": 0, "composite": 0 },
  "platform_targets": ["instagram_reels"],
  "issues_detected": ["static_opening", "logo_distortion_mid"],
  "improvement_notes": "Next run: add negative prompt for text warping, start zoom immediately"
}
```

### Improvement Rules

Each iteration run should:
1. Read the pipeline log for the tenant's last 7 days
2. Identify the lowest-scored asset
3. Analyze `issues_detected` and `improvement_notes`
4. Modify the structured prompt to address those specific issues
5. Regenerate and compare scores

If the same issue persists across 3+ runs, escalate to the orchestrator (Opus) for prompt template revision.

## Tenant-Specific Brand Assets

### Dr MAGfield (PRIMARY — most content-ready)
- **Brand positioning**: THE expert in **Pain & Performance** using **magnetic vortex technology**
- **Tagline**: "Malaysia's 1st Golfers Health Lounge" / "马来西亚首家高尔夫健康休闲体验馆"
- **Expert**: Arie Ong Jia Qi (王泇淇), +6012-377 0011 — Pain & Performance specialist (NOT Keith Koo)
- **Location**: Rahman Putra Golf Club (KRPM), Sungai Buloh (GEO coords: 3.1884, 101.6072)
- **Core technology**: 3-in-1 MAGfield Therapy — Heat + Magnetic Vortex + Vibration (the MAGfield therapy bed)
- **Key visuals**: Golfer swing → back pain → MAGfield therapy bed → recovery on course, spiral vortex logo
- **Colors (from Notion)**: Slate #2D3748, Warm Gold #C9A96E, Sage #7A9A7E, Paper #FFFDF9, Cream Warm #F5F0E8
- **Typography**: Headlines = Instrument Serif, Body = Outfit 300, Logo = Montserrat 800/400
- **Design variants**: Spine Whisperer (dark luxury), Recovery Protocol (light clinical — BEST FOR GEO), Living Ad (portal/digital)
- **Services**: 3-in-1 MAGfield therapy, spinal therapy for golfers (L4-L5), hair mineral element analysis, EV-Mimetic nanotechnology education, AI-guided spinal assessment via WhatsApp
- **Drive folder**: `1S85YpSd4xeentFcgh_GBZ-htnv1szMId`
- **Source images**: 4K brand ads generated via Nano Banana 2 (English + Chinese bilingual), therapy bed video `magfield-bg.mp4`
- **Audience**: Golfers & aging population with physical degeneration — KRPM golf members, 45+ seniors, predominantly Chinese-Malaysian, bilingual
- **Demographic variants**: Direct (golfer performance), Harmonious (wellness women), Formal (family trust)
- **Hub**: https://magfieldhub-prhmfwhg.manus.space

### Eterna Science (SECONDARY — building content library)
- **Brand**: Advanced longevity science
- **Location**: TBD — extract via `extract_brand_voice` when admin access available
- **Key visuals**: EECP device, PEMF therapy, clinical technology, cardiovascular health
- **Colors**: TBD — likely cool blue/white (science/trust palette)
- **Services**: EECP (Enhanced External Counterpulsation), PEMF (Pulsed Electromagnetic Field)
- **Drive folder**: `16eXZhhtnOuIcnJmEBhMeACDkTgJ0J3az` (subfolder: EECP & PEMF)
- **Audience**: Cardiovascular patients, pain management seekers, tech-forward health consumers
- **Content angle**: Clinical authority, device demonstrations, patient recovery stories

### RENN (EARLY STAGE — logo only)
- **Brand**: TBD
- **Drive folder**: `1kIWMQunZYzzqCU03SVsD0q2SdZaeFnxK`
- **Action needed**: Extract brand voice, define visual identity, create source images before adding to rotation

### Carol Triple Wealth (EARLY STAGE — brand assets exist)
- **Brand**: TBD
- **Drive folder**: `1F_8OcLGATmOHmnw5i3GZJDEUdXjUeqD8`
- **Action needed**: Same as RENN — extract, define, create before rotation

### Shared LV Master Assets
- **LV Brand Assets root**: `1UHpbCevaL7nFkNBgnS8drSl-JVM-asos`
- **Silk Road Visual**: `1Gg-2Eak_-HiL2pY2drunegdBxh0qxFoj` (master brand visual with logo)
- **Cognitive Architecture**: `1qLDGaGM0gmJty6SsKFG5qJwCezvO9g5X` (system design visuals)
- **Failure Assets**: `1a3CAw5kZ__lyQmfkcKCZ8J8wRd3jBaU-` — IMPORTANT: review these to learn from past generation failures

## Workflow Execution Order

For each daily run:

### Phase A: Content Generation (9:00 AM MYT)
1. **Ground** — Read lv-system-grounding.md + pipeline_log.json + distribution-workflow.md
2. **Determine today's tenant and content type** from rotation schedule
3. **Set active tenant** via `set_active_tenant` tool
4. **Select topic** from knowledge graph (182 units), match to demographic variant
5. **Source assets**: Check Google Drive for latest brand images/videos
6. **Craft bilingual structured prompt** using framework above
7. **Dispatch to Claude in Chrome** with explicit Higgsfield instructions
8. **Download and verify output** — run quality gate checks
9. **If quality score ≥ 4.0**: Tag with GEO metadata, proceed to distribution
10. **If quality score < 4.0**: Log issues, retry once with adjusted prompt, or queue for Sunday

### Phase B: PSV-Routed Distribution (staggered across day)
Full distribution workflow documented in `references/distribution-workflow.md`. Summary:

11. **Resolve audience** — `get_patient_roster` → `consent_check` → `get_patient_insights` for PSV signals
12. **Segment by PSV** — Map each patient to demographic variant, channel preference, engagement level
13. **T+0 min (9:15 AM): Telegram** — API delivery via `bootstrap_telegram` bot (PRIMARY). Browser clipboard paste as fallback.
14. **T+15 min (9:30 AM): WhatsApp Business API** — Approved template to consented active patients, personalized by PSV
15. **T+30 min (9:45 AM): WhatsApp Channel** — Broadcast post (one-to-many, tenant-specific)
16. **T+60 min (10:15 AM): WhatsApp Groups** — Browser clipboard paste to community groups
17. **T+120 min (7:00 PM): Instagram Reels** — Browser upload, timed to evening peak
18. **T+150 min (8:00 PM): TikTok** — Browser upload, timed to late evening peak

### Phase C: Logging & Improvement
19. **Log distribution** — Record channel, audience size, delivery method, errors
20. **Update pipeline_log.json** with full run + distribution data
21. **Create daily report** — Summary of generation + distribution for all tenants

## PSV-Based Distribution Logic

The Patient State Vector determines WHO gets WHAT content on WHICH channel:

| PSV Signal | Extraction Tool | Distribution Impact |
|-----------|----------------|-------------------|
| `telegram_id` in identifiers | `get_patient_roster` | Route to Telegram |
| `whatsapp_id` in identifiers | `get_patient_roster` | Route to WhatsApp Business API |
| `data_sharing` consent = TRUE | `consent_check` | GATE: must be true to send ANY content |
| `sessionCount` = 0 (cold) | `get_patient_roster` | 1x/week only, intro content |
| `sessionCount` 1-3 (warm) | `get_patient_roster` | Standard cadence, matched topics |
| `sessionCount` 4+ (active) | `get_patient_roster` | Full daily cadence, priority delivery |
| `conditions[]` match topic | `get_patient_insights` | HIGH relevance → deliver |
| `conditions[]` conflict | `get_patient_insights` | SKIP — don't send triggering content |
| `lastSession` > 30 days | Derived from roster | Dormant → re-engagement sequence |

## Telegram Delivery — Lessons from v1

**Problem (March 23 v1):** Browser agent typed message line-by-line → LV Agent 0 bot intercepted each keystroke → 10+ duplicate partial messages + "Not authorized" spam → 132 steps for 1 message.

**Fix:**
- **PRIMARY:** Use `bootstrap_telegram` API → bot sends atomically, zero keystroke interception
- **FALLBACK:** Browser clipboard paste → single Ctrl+V, bot sees 1 message only

**Message format:** See `references/distribution-workflow.md` Section 3a for template.

**NEVER type line-by-line in Telegram again.**

## Important Operational Notes

- The free tier of Higgsfield has rate limits and quality constraints. If output quality consistently falls below threshold, recommend upgrading to a paid tier.
- Always verify actual output specs — free-tier models often do not honor requested settings (as documented in the March 23 critical review).
- The browser agent (Sonnet) is an EXECUTOR, not a planner. The orchestrator (Opus) designs the workflow; the browser agent follows explicit step-by-step instructions.
- Sunday is reserved for iteration/retake runs — review the week's quality log and regenerate the worst performers with improved prompts.
- Telegram API delivery is PRIMARY. Browser is fallback ONLY. Never type line-by-line.
- WhatsApp Business API requires pre-approved templates from Meta. Phase 3 of rollout.
- Content must NEVER make specific clinical claims (quality dashboard clinical_accuracy: 0.34). Focus on brand/lifestyle.
- Every distribution requires consent_check FIRST. No exceptions.
