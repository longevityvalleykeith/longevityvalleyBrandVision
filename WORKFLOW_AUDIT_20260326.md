# Workflow Route Audit — Token Cost vs Outcome Delta
**Date:** 2026-03-26 | **Period:** Days 1-3 (Mar 23-25) | **Auditor:** Opus (Orchestrator)

## Scoreboard: 8 Sessions, ~245K Tokens Burned

| # | Session | Route | Est. Tokens | Deliverable | Delta |
|---|---------|-------|-------------|-------------|-------|
| 1 | Mar 23 daily | Scheduled → Chrome → Higgsfield (timeout) | ~40K | 0 delivered, 2 prompts staged | ⚠️ LOW |
| 2 | Mar 24 daily (interactive) | Interactive → Chrome → Higgsfield T2I | ~60K | **6 images, 6.0/6.0** | ✅ **ONLY WIN** |
| 3 | Mar 24 daily (Tier 2 retry) | Scheduled → Luma API (VM blocked) | ~35K | 0 — wrote report about session #2's work | ❌ DEAD |
| 4 | Mar 24 distribute | Scheduled → check assets → none found | ~30K | 0 — "NO_ASSET_FOR_DISTRIBUTION" | ❌ DEAD |
| 5 | Mar 24 social evening | Scheduled → precondition fail (no prior delivery) | ~25K | 0 — "NO_SOCIAL_ASSET_TODAY" | ❌ DEAD |
| 6 | Mar 25 distribute | Scheduled → found assets → can't send | ~35K | 0 — but found 3 NEW dead-ends | ⚠️ DIAGNOSTIC |
| 7 | Mar 25 social evening | Scheduled → precondition fail (again) | ~20K | 0 — copy of session #5's report | ❌ DEAD |

**Total: ~245K tokens → 6 images from 1 session. 5 sessions were pure waste. 1 was diagnostic.**

**Cost per deliverable (working route):** ~10K tokens/image
**Cost per deliverable (all routes):** ~41K tokens/image (4x overinflated by dead routes)

---

## Dead-End Route Registry

### DE-1: Scheduled Task → Bash API Call (ANY external API)
- **Route:** Scheduled task → curl/wget → Luma / FAL / any HTTP endpoint
- **Attempts:** 4 (Mar 23 ×1, Mar 24 ×2, Mar 25 ×1)
- **Success rate:** 0/4 = **0%**
- **Root cause:** VM sandbox blocks ALL outbound HTTP. Architectural. Not transient.
- **Tokens wasted:** ~60K across 4 attempts
- **Verdict:** ☠️ **KILL PERMANENTLY** — will never work from scheduled task VM

### DE-2: Distribution Task → Send Content (without sender tool)
- **Route:** Scheduled task → get_patient_roster → consent_check → bootstrap_telegram → send
- **Attempts:** 2 (Mar 24, Mar 25)
- **Success rate:** 0/2 = **0%**
- **Root cause:** `bootstrap_telegram` is a bot SETUP tool, not a message sender. No `send_message` or `send_photo` MCP tool exists. The entire distribution workflow was built on a tool that doesn't do what we assumed.
- **Tokens wasted:** ~65K across 2 attempts
- **Verdict:** ☠️ **KILL** — no sender tool exists. Distribution requires Chrome MCP (interactive only) or a new MCP tool.

### DE-3: PSV-Routed Personalized Delivery (all patients cold)
- **Route:** get_patient_roster → PSV segment → personalized content per patient
- **Attempts:** 1 (Mar 25 distribute, actually checked)
- **Success rate:** 0%
- **Root cause:** All 48 patients have sessionCount = 0 (cold). Cold rule = Monday only. 6/7 days personalized delivery is auto-skipped. AND no telegram_id or whatsapp_id populated in profiles.
- **Tokens wasted:** ~10K (part of Mar 25 distribute)
- **Verdict:** ☠️ **KILL FOR NOW** — until patients have channel IDs and active sessions, PSV routing is theater

### DE-4: Evening Social → Precondition Chain (requires prior delivery)
- **Route:** Check quality gate → check prior channel delivery → upload to Instagram/TikTok
- **Attempts:** 2 (Mar 24, Mar 25)
- **Success rate:** 0/2 = **0%**
- **Root cause:** Cascading dependency — requires prior successful delivery, which has never happened. Will always fail until DE-2 is resolved. Also: Chrome MCP untested from scheduled tasks.
- **Tokens wasted:** ~45K across 2 attempts
- **Verdict:** ☠️ **KILL** — downstream of a dead-end. Cannot succeed until upstream works.

### DE-5: Tier 2 Deferred Retry (+2h reschedule)
- **Route:** Tier 1 fails → update_scheduled_task(fireAt: +2h) → same task retries
- **Attempts:** 1 (Mar 24)
- **Success rate:** 0%
- **Root cause:** Retries the exact same route (bash API) that already failed for architectural reasons. Same VM, same network block, same result.
- **Tokens wasted:** ~35K
- **Verdict:** ☠️ **KILL** — retrying a permanent failure is the definition of waste

