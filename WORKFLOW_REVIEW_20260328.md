# Scheduled Task Workflow — Critical Review
**Date:** 2026-03-28 | **Period:** Days 1-6 (Mar 23-28) | **Reviewer:** Opus

---

## Executive Summary

7 scheduled tasks were running. 6 produced zero deliverables across 6 days. The one audit that identified the problem (March 26) documented auto-prune rules but never actually disabled the dead tasks. Estimated ~400K+ tokens burned for 0 shipped output from scheduled automation.

Today: 5 tasks killed, 1 paused, 1 rewritten. The pipeline goes from "diagnose and document" to "produce and hand off."

---

## Before (7 tasks, ~400K tokens burned, 0 deliverables)

| Task | Status | Ran | Output | Tokens Est. |
|---|---|---|---|---|
| lv-geo-content-daily | Enabled | Daily | Dispatch file (never used) | ~60K |
| lv-geo-content-distribute | Enabled | Mon-Sat | 0 — no sender tool | ~65K |
| lv-geo-social-evening | Enabled | Mon-Sat | 0 — cascading dead dep | ~45K |
| lv-geo-evaluate-learn | Enabled | Mon-Sat | 0 — scoring nothing | ~30K |
| lv-knowledge-refresh-sunday | Enabled | Sunday | 0 new KUs, re_verify fails | ~10K |
| dr-magfield-daily-geo | Disabled | — | — | 0 |
| dr-magfield-daily-video | Disabled | — | — | 0 |

**Root causes of failure:**
1. VM sandbox blocks ALL outbound HTTP (curl exit 56, egress proxy block)
2. generate_video times out at 60s (generation takes 2-4 min)
3. bootstrap_telegram is a setup tool, not a sender — entire distribution pipeline built on wrong assumption
4. All 48 patients cold (sessionCount=0), no channel IDs
5. Evening social had hard dependency on prior delivery (which never happened)
6. Evaluate-learn was scoring an empty output set
7. Knowledge refresh was re-indexing same 63 rules, re_verify_claims endpoint broken

**The meta-failure:** The March 26 audit correctly identified all 7 dead-end routes and wrote 6 auto-prune rules — but the rules were documentation, not automation. Nobody applied them. The dead tasks kept running for 3 more days.

---

## After (1 task enabled, produces 7+ files per run)

| Task | Status | Schedule | Expected Output |
|---|---|---|---|
| lv-geo-content-daily (v3) | ENABLED | Mon-Sat 9:00 AM | 7+ files: 2 Reels frames, 2 voiceover URLs, scripts, captions, CLI guide |
| lv-geo-content-distribute | KILLED | — | — |
| lv-geo-social-evening | KILLED | — | — |
| lv-geo-evaluate-learn | KILLED | — | Re-enable when there are outputs to score |
| lv-knowledge-refresh-sunday | PAUSED | — | Re-enable when new source material is available |
| dr-magfield-daily-geo | DEAD | — | — |
| dr-magfield-daily-video | DEAD | — | — |

---

## What the New Daily Task Does (proven today)

Every morning, the single enabled task produces:

1. **English Reels script** (hook → story → CTA, 15 seconds)
2. **Mandarin Reels script** (adapted, not literal translation)
3. **English voiceover** via generate_speech (MiniMax TTS — proven working)
4. **Mandarin voiceover** via generate_speech (proven working)
5. **English 9:16 visual frame** via Python/Pillow (1080x1920, brand overlays)
6. **Mandarin 9:16 visual frame** via Python/Pillow (CJK font rendering)
7. **Caption package** (IG EN/ZH + TikTok EN/ZH, 30 hashtags each)
8. **CLI assembly guide** (curl commands, Hailuo prompt, ffmpeg merge steps)

**What it does NOT attempt** (known failures):
- Video generation (60s timeout)
- Audio file download (egress blocked)
- Telegram delivery (no sender tool)
- Distribution of any kind

Those last-mile steps are handed off via the CLI assembly guide to either Keith's interactive session or Claude Code CLI.

---

## Proof of Concept (this session, 2026-03-28)

Assets produced for DR MAGfield "What If Pain Was Optional?" campaign:

| Asset | File | Size | Method |
|---|---|---|---|
| EN Reels cover 9:16 | reels_cover_9x16.png | 990KB | Python/Pillow |
| ZH Reels cover 9:16 | reels_cover_9x16_zh.png | 1010KB | Python/Pillow |
| Clean first-frame 9:16 | video_first_frame_9x16.png | 941KB | Python/Pillow |
| EN voiceover | MiniMax URL (live) | — | generate_speech |
| ZH voiceover | MiniMax URL (live) | — | generate_speech |
| EN caption package | REELS_PACKAGE.md | 3.2KB | Written |
| ZH caption package | REELS_PACKAGE_ZH.md | 2.5KB | Written |
| CLI assembly guide | CLI_ASSEMBLY_GUIDE.md | 3.9KB | Written |

---

## Knowledge System State (ground truth)

| Metric | Claimed (memory) | Actual (dashboard) | Gap |
|---|---|---|---|
| Knowledge units | 182 | 81 | Memory stale by 2x |
| Practice rules | 181 | 63 | Memory stale by 3x |
| Evidence strength | 0.355 | 0.355 | Confirmed — target 0.6 |
| Clinical accuracy | 0.744 | 0.756 | Close enough |
| Autonomous responses | — | 0 / 8 | 100% routed to expert |
| Learning insights applied | — | 0 | Zero learning loop |

**Fix needed:** Evidence strength won't improve by re-indexing the same 63 rules. Need to feed NEW source material (research papers on rotational magnetic therapy, clinical studies, Dr MAGfield product documentation) via batch_extract_knowledge or publish_expert_knowledge.

---

## Recommendations

### Immediate (this week)
1. **Run the new daily task once manually** ("Run now") to pre-approve tool permissions
2. **Feed new knowledge sources** — upload DR MAGfield product docs, rotational magnetic therapy research to improve evidence_strength from 0.355 → 0.6+
3. **Test CLI handoff** — have Keith or Claude Code CLI execute the assembly guide to close the video + distribution gap

### Short-term (next 2 weeks)
4. **Re-enable evaluate-learn** once daily task has produced 5+ days of output to score
5. **Build a real Telegram sender** — either find an MCP tool or use Chrome → Telegram Web in interactive session
6. **Populate patient channel IDs** — without telegram_id/whatsapp_id, no automated delivery is possible

### Medium-term (month)
7. **Re-enable knowledge refresh** once new source material has been added and re_verify_claims endpoint is fixed
8. **Add Instagram posting** via Chrome MCP once video pipeline is stable
9. **Build actual A/B testing** — produce 2 variants per day, measure engagement, feed back into content selection

---

## Lessons Learned

1. **Rules without enforcement are just documentation.** The March 26 audit wrote perfect auto-prune rules but never disabled the tasks. Write the rule AND apply it in the same session.
2. **Test every tool before building a workflow around it.** bootstrap_telegram, generate_video timeout, re_verify_claims failure — all discovered after the workflows were built.
3. **Scheduled tasks should only do what the VM can do.** MCP tool calls work. Outbound HTTP doesn't. File operations work. Chrome doesn't (from scheduled context).
4. **Token waste compounds.** 5 dead tasks × 6 days × ~20K tokens/run = ~600K tokens doing nothing. That's the cost of delayed pruning.
5. **Produce first, automate second.** Today's interactive session produced more in 1 hour than 6 days of scheduled automation.
