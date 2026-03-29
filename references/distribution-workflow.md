# GEO Content Distribution Workflow
**Version:** 1.0
**Date:** 2026-03-23
**Scope:** WhatsApp + Telegram + Social Media — PSV-routed, tenant-specific

---

## Architecture: Generate → Verify → Distribute

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CONTENT PIPELINE (upstream)                      │
│  Asset generated → Quality gate (composite ≥ 4.0) → READY          │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DISTRIBUTION ROUTER                               │
│                                                                      │
│  1. RESOLVE AUDIENCE                                                 │
│     ├─ get_patient_roster → all patients for tenant                  │
│     ├─ consent_check(patientId, "data_sharing") → filter consented   │
│     └─ get_patient_insights(patientId) → extract PSV signals         │
│                                                                      │
│  2. SEGMENT BY PSV                                                   │
│     ├─ PSV → Demographic Variant (direct/harmonious/formal)          │
│     ├─ PSV → Content Relevance Score (topic ↔ conditions match)      │
│     └─ PSV → Channel Preference (telegram_id? whatsapp_id? email?)   │
│                                                                      │
│  3. ROUTE TO CHANNELS (tenant-specific)                              │
│     ├─ Telegram API (primary) → bootstrap_telegram bot sends         │
│     ├─ Telegram Browser (fallback) → clipboard paste, single action  │
│     ├─ WhatsApp Business API → approved template broadcast           │
│     ├─ WhatsApp Channels → one-to-many broadcast post                │
│     ├─ WhatsApp Groups → browser clipboard paste                     │
│     ├─ Instagram Reels → browser upload with caption                 │
│     └─ TikTok → browser upload with caption                          │
│                                                                      │
│  4. CONFIRM DELIVERY + LOG                                           │
│     └─ Record: channel, timestamp, audience segment, engagement      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Patient State Vector (PSV) — Distribution Signals

The PSV is the patient's full state representation in the LV platform. For distribution routing, we extract these specific signals:

### PSV Signal Extraction

```
For each patient in get_patient_roster():

  1. IDENTITY & CHANNELS
     patient.identifiers[] → extract:
       - telegram_id    → can receive via Telegram
       - whatsapp_id    → can receive via WhatsApp
       - phone          → can receive via WhatsApp (if no whatsapp_id)
       - email          → can receive via email digest

  2. CONSENT STATUS
     consent_check(patientId, "data_sharing") → must be TRUE to send content
     consent_check(patientId, "ai_processing") → required for personalized routing

  3. HEALTH PROFILE (from get_patient_insights)
     insights.conditions[]    → match against content topic for relevance
     insights.biomarkers[]    → severity/acuity signals
     insights.risk_factors[]  → flag sensitive topics to AVOID

  4. SESSION HISTORY (from get_patient_roster)
     patient.sessionCount     → engagement level (0 = cold, 1-3 = warm, 4+ = active)
     patient.lastSessionDate  → recency (>30 days = dormant, needs re-engagement)

  5. DEMOGRAPHIC SEGMENT (derived)
     Based on name patterns, conditions, session topics:
       - "direct"     → sports/performance focus, likely golfer segment
       - "harmonious" → wellness/preventive focus, likely health-conscious women
       - "formal"     → family/clinical focus, likely referral or multi-generational
```

### PSV → Distribution Decision Matrix

| PSV Signal | Distribution Action |
|-----------|-------------------|
| Has telegram_id + consented | Send via Telegram API (primary channel) |
| Has whatsapp_id + consented | Send via WhatsApp Business API |
| Has phone only + consented | Add to WhatsApp Channels audience |
| sessionCount = 0 (cold) | Send intro/welcome content only, lower frequency (1x/week) |
| sessionCount 1-3 (warm) | Standard cadence — content matching their conditions |
| sessionCount 4+ (active) | Full cadence — all relevant content + exclusive previews |
| lastSession > 30 days (dormant) | Re-engagement sequence: best-of content, special offers |
| conditions match content topic | HIGH relevance — prioritize delivery on preferred channel |
| conditions conflict with topic | SKIP — don't send cardiovascular content to someone with anxiety about it |
| No consent | DO NOT SEND — skip entirely, log as blocked |

### PSV → Demographic Variant Routing

