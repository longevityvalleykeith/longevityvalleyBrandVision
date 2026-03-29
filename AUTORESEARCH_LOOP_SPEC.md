---
name: lv-geo-meta-loop-success-criteria
description: Finalized success criteria for the GEO pipeline autonomous meta-skill loop — three-phase autoresearch system across Dr MAGfield, Amani Wellness, and Eterna Science tenants
type: project
---

# Autoresearch Loop — Success Criteria
**Finalized:** 2026-03-26 | **Author:** Human (Keith) + Opus (Orchestrator)

---

## 1. The Complete Autoresearch Skill

### What It Is
A **meta-skill** that targets other skills, runs a three-phase compound-improvement loop, and produces a before/after scorecard in the same language.

### Three Phases

#### Phase 1: SETUP (One-time, Human Involved)
```
OUTPUT: problem_registry.json + research_log.json + human approval
```
- Analyze the target skill (SKILL.md)
- Identify the specific failure modes (what "broken" looks like)
- Generate **binary test cases** (can be evaluated mechanically: 0 or 1)
- Build a **1-5 baseline rubric** so "before" and "after" are comparable
- Run baseline on current state
- Human approves before autonomy begins

#### Phase 2: AUTONOMOUS LOOP (No Human)
```
OUTPUT: research_log.json updated each iteration, loop stops when criteria met
```
- Pick first UNRESOLVED problem from registry
- Apply ONE mutation (change one thing only)
- Run binary test → score 0 or 1
- If 1 (solved): update registry, compound learnings, move to next problem
- If 0 (fail): log root cause, try next mutation angle
- Loop until: all solved OR 10 fails same problem OR 100K tokens/day exhausted OR human says STOP

**Mutation angles** (try in order):
1. Tool substitution — same goal, different tool
2. Route redesign — same destination, different path
3. Precondition removal — eliminate the failing pre-condition itself
4. Asset format change — same content, different format
5. Split or combine — atomic vs batch
6. Escalate to human — flag for debrief if all exhausted

#### Phase 3: DEBRIEF (Human Reviews)
```
OUTPUT: Full before/after scorecard comparing original rubric scores
```
- Re-run all binary tests → record final scores
- Re-score using original 1-5 rubric (same language as baseline)
- Report: what changed, what worked, what didn't
- Human approves updated SKILL.md for production

---

## 2. Eval Rubrics That Actually Work

### The Problem with 1-5 Rubrics
Most rubrics fail because:
- Dimensions are vague ("quality" = what exactly?)
- Scale is subjective ("4/5 quality" means different things to different runs)
- No ground truth — nothing to compare against
- Tokens spent ≠ progress made

### What Makes a Rubric Work: Binary First, 1-5 Second

**Rule 1: Binary tests are the real eval.** They answer "did it work?" with 0 or 1. Unambiguous. Repeatable. Compoundable.

**Rule 2: 1-5 is only for the Debrief comparison** — same rubric scored before and after, in the same language, so you can say "brand integrity went from 3.2 → 4.8."

**Rule 3: Every binary test must be falsifiable.**
- ❌ "Does the pipeline work?" → not falsifiable
- ✅ "Was any message delivered to any channel today?" → falsifiable (yes/no)
- ❌ "Is the prompt good?" → not falsifiable
- ✅ "Does the output pass quality gate (composite ≥ 4.0)?" → falsifiable

**Rule 4: Test the bottleneck, not the symptom.**
- P7 (SLI = 0/3) is the symptom. P4 (no send tool) is the bottleneck.
- Fix the bottleneck → symptom resolves automatically.

**Rule 5: One test per problem. If you need two tests, you have two problems.**

### Binary Test Design Template
```
PROBLEM_ID: P#
TEST_NAME: [exact thing being tested]
TEST_PROCEDURE: [exact steps, one per line]
BINARY: 0=[what fail looks like], 1=[what success looks like]
GROUND_TRUTH: [how we verify outside the system — human check, file existence, etc.]
```

