# Agent Communication Protocol — GEO Pipeline
**Version:** 1.0 | **Date:** 2026-03-26

## Agent Registry (Current State)

| Agent | ID | Role | Surface | Status |
|-------|----|------|---------|--------|
| **Opus** (this agent) | — | Orchestrator / LV Maestro | Cowork Desktop | Active |
| **Sonnet 4.6** | — | Browser Executor | Claude in Chrome | Active (on demand) |
| **Agent 0** (Chief of Staff) | `e522b535-69f6-41e5-89cd-573c34c9da5b` | Telegram/WhatsApp relay, intake, routing | Webhook + Telegram | Active (paired), 0 sessions |
| **Claude Code** | — | Infrastructure | Terminal | Not in this session |

## Tenant State

| Tenant | UUID | Onboarded | Agent 0 | Telegram |
|--------|------|-----------|---------|----------|
| Longevity Valley | `313a6002-5718-4c28-8fe1-82f831b83cdf` | Partial (live but verify_onboard_status says "not found") | Shared | Paired |
| Dr MAGfield | — | **NOT ONBOARDED** (maestro_onboard blocked: ADMIN_SECRET) | None (uses LV shared) | Via LV |
| Eterna Science | — | NOT ONBOARDED | None | None |

### Blocker: ADMIN_SECRET
`maestro_onboard`, `set_active_tenant`, and `extract_brand_voice` all require admin auth.
**Resolution path:** Claude Code (infrastructure agent) must set `ADMIN_SECRET` in `.env` → then Opus can onboard Dr MAGfield as its own tenant with its own Agent 0.

## Communication Paths (What Works Now)

### Opus → Agent 0 (relay)
Agent 0 has `relay` capability. Communication goes through shared infrastructure:
- Opus writes dispatch payload → Agent 0 reads via daily brief or relay webhook
- Tools: `expert_capsule_handoff` (for patient routing), `get_daily_brief` (for status)
- Agent 0 currently has 147 pending queue items and 0 processed sessions

### Opus → Sonnet (Chrome browser dispatch)
- Opus pre-fills context in `browser-agent-dispatch.md` format
- Sonnet reads context block and executes (generate/distribute)
- Sonnet returns `[SESSION_OUTPUT]` handoff block
- No persistent memory — dispatch file IS the memory

### Opus → Claude Code (infrastructure)
- Not in this session. Communicate via Notion async or git commits.
- Needed for: ADMIN_SECRET setup, maestro_onboard, annealing contracts

## Communication Paths (Need Building)

### Agent 0 → Telegram Channel (content distribution)
Agent 0 has Telegram paired + relay capability. If we can route GEO content through Agent 0's relay:
1. Opus stages content in pipeline
2. Agent 0 picks up via daily brief or webhook trigger
3. Agent 0 delivers to Telegram channel atomically (no keystroke interception)

This would solve the distribution dead-end WITHOUT needing Chrome → Telegram Web.
**Test:** Use `expert_capsule_handoff` or `trigger_cron` to push content to Agent 0 for relay.

### Per-Tenant Agent 0 (after onboarding)
Once Dr MAGfield is onboarded as its own tenant:
- Dr MAGfield Agent 0 handles Dr MAGfield Telegram/WhatsApp
- LV Agent 0 handles platform-level coordination
- Content is routed by tenant_id — no cross-tenant leakage (per Constitution Article 4.1)

## PEEL Loop (Plan → Execute → Evaluate → Learn)

### Plan (Scheduled Task — 8:55 AM)
- Planner reads SKILL_DISPATCH.md + last 3 pipeline_log entries
- Writes today_dispatch.json with tenant, topic, prompt, captions
- Token budget: ~10K. Cannot fail.

### Execute (Interactive Session — when Keith opens Cowork)
- Opus reads dispatch file
- Dispatches Sonnet via Chrome → Higgsfield for generation
- Dispatches content to channels (Chrome → Telegram Web, or Agent 0 relay when available)
- Token budget: ~60K for generation + distribution

### Evaluate (End of execution)
- Quality score the output (resolution, brand, platform readiness)
- Log to pipeline_log.json: date, tenant, score, engine, channel, tokens_estimated
- Sonnet returns [SESSION_OUTPUT] handoff
- SLI counter: +1 if content reached ≥1 channel

### Learn (Continuous — auto-prune + mothership)
- Apply 6 auto-prune rules at every run start
- Dead-end registry checked before any route attempted
- Browser agent self-diagnostics fed back via dispatch protocol updates
- Mothership daily brief checked for flywheel lessons (grounding score, corrections)
- Token efficiency: track estimated tokens per deliverable, flag if ratio worsens
- Weekly: review pipeline_log for patterns, update SKILL_DISPATCH.md

## Upcoming Cadence Actions

### Immediate (before next dispatch)
1. **Claude Code:** Set ADMIN_SECRET → run maestro_onboard for Dr MAGfield
2. **Test:** Can Agent 0 relay GEO content to Telegram? (would solve distribution)
3. **Test:** Chrome MCP from scheduled task (would enable automated generation)
4. **Interactive:** Distribute the 3-day backlog (2 assets at 6.0/6.0)

### This Week
- Onboard Dr MAGfield as separate tenant with own Agent 0
- First successful SLI delivery (break 0%)
- Validate Chrome → Instagram/TikTok upload path
- Process Agent 0's 147 pending queue items

### Next Week
- Onboard Eterna Science as separate tenant
- Per-tenant Agent 0 routing live
- Welcome broadcast to convert cold patients → warm
- Populate telegram_id / whatsapp_id in patient profiles
