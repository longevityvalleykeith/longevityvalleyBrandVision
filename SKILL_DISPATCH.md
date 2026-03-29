# GEO Pipeline — Dispatch Reference (SLIM)
**Read THIS instead of full SKILL.md. ~80 lines vs 415.**

## Only Proven Route: Interactive Chrome → Higgsfield T2I
- Engine: Seedream 4.5 / Nano Banana Pro (free tier)
- Success rate: 100% (6/6 images at 6.0/6.0)
- Output: 1440×2560, 9:16 vertical, PNG
- Time: ~2 min per generation

## Tenant Rotation (Thu = Eterna primary)
| Day | Primary | Secondary |
|-----|---------|-----------|
| Mon/Wed/Fri | Dr MAGfield | Eterna Science |
| Tue/Thu | Eterna Science | Dr MAGfield |
| Sat | Audio layer | — |
| Sun | Retake lowest-scored | — |

## Expert-Tenant Map
| Tenant | Expert | Contact | NOT the expert |
|--------|--------|---------|---------------|
| Dr MAGfield | Arie Ong Jia Qi (王泇淇) | +6012-377 0011 | Keith Koo |
| Eterna Science | Keith Koo | — | — |

## DR MAGfield Quick Reference
- **Position:** Pain & Performance, magnetic vortex technology
- **Tech:** 3-in-1 MAGfield Therapy (Heat + Magnetic Vortex + Vibration)
- **Colors:** Slate #2D3748, Warm Gold #C9A96E, Sage #7A9A7E
- **Design variant for GEO:** Recovery Protocol
- **Location:** KRPM Sungai Buloh

## Eterna Science Quick Reference
- **Position:** Advanced longevity science
- **Tech:** EECP (cardiovascular) + PEMF (pain/cellular)
- **Colors:** Cool blue-white (science/trust)

## Prompt Format (paste into Higgsfield)
```
[SUBJECT/MOTION] — [STYLE with brand colors] — [CONSTRAINT: logo sharp] — Avoid: [NEGATIVES]
```
Keep under 80 words. One action per 5s video. Always include negatives.

## Distribution (CURRENT STATE — HONEST)
- ❌ No Telegram sender tool exists (bootstrap_telegram = setup only)
- ❌ All 48 patients are cold (sessionCount=0), no channel IDs populated
- ✅ Chrome → Telegram Web paste = ONLY working delivery path
- ✅ Chrome → Instagram/TikTok upload = untested but viable
- Consent check required before any delivery

## Dead-End Routes (DO NOT ATTEMPT)
- Bash curl to ANY external API from VM (always HTTP 000)
- Tier 2 deferred retry (same VM, same block)
- bootstrap_telegram for sending messages (it's a setup tool)
- PSV-routed personalized delivery (no channel IDs, all cold)
- Evening social with "prior delivery" precondition (upstream dead)

## PEEL Loop (every cadence)
**Plan** (8:55 AM scheduled) → Write dispatch file. ~10K tokens. Cannot fail.
**Execute** (interactive) → Chrome → Higgsfield → generate → distribute. ~60K tokens.
**Evaluate** → Quality score + SLI increment + [SESSION_OUTPUT] handoff.
**Learn** → Apply auto-prune rules. Check dead-end registry. Update dispatch protocol.

## Agent Communication
- **Opus → Sonnet:** Pre-fill context in `references/browser-agent-dispatch.md`. Sonnet executes, returns handoff.
- **Opus → Agent 0:** `get_daily_brief` for status. Agent 0 has Telegram paired + relay capability. 147 pending queue.
- **Opus → Claude Code:** Needed for ADMIN_SECRET, maestro_onboard. Async via Notion/git.
- **Per-tenant Agent 0:** Dr MAGfield NOT YET onboarded (needs ADMIN_SECRET). Currently all routes through LV tenant UUID `313a6002-5718-4c28-8fe1-82f831b83cdf`.

## Auto-Prune Rules (apply to every run)
1. If route failed ≥2x for architectural reason → KILL permanently
2. If upstream dependency is dead → KILL downstream too
3. If estimated tokens > 50K and 0 prior successes → require approval
4. If retry has same root cause as prior failure → skip (0 tokens)
5. Before using MCP tool → verify it does what name implies
6. Pipeline_log: read last 3 entries only. Archive rest.

## Token Efficiency (from browser agent self-diagnosis + workflow audit)
- Target: <500 output tokens per Sonnet response unless task requires more
- Opus: plan/orchestrate only. Sonnet: execute only. Never mix roles.
- Read SKILL_DISPATCH.md (this file, ~100 lines) not SKILL.md (415+ lines)
- Track: tokens_per_deliverable. Days 1-3 avg: 41K/deliverable (4x overinflated by dead routes). Target: <15K.