---

## 3. Success Criteria for This Loop

### End-to-End Success (What We Want)
```
Target State:
  - SLI ≥ 80% (at least 4/5 delivery days by end of loop)
  - At least 1 asset delivered to at least 1 channel
  - Generation quality maintained at 6.0/6.0
  - All 3 tenants in active rotation (Dr MAGfield, Amani Wellness, Eterna Science)
  - Evening social upload validated (Instagram or TikTok)
```

### The 10 Binary Test Cases (v2.0 — from actual tool audit, CONVERGENCE_REPORT_20260327.md)

| ID | Name | Test Procedure | Binary | Current Status |
|----|------|----------------|--------|----------------|
| P0-1 | ADMIN_SECRET in MCP env | `verify_onboard_status(tenantId)` — "not found"=0, data=1 | 0=blocked, 1=unblocked | CONFIG_APPLIED_RESTART_PENDING |
| P0-2 | generate_speech valid URL | `generate_speech(text)` — undefined URL=0, valid=1 | 0=undefined, 1=valid | UNRESOLVED |
| P0-3 | generate_video no timeout | `generate_video` — timeout=0, valid URL=1 | 0=timeout, 1=valid | UNRESOLVED |
| P0-4 | start_intake expert found | `start_intake(expertId='dr-magfield')` — "not found"=0, started=1 | 0=not_found, 1=started | UNRESOLVED |
| P1 | Chrome→Telegram paste | Chrome: t.me/lv_agent_bot → Ctrl+V → Enter → msg in channel? | 0=not_sent, 1=sent | UNRESOLVED |
| P2 | VM image file accessible | VM reads PNG from host Downloads → 1440×2560 confirmed | 0=no_access, 1=accessible | UNRESOLVED |
| P3 | Patient channel IDs exist | `get_patient_roster` → any telegram_id or whatsapp_id populated? | 0=none, 1=at_least_1 | UNRESOLVED |
| P4 | Evidence strength ≥0.6 | `get_quality_dashboard` → evidence_strength ≥ 0.6? | 0=below, 1=pass | UNRESOLVED |
| P5 | SKILL.md updated | `lv-geo-content-distribute/SKILL.md` → bootstrap_telegram as sender? | 0=mentioned, 1=removed | UNRESOLVED |
| P6 | Social precondition removed | `lv-geo-social-evening/SKILL.md` → requires prior delivery? | 0=required, 1=removed | UNRESOLVED |
| AW-1 | Amani Wellness onboarded | Brand folder ID + positioning provided, SKILL.md created | 0=no, 1=yes | DEFERRED |

### Per-Tenant Skill Health (1-5 rubric, baseline → target)

| Dimension | Dr MAGfield Baseline | Dr MAGfield Target | Eterna Science Baseline | Eterna Science Target | Amani Wellness Baseline | Amani Wellness Target |
|-----------|---------------------|-------------------|-----------------------|----------------------|------------------------|-----------------------|
| Generation quality | 6.0/6.0 | maintain | 6.0/6.0 | maintain | N/A | TBD after onboarding |
| Distribution success | 0/3 days | 4/5 days | 0/3 days | 4/5 days | N/A | 4/5 days |
| Topic freshness | low | medium | low | medium | N/A | medium |
| Brand consistency | 5/5 | maintain | 3/5 | 5/5 | N/A | TBD |
| Caption quality | 5/5 | maintain | 4/5 | 5/5 | N/A | TBD |
| SLI % | 0% | 80% | 0% | 80% | N/A | 80% |

---

## 4. Persisting the Karpathy Loop

