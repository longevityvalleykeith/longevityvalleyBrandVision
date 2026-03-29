# GEO Pipeline Meta-Review — Days 1-2 (March 23-24, 2026)

## The Brutal Numbers

| Metric | Day 1 (Mar 23) | Day 2 (Mar 24) | Total |
|--------|---------------|---------------|-------|
| Scheduled task executions | 3 | 6 | 9 |
| Assets generated | 1 (below threshold) | 6 (via interactive) + 0 (via scheduled) | 7 |
| Assets above quality gate | 0 | 6 | 6 |
| Assets delivered to ANY channel | 0 | 0 | **0** |
| SLI (delivery/day) | 0% | 0% | **0.0%** |
| Tier 1 successes | 0 | 0 | **0** |
| Tier 2 successes | 0 | 0 | **0** |
| Tier 3 successes (interactive) | 0 | 2 (generation only) | 2 |

**SLI = 0.0% against 99% target. Zero content has reached any patient or channel in 2 days.**

## What Actually Worked

1. **Interactive Chrome → Higgsfield T2I = PROVEN PATH**
   - 6 images generated, all scored 6.0/6.0
   - Seedream 4.5 engine via Nano Banana Pro, free tier, zero credits
   - 1440×2560 9:16 vertical, brand colors exact match, bilingual captions ready
   - Execution time: ~2 minutes per generation

2. **Pipeline self-diagnosis is excellent**
   - Scheduled tasks correctly identified their own failures
   - Correctly found distributable assets (dist-002)
   - Correctly escalated to Tier 3
   - Quality scoring caught the v1 issues (run-001 score 2.0)
   - The system KNOWS what's wrong — it just can't fix itself

3. **Brand intelligence pipeline**
   - 210 knowledge units active and RAG-searchable
   - Prompt templates producing perfect brand-aligned content
   - Expert attribution (Arie Ong), colors, design variants all correct
   - Bilingual captions generating correctly (EN + ZH)

4. **Prompt engineering v2 improvements**
   - Single PRIMARY MOTION → model compliance improved dramatically
   - Negative prompts → no text warping in v2 outputs
   - 9:16 vertical → platform-ready on first generation
   - These fixes are permanent gains

## What Failed — Full Failure Mode Map

### F1: VM Sandbox API Block (ROOT CAUSE — kills Tier 1 + 2)
The scheduled task VM cannot reach ANY external API. curl to Luma, Higgsfield, FAL all return exit code 56 / HTTP 000. This is architectural, not transient. **Every scheduled task that attempts a bash API call will always fail.** The 4-tier failover I built is broken at the foundation — Tier 1 and Tier 2 both use bash curl, so both always fail for the same reason. Two tiers that always fail is not resilience. It's wasted compute.

### F2: Chrome MCP from Scheduled Tasks — UNTESTED
Chrome MCP tools ARE listed as available (`mcp__Claude_in_Chrome__navigate`, etc.). But we never tried using them from a scheduled task. If Chrome is running on Keith's Mac, this COULD be the viable automated path. But if the Mac is sleeping, lid closed, or Chrome not running at 9 AM — it fails silently. This is the single most important thing to test.

### F3: Sonnet 4.6 — 200K Token Context Exhaustion
The current scheduled task reads: SKILL.md (~6K tokens) + pipeline_log.json (~5K and growing) + prompt-templates.md (~3K) + distribution-workflow.md (~3K) + system grounding (~3K) = **~20K tokens before any work begins**. Each Chrome screenshot costs 5-10K tokens. A full Higgsfield generate cycle = 10-15 Chrome interactions = ~100K tokens. Distribution via Chrome to Instagram + TikTok = another 10-20 interactions = ~100K tokens. **Total: 20K (refs) + 200K (Chrome) = 220K tokens needed > 200K available.** A single task CANNOT generate AND distribute in one context window.

### F4: No Real-Time Observability
Keith cannot see what a scheduled task is doing while it runs. `notifyOnCompletion` fires AFTER the task finishes — too late for intervention. If a task hangs on a Chrome timeout or loops, it burns the context window silently. No progress indicator, no live log, no dashboard. The pipeline_log.json is a post-mortem artifact, not an observability tool.

### F5: Cascading Dependency Chain (15-min gap is too tight)
9:00 AM generation → 9:15 AM distribution → 7:00 PM social. If generation takes 20 minutes (Chrome interactions), the 9:15 distribution task fires while generation is still running → finds no assets → skips. The evening social task requires "prior successful delivery" → cascading skip. **One upstream timing issue = all 3 tasks fail for the day = guaranteed SLI miss.** This is exactly what happened on Day 2.

### F6: Pipeline Log Bloat
386 lines after 2 days. Projected: ~1500 lines/week, ~6000 lines/month. The scheduled task reads the FULL log every run. Growing token cost per run → eventually fills context window just with log data → leaves no room for actual work.

### F7: Tool Permission Pre-Approval Gap
Chrome MCP tools, bootstrap_telegram, and other MCP tools may need one-time approval via "Run now". If an unapproved tool is needed during automated execution, the task blocks silently waiting for human input. No timeout, no fallback.