| Variant | PSV Indicators | Content Tone | Primary Channel |
|---------|---------------|-------------|----------------|
| `direct` | Male, golf-related conditions (sports injury, performance), KRPM member | Results-oriented, data-driven | WhatsApp Group (golfer community) |
| `harmonious` | Female, wellness-focused (sleep, energy, preventive), family sessions | Nurturing, journey-oriented | Telegram Channel + WhatsApp Status |
| `formal` | Family groups, clinical referrals, specific diagnoses, multi-generational | Evidence-based, trust-building | WhatsApp Business API (personal) |

---

## 2. Tenant-Expert Linkage

Each tenant has a specific expert-channel mapping. Content is distributed ONLY through channels owned by the tenant, linked to the appropriate expert.

### Tenant: Dr MAGfield

| Channel | Identifier | Type | Audience |
|---------|-----------|------|----------|
| Telegram Group | BMW Wellness AI 群聊 | Group chat | Active patients + golf community |
| Telegram Bot | @LongevityValleyAI | Bot (Agent 0) | Automated delivery via bootstrap_telegram API |
| WhatsApp Business | TBD (tenant-specific number) | Business API | Direct patient communication |
| WhatsApp Channel | TBD | Broadcast | One-to-many brand updates |
| WhatsApp Group(s) | TBD (KRPM golfer groups) | Manual/browser | Community engagement |
| Instagram | TBD (@drmagfield) | Reels upload | Public brand awareness |
| TikTok | TBD | Video upload | Public brand awareness |

