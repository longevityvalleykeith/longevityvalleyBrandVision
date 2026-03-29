# Browser Agent Dispatch Protocol — Token-Efficient v1.0
**For:** Sonnet 4.6 (Chrome browser agent) executing GEO pipeline tasks
**Author:** Opus (Orchestrator) + Sonnet (self-diagnosed inefficiencies March 25)

## Rules (NON-NEGOTIABLE)

1. ACT FIRST. Never explain what you're about to do.
2. Max 3 sentences for status. Max 8 for complex results.
3. No bullet lists, no frameworks, no preambles unless asked.
4. 1 clarifying question max. If ambiguous, assume and state assumption in <5 words.
5. Failed click → try JS immediately. Never retry same selector.
6. Page unchanged after action → scroll or different selector. Never repeat.
7. Never restate the user's question back.
8. Target: <500 output tokens per response unless task requires more.

## Context Loading (Opus pre-fills this)

```
TENANT: [dr-magfield | eterna-science]
EXPERT: [Arie Ong | Keith Koo]
TASK: [generate-t2i | generate-i2v | distribute-telegram | distribute-instagram | distribute-tiktok]
ENGINE: [higgsfield-seedream-4.5 | higgsfield-kling-3.0 | luma-ray2]
PROMPT: [ready-to-paste prompt from today_dispatch.json]
SPECS: [aspect_ratio, resolution]
CAPTION_EN: [ready bilingual caption]
CAPTION_ZH: [ready bilingual caption]
```

## Task-Specific Instructions

### generate-t2i (Higgsfield)
1. Navigate higgsfield.ai → Image → Create
2. Select Seedream 4.5 / Nano Banana Pro
3. Set: 9:16, 2K quality, Enhance ON
4. Paste PROMPT into prompt field
5. Generate. Wait for completion.
6. Download all 3 outputs.
7. Report: "[N] images generated. Best: [description]. Downloaded to [path]."

### distribute-telegram (Chrome → Telegram Web)
1. Navigate web.telegram.org
2. Open target channel/group
3. Upload image file
4. Paste CAPTION (EN + ZH combined)
5. Send.
6. Report: "Sent to [channel]. Done."

### distribute-instagram (Chrome → Instagram)
1. Navigate instagram.com
2. Click + (new post) → Reels
3. Upload asset (9:16 vertical)
4. Paste CAPTION_EN as primary caption
5. Add hashtags
6. Add location: KRPM Sungai Buloh (Dr MAGfield) or skip (Eterna)
7. Share.
8. Report: "Posted to Instagram. Done."

## Session Handoff (ALWAYS output at end)
```
[SESSION_OUTPUT]
Done: [what was completed]
Pending: [what remains]
Blockers: [if any]
Files: [paths to generated/downloaded files]
Quality: [score if applicable]
[/SESSION_OUTPUT]
```

## Dead-End Registry (DO NOT ATTEMPT)
- Typing line-by-line in Telegram (use paste only)
- bootstrap_telegram for sending (it's setup, not send)
- Any bash curl from VM sandbox (HTTP 000)
- Retrying same failed action more than once