### F8: Source Images Not Locally Available
Generated images land on "Higgsfield account + host macOS Downloads" — NOT in the VM workspace. Google Drive images are inaccessible from VM. I2V (image-to-video) requires a source image at an accessible path. The Day 2 T2I outputs exist somewhere on the host Mac, but the pipeline can't programmatically locate them for animation.

### F9: Over-Engineered Complexity
SKILL.md: 415+ lines. Pipeline_log: 386 lines. 4-tier failover across 2 execution contexts. 4 engines. 6 distribution channels. 4 tenants. 3 demographic variants. 2 languages. 3 interdependent scheduled tasks. ~2000-word task prompts. The complexity itself is a failure mode. Each task tries to comprehensively handle every scenario, reads every reference file, and attempts to orchestrate the full lifecycle. A simpler system that actually ships > a comprehensive system that never ships.

### F10: Distribution Channel Access Unknown
bootstrap_telegram is an MCP tool (should work from VM). But Instagram and TikTok uploads require Chrome (untested from scheduled context). WhatsApp Business API is "Phase 3 — not yet connected." We have 6 planned distribution channels and have verified exactly zero.

## The Honest Assessment

The pipeline has excellent content intelligence (KU-embedded topics, brand-correct prompts, bilingual captions, quality scoring) and one proven execution path (interactive Chrome → Higgsfield). But the automation layer — the thing that would make it a pipeline instead of a manual workflow — is fundamentally broken because the VM sandbox blocks all external APIs, and we haven't validated the Chrome MCP path from scheduled tasks.

**We built a race car with no fuel line.**

## Simplified Architecture for 99% SLI

### Principle: Do less, ship something

The current 3-task architecture tries to be fully autonomous. Reality: it has 0% success rate. The redesign splits concerns based on what each execution context CAN actually do.

### NEW: 2-Task Model

**TASK 1: "Pipeline Planner" (8:55 AM) — CANNOT FAIL**
- Purpose: Prepare everything so execution is trivial
- Reads: pipeline_log.json (LAST 3 ENTRIES ONLY — not full log)
- Determines: today's tenant, topic, demographic variant, prompt
- Writes: `outputs/today_dispatch.json` — the exact payload to execute
- NO Chrome, NO API calls, NO generation, NO distribution
- Token budget: ~10K max (tiny prompt + minimal reads)
- Failure rate: ~0% (only reads/writes local files)

**TASK 2: "Generate & Ship" (9:05 AM) — ONE JOB: get content to channels**
- Reads: ONLY `today_dispatch.json` (tiny file) + prompt-templates.md
- Path A (Chrome available): Chrome MCP → Higgsfield → generate T2I → download → bootstrap_telegram → done
- Path B (Chrome unavailable): Notify Keith, log failure, try again at 11 AM
- NO full SKILL.md read. NO full pipeline_log read. NO multi-tier retry logic within the task.
- Token budget: ~5K (refs) + ~100K (Chrome generation) + ~30K (Chrome distribution) = ~135K < 200K limit
- One generation + one Telegram delivery = SLI counts

**Remove entirely: `lv-geo-social-evening`**
- Instagram/TikTok uploads are a bonus, not SLI-critical
- Do them in the interactive session when Keith opens Cowork
- Eliminates the cascading dependency chain

### today_dispatch.json Format

```json
{
  "date": "2026-03-25",
  "tenant": "dr-magfield",
  "topic": "3-in-1 MAGfield Therapy — Wellness Recovery",
  "demographic_variant": "direct",
  "content_type": "text-to-image",
  "engine": "higgsfield-seedream-4.5",
  "prompt_assembled": "...(ready-to-paste prompt)...",
  "negative": "...",
  "specs": { "aspect_ratio": "9:16", "resolution": "1440x2560" },
  "captions": {
    "en": "...",
    "zh": "..."
  },
  "telegram_message": "...(ready-to-send formatted message)...",
  "expert": "Arie Ong",
  "contact": "+6012-377 0011"
}
```

Task 2 doesn't need to think. It just executes what Task 1 prepared.

### SLI Tracking — Simplified

Drop the complex sli_tracking object. One number matters:

```
SLI = successful_delivery_days / total_scheduled_days
Target: ≥ 99%
```

Log one line per day: `{ date, tenant, generated: bool, delivered: bool, engine, tier, channel }`.

### Pipeline Log Rotation

Keep only last 7 entries in pipeline_log.json. Archive older entries to `archive/pipeline_log_week_XX.json`. Prevents bloat from eating the context window.

## Before Tomorrow's Run: 3 Things

1. **TEST Chrome MCP from scheduled task** — "Run now" on Task 2 to see if `mcp__Claude_in_Chrome__navigate` works. This is the make-or-break test. If Chrome works from scheduled context with Chrome browser open on Mac, we have a viable automated path. If not, the scheduled task becomes notification-only and Keith executes in interactive session.

2. **Pre-approve tool permissions** — "Run now" on both tasks to grant: Chrome MCP tools, bootstrap_telegram, file read/write.

3. **Distribute the Day 2 assets NOW** — run-eterna-002 and run-magfield-003 scored 6.0/6.0 with bilingual captions ready. They should go out today, not sit in queue. First successful delivery breaks the 0% SLI.