### Persistence Architecture
```
┌─────────────────────────────────────────────────────────────┐
│  SHARED MEMORY (survives session death)                     │
│  ├── MEMORY.md                     ← index                 │
│  ├── problem_registry.json          ← current state         │
│  ├── research_log.json             ← iteration history     │
│  └── skills/[tenant]/SKILL.md      ← living skill docs    │
│                                                             │
│  TRANSIENT (dies with session)                              │
│  ├── Loop agent context                                     │
│  ├── Claude Desktop MCP tools                               │
│  └── Interactive Chrome session                             │
└─────────────────────────────────────────────────────────────┘
```

### Why Persistence Matters
- Current problem: every scheduled invocation is transient → failures die without learning → same mistake repeated for 3 days
- Karpathy loop fix: research_log.json is the memory → each iteration reads prior failures → mutations compound
- Skill files in `Scheduled/` are persistent → next session loads them without re-reading

### What Gets Written to Disk (Survives Restart)
1. `problem_registry.json` — updated every iteration
2. `research_log.json` — full iteration history
3. `Scheduled/lv-geo-meta-loop/SKILL.md` — living document, updated after each debrief
4. `Scheduled/[tenant]/SKILL.md` — per-tenant skill docs updated after each improvement
5. `pipeline_log.json` — generation and distribution runs

### What Dies with Session
1. MCP tool connection state (Chrome, Luma, etc.)
2. In-memory loop agent state (but next session reads disk state)
3. Active Chrome browser session

### Loop Restart Protocol
```
ON SESSION START:
  1. Read MEMORY.md → load project context
  2. Read problem_registry.json → identify next UNRESOLVED problem
  3. Read research_log.json → check current_streak, consecutive_fails
  4. IF loop_status == RUNNING → resume from where it left off
  5. IF loop_status == STOPPED → await human debrief
  6. IF loop_status == SETUP_AWAITING_APPROVAL → wait for human

ON SESSION END:
  1. Write all state to problem_registry.json
  2. Write all iterations to research_log.json
  3. Mark loop_status appropriately
  4. THEN exit (state persists for next session)
```

### Scheduled Autonomy Setup
- Use `/loop` to schedule PEEL loop every 30 min during active hours (9 AM – 9 PM MYT)
- Loop reads problem_registry.json → picks first UNRESOLVED → tests one mutation → updates registry → logs
- If all RESOLVED or stopping criteria hit → loop sets status = DEBRIEF_NEEDED → alerts human

---

## 5. Tenant Onboarding: Amani Wellness (NEW)

Amani Wellness does not exist in any current document. To add it to the loop:

**Step 1:** Keith provides brand assets folder ID + brand positioning
**Step 2:** Run `extract_brand_voice` → populate Amani Wellness SKILL.md
**Step 3:** Add to rotation schedule (after Dr MAGfield + Eterna Science, when content-ready)
**Step 4:** Add P_AW-1 through P_AW-N problems to problem_registry

**Initial questions for Amani Wellness:**
- Expert name + contact?
- GEO anchor (location)?
- Core technology / treatment focus?
- Brand colors, tagline, design variants?
- Drive folder ID?
- Are there any existing source images/videos?

---

## 6. Baseline Scorecard (Before Loop)

| Metric | Dr MAGfield | Eterna Science | Amani Wellness |
|--------|-------------|----------------|----------------|
| Generation quality | 6.0/6.0 ✅ | 6.0/6.0 ✅ | N/A |
| Distribution success | 0/3 days ❌ | 0/3 days ❌ | N/A |
| SLI % | 0% | 0% | N/A |
| Evening social validated | NO ❌ | NO ❌ | N/A |
| SKILL.md updated | PARTIAL ⚠️ | PARTIAL ⚠️ | NO |
| Chrome→Telegram tested | NO ❌ | NO ❌ | NO |
| T2I→VM bridge exists | NO ❌ | NO ❌ | NO |
| PSV routing live | NO ❌ | NO ❌ | NO |
| 3 tenants active | 2/3 ❌ | 2/3 ❌ | NO |

**Overall pipeline health: CRITICAL BLOCKAGE (distribution dead, 3 days zero delivery)**