### DE-6: Full Pipeline Log Read (growing bloat)
- **Route:** Every task reads full pipeline_log.json as context
- **Token cost:** 5K on Day 1 → 8K on Day 3 → projected 20K+ by Week 2
- **Value:** ~500 tokens of it is useful (last entry only)
- **Verdict:** ⚠️ **PRUNE** — read last 3 entries max, archive the rest

### DE-7: Full SKILL.md Read (415+ lines)
- **Route:** Every task reads entire SKILL.md including dead-end routes, unused engine configs, etc.
- **Token cost:** ~6K per read × every task × every day
- **Value:** Maybe 2K of it is actionable per run
- **Verdict:** ⚠️ **PRUNE** — split into slim dispatch-only reference

---

## What Actually Works (Proven Routes)

### PR-1: Interactive Chrome → Higgsfield T2I ✅
- **Success rate:** 2/2 = 100% (Eterna PEMF + DR MAGfield Wellness)
- **Quality:** 6.0/6.0 both times
- **Token cost:** ~30K per generation (including Chrome screenshots)
- **Time:** ~2 minutes per generation
- **Engine:** Seedream 4.5 via Nano Banana Pro, free tier
- **This is the ONLY proven production route.**

### PR-2: Knowledge Extraction Pipeline ✅
- **Success rate:** 100% (29 KUs published, all RAG-searchable)
- **Token cost:** ~5K per batch extraction
- **Value:** High — KU-embedded topics drive content quality
- **Runs in:** Interactive session, no external API needed

### PR-3: Prompt Engineering + Quality Scoring ✅
- **Success rate:** v2 prompts → 6.0/6.0 scores (vs v1 = 2.0)
- **Token cost:** Marginal (embedded in generation workflow)
- **Value:** 3x quality improvement from prompt template corrections

### PR-4: Scheduled Task → Local File Read/Write ✅
- **Success rate:** 100% (every task successfully reads pipeline_log, writes reports)
- **Token cost:** ~5-10K per task
- **Value:** Planning and logging works. Generation and distribution don't.

---

## Meta-Learning: Auto-Prune Rules

### Rule 1: CONSECUTIVE FAILURE CIRCUIT BREAKER
```
IF route has failed ≥2 consecutive times
AND root_cause is tagged "architectural" (not "transient")
THEN disable_route permanently
AND log: "Route [X] killed: [root_cause], [N] failures, [M] tokens wasted"
```

### Rule 2: CASCADING DEPENDENCY KILL
```
IF route depends on upstream_route
AND upstream_route is DEAD (disabled by Rule 1)
THEN disable this route too
AND log: "Route [X] killed: upstream dependency [Y] is dead"
```

### Rule 3: TOKEN BUDGET GATE (per task)
```
IF estimated_tokens_for_route > 50K
AND route has 0 successful deliveries
THEN flag for review before next execution
DO NOT auto-execute — require interactive approval
```

### Rule 4: SAME-ROOT-CAUSE RETRY BLOCK
```
IF retry attempts same route that failed
AND failure root_cause is identical (not a new error)
THEN skip retry immediately (0 tokens spent)
AND log: "Retry blocked: same root cause as [previous_failure_id]"
```

### Rule 5: TOOL CAPABILITY PRE-FLIGHT
```
BEFORE building a workflow around an MCP tool:
  1. Verify the tool ACTUALLY does what its name implies
  2. Test with a dry-run call
  3. Check if required input data exists (telegram_id, whatsapp_id, etc.)
IF any check fails → DO NOT build workflow → log gap
```

### Rule 6: BLOAT RATCHET
```
IF reference_file_tokens > 2x useful_tokens
THEN split into slim dispatch reference + archived full version
Pipeline_log: keep last 7 entries, archive rest
SKILL.md: split into SKILL_DISPATCH.md (slim) + SKILL_FULL.md (reference)
```

---

## Minimum Viable Pipeline (after pruning)

### KILL LIST (remove from all scheduled tasks)
- [x] Luma API from VM (DE-1)
- [x] Tier 2 deferred retry (DE-5)
- [x] bootstrap_telegram distribution (DE-2 — not a sender)
- [x] PSV personalized routing (DE-3 — no channel IDs, all cold)
- [x] Evening social cascading precondition (DE-4)
- [x] Full pipeline_log reads (DE-6)
- [x] Full SKILL.md reads (DE-7)
- [x] 4-tier failover (Tiers 1, 2, 4 are dead; only Tier 3 works)

### KEEP LIST (proven routes only)
- [x] Scheduled task: Plan + prepare dispatch file (PR-4 — local only, cannot fail)
- [x] Interactive session: Chrome → Higgsfield T2I (PR-1 — 100% success, 6.0/6.0)
- [x] Interactive session: Chrome → Instagram/TikTok upload (untested but uses proven Chrome path)
- [x] Interactive session: Chrome → Telegram paste (fallback, uses proven Chrome path)
- [x] Knowledge extraction (PR-2 — works perfectly)

### NEW: What Needs Building
1. **Telegram sender** — either find/build an MCP tool that sends messages + images, OR use Chrome → Telegram Web
2. **Image file bridge** — copy generated images from host macOS into VM workspace after generation
3. **Patient onboarding** — populate telegram_id / whatsapp_id in patient profiles
4. **Welcome broadcast** — one-time intro content to convert cold → warm (bypasses Monday-only rule)