**Expert linkage:** Arie Ong Jia Qi (王泇淇) → All Dr MAGfield channels (Keith Koo is platform admin only, NOT Dr MAGfield's patient-facing expert)
**GEO tag:** KRPM Sungai Buloh in every post

### Tenant: Eterna Science

| Channel | Identifier | Type | Audience |
|---------|-----------|------|----------|
| Telegram | TBD | Channel/Group | EECP/PEMF patient community |
| WhatsApp Business | TBD | Business API | Clinical patient communication |
| WhatsApp Channel | TBD | Broadcast | Science/health updates |
| Instagram | TBD (@eternascience) | Reels upload | Public brand awareness |

**Expert linkage:** Keith Koo → All Eterna Science channels (sole expert)
**GEO tag:** TBD (extract when brand voice is established)

### Tenant: RENN / Carol Triple Wealth

Channels not yet configured. As brand voices are extracted and channels established, add to this mapping.

---

## 3. Channel-Specific Formatting

### 3a. Telegram — API Delivery (PRIMARY)

**Method:** `bootstrap_telegram` MCP tool → Bot API sends message + media

**Why API over browser:** The v1 browser delivery caused 10+ duplicate messages because line-by-line typing triggered the LV Agent 0 bot on each keystroke. API delivery sends the complete message atomically — no keystroke interception possible.

```
TELEGRAM MESSAGE FORMAT (single atomic send):

[Video/Image attachment]

🎬 {Brand} GEO Brand Content — {Content Type}

🏌️ {Brand} | {Tagline EN}
📍 GEO: {Location}

{Caption EN — 1-2 sentences}

{Caption ZH — 1-2 sentences}

#{Brand hashtags} #{GEO hashtags} #{Topic hashtags}

🎯 {Parent Brand} | {Tenant Brand}
Generated via {Platform} — {Date}
```

**Formatting rules:**
- Attach video/image FIRST, then caption
- Bilingual: English block, then Chinese block (not interleaved)
- Max 3 lines of hashtags
- No emoji spam — max 4-5 emoji per message
- Include CDN link only if video exceeds Telegram's 50MB upload limit

**API delivery steps:**
1. Confirm bot token is active via `bootstrap_telegram` (check, don't re-bootstrap)
2. Resolve target chat ID (group/channel)
3. Send media + caption as a single API call
4. Verify delivery (check for error response)
5. Log: channel, chat_id, message_id, timestamp

### 3b. Telegram — Browser Fallback

**When to use:** Only if API delivery fails (bot token expired, API error)

**Critical fix from v1:** NEVER type message line-by-line. Always:
1. Compose full message text in clipboard
2. Navigate to Telegram Web → target group
3. Single paste action (Ctrl+V) into message field
4. Attach media file
5. Single Enter/Send action

**This prevents the bot interception problem entirely.**

### 3c. WhatsApp Business API

**Method:** Programmatic via approved message templates

**Template structure (must be pre-approved by Meta):**

```
Template: lv_geo_content_update

Header: [VIDEO/IMAGE]
Body: 🏌️ {{brand_name}} — {{tagline}}
      📍 {{geo_location}}

      {{caption_primary_language}}

      {{caption_secondary_language}}

Footer: {{parent_brand}} | Powered by Longevity Valley AI

Buttons: [View Full Video] [Book Appointment] [Learn More]
```

**Delivery rules:**
- Only send to patients with whatsapp_id in identifiers AND data_sharing consent
- Respect 24-hour messaging window rules
- Template messages for broadcasts (outside 24h window)
- Freeform messages only within active conversation windows
- Max 1 content message per patient per day

### 3d. WhatsApp Channels (Broadcast)

**Method:** Browser agent posts to WhatsApp Channel

**Per-tenant channels:** Each tenant has its own WhatsApp Channel for brand updates

**Content format:**
```
{Brand} | GEO Content Update

{Caption EN}

{Caption ZH}

📍 {Location}
#{hashtags}
```

**Media:** Attach video/image directly (WhatsApp Channels support rich media)

### 3e. WhatsApp Groups (Manual/Browser)

**Method:** Claude in Chrome clipboard paste (same fix as Telegram fallback)

**Per-tenant groups:** Each tenant may have multiple WhatsApp groups for different communities

**Rules:**
- Identify target group(s) for the tenant
- Compose full message + media
- Single clipboard paste — no line-by-line typing
- One post per group per day maximum
- Include call-to-action (book appointment, visit lounge)

### 3f. Instagram Reels

**Method:** Claude in Chrome browser upload

**Format requirements:**
- Video: 9:16 aspect ratio, 1080x1920, 5-60 seconds
- Caption: Max 2200 characters
- Hashtags: 20-30 relevant tags (mix of brand + GEO + topic)
- Cover image: Auto-select or specify first frame

**Caption format:**
```
{Caption EN — 2-3 sentences with hook}

{Caption ZH — 2-3 sentences}

.
.
.

#{30 hashtags — brand, GEO, topic, industry}
```

### 3g. TikTok

**Method:** Claude in Chrome browser upload

**Format requirements:**
- Video: 9:16, 1080x1920, 5-60 seconds
- Caption: Max 300 characters (much shorter than Instagram)
- Hashtags: 3-5 maximum (TikTok penalizes hashtag spam)

**Caption format (Chinese primary for MY market):**
```
{Hook in ZH — 1 sentence} {Hook in EN — 1 sentence}
#{3-5 hashtags}
```

---

## 4. Distribution Scheduling

### Time-of-Day Optimization (Malaysia Time, UTC+8)

| Channel | Best Send Time | Rationale |
|---------|---------------|-----------|
| Telegram Groups | 8:00-9:00 AM | Morning check, before golf tee times |
| WhatsApp Business | 10:00-11:00 AM | Mid-morning, professional window |
| WhatsApp Channels | 12:00-1:00 PM | Lunch break browsing |
| WhatsApp Groups | 6:00-7:00 PM | Evening wind-down, family time |
| Instagram Reels | 7:00-9:00 PM | Peak social browsing (MY market) |
| TikTok | 8:00-10:00 PM | Peak TikTok engagement (MY market) |

### Distribution Cadence Per Channel

| Channel | Dr MAGfield | Eterna Science | RENN (when active) |
|---------|-------------|----------------|-------------------|
| Telegram | Daily | 3x/week | 1x/week |
| WhatsApp Business | Per PSV (active patients daily, warm 2x/week) | Per PSV | Per PSV |
| WhatsApp Channels | Daily | 3x/week | 1x/week |
| WhatsApp Groups | 3x/week | 2x/week | 1x/week |
| Instagram Reels | Daily | 3x/week | 1x/week |
| TikTok | Daily | 3x/week | 1x/week |

### Distribution Sequence (Per Content Asset)

When a new GEO content asset passes quality gate:

```
T+0 min:   Telegram API → tenant group/channel (fastest, API delivery)
T+15 min:  WhatsApp Business API → consented active patients (personalized)
T+30 min:  WhatsApp Channel → broadcast update (one-to-many)
T+60 min:  WhatsApp Groups → community posts (browser, during optimal time)
T+120 min: Instagram Reels → public upload (timed to evening peak)
T+150 min: TikTok → public upload (timed to late evening peak)
```

If the asset was generated in the morning (9 AM), the sequence naturally spreads across the day's optimal windows.

---

## 5. Consent & Safety Gates

### Pre-Distribution Checklist

For EVERY distribution action, verify:

```
□ Asset passed quality gate (composite ≥ 4.0)
□ Content does NOT make specific clinical claims (quality dashboard shows clinical_accuracy: 0.34)
□ Content is appropriate for target demographic variant
□ For personalized (WhatsApp Business): consent_check(patientId, "data_sharing") = TRUE
□ For AI-personalized routing: consent_check(patientId, "ai_processing") = TRUE
□ Patient's PSV does not indicate contraindicated topic
□ No more than 1 content message per patient per day per channel
□ Message formatted for specific channel (not one-size-fits-all)
□ Bilingual content included (EN + ZH)
□ GEO tags match tenant's actual location
```

### Content Safety Rules

Given the quality dashboard findings (clinical accuracy: 0.34):
- Content MUST focus on brand/lifestyle messaging, NOT specific clinical claims
- Avoid: dosage recommendations, treatment protocols, diagnostic information
- Allowed: brand awareness, lifestyle imagery, appointment booking CTAs, facility showcases
- All clinical claims must be reviewed by Keith Koo before distribution

### "Not Authorized" Error Handling

The v1 Telegram delivery showed repeated "Not authorized" errors from LV Agent 0. This means:

1. The Telegram bot (Agent 0) is active in the BMW Wellness AI group
2. It responds to messages but requires registered/authorized users
3. When the browser agent typed line-by-line, each partial line triggered a bot response

**Fix:** API delivery sends as the BOT ITSELF (not as a user typing). No authorization conflict because the bot is sending, not receiving.

**Fallback fix:** If using browser, paste as a single message. The bot will only see ONE message and respond once (acceptable).

---

## 6. Progressive Distribution Improvement

### Tracking Metrics (Per Channel, Per Tenant)

Log after each distribution:

```json
{
  "distribution_id": "uuid",
  "content_run_id": "links to pipeline_log run_id",
  "channel": "telegram_api|whatsapp_business|whatsapp_channel|whatsapp_group|instagram|tiktok",
  "tenant": "dr-magfield",
  "demographic_variant": "direct|harmonious|formal",
  "audience_size": 0,
  "consented_audience": 0,
  "delivered_to": 0,
  "send_time": "ISO-8601",
  "optimal_window": true,
  "delivery_method": "api|browser_paste",
  "errors": [],
  "engagement": {
    "views": null,
    "reactions": null,
    "shares": null,
    "link_clicks": null,
    "appointment_bookings": null
  }
}
```

### Improvement Signals

| Signal | Action |
|--------|--------|
| Low engagement on a channel | Shift content type or posting time |
| High engagement on specific topic | Increase frequency for that knowledge unit |
| "Not authorized" errors | Re-bootstrap Telegram bot, check permissions |
| Delivery failures > 3 consecutive | Switch to fallback method, alert admin |
| Patient unsubscribes/blocks | Remove from distribution list, log reason |
| High appointment booking rate | Prioritize that content type + demographic variant |

---

## 7. Rollout Plan

### Phase 1 (This Week): Telegram Only
- Fix API delivery via `bootstrap_telegram`
- Test single-message paste as browser fallback
- Deliver to BMW Wellness AI 群聊 daily
- Establish quality baseline

### Phase 2 (Week 2): + WhatsApp Channels
- Create tenant-specific WhatsApp Channels
- Configure broadcast templates
- Add to distribution sequence

### Phase 3 (Week 3): + WhatsApp Business API + Groups
- Register WhatsApp Business API templates with Meta
- Map patient whatsapp_id identifiers
- Implement PSV-based personalized routing
- Add community group delivery

### Phase 4 (Week 4): + Instagram Reels + TikTok
- Set up tenant social accounts if not existing
- Configure browser upload workflows
- Implement evening peak scheduling
- Full 6-channel distribution operational

### Phase 5 (Month 2): Full PSV Automation
- All channels automated on schedule
- PSV-driven content matching live
- Engagement metrics feeding back into content pipeline
- Progressive improvement loop fully operational
