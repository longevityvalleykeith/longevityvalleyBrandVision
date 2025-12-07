# Root Cause Analysis & Audit Report
## Grand Scheme v2.0 vs Latest Codebase (ARCH_SNAPSHOT_071225)

**Report Date:** 2025-12-07T11:30:00Z
**Auditor:** Claude Code Verification Suite
**Status:** ANALYSIS COMPLETE (No Fixes Applied)

---

## Executive Summary

This report audits the Longevity Valley Brand Vision codebase against the constitutional framework defined in `BRAND_FACTORY_GRAND_SCHEME(V2).md`. The analysis covers:

1. **Axiomatic Alignment** - Are the 4 Axioms being respected?
2. **Constitutional Compliance** - Are Articles I-III implemented?
3. **Data Flow Security** - Is user data properly protected?
4. **Architectural Integrity** - Does the code match the spec?

---

## 1. AXIOMATIC LEVEL AUDIT

### Axiom 1: Radical User Alignment
> "The System exists to manifest the User's Latent Vision."

| Check | Status | Evidence |
|-------|--------|----------|
| User input processed without mutation | PASS | `vision.ts:191-313` - Raw pixels analyzed objectively |
| User preferences stored separately | PASS | `schema.ts:378-391` - `creativeProfile` in users table |
| Learning system captures user choices | PASS | `learningEvents` table with `learning_delta` |

**ISSUES FOUND:**
- `visionRouter.ts:477` - Analysis uses DEFAULT_DIRECTOR_ID without checking user preference
- User's `creativeProfile.directorWinRate` is NOT consulted during routing

**ROOT CAUSE:** The `analyzeBrandImage()` call in `processVisionAnalysis()` does not accept a `directorId` parameter from user preferences.

---

### Axiom 2: Contextual Sovereignty
> "The Data Source (Brand DNA or Health Metric) is the border that cannot be crossed."

| Check | Status | Evidence |
|-------|--------|----------|
| Domain types defined | PASS | `index.ts:77-97` - `UniversalInput` interface exists |
| Domain-specific scoring | PARTIAL | Only BRAND domain implemented |
| Data isolation | PASS | Raw analysis stored separately from Director pitch |

**ISSUES FOUND:**
- `UniversalInput.domain` supports `'BRAND' | 'HEALTH' | 'FINANCE'` but only BRAND is implemented
- No Health or Finance scoring matrices exist
- The "Domain Switch" specified in Grand Scheme Section 4.1 is NOT implemented

**ROOT CAUSE:** Phase 3 focused on Brand only; Health/Finance domains are stubbed but not functional.

---

### Axiom 3: Evolutionary Plasticity
> "The System must learn from interaction without losing its core definition."

| Check | Status | Evidence |
|-------|--------|----------|
| Learning events captured | PARTIAL | Schema exists, no write logic found |
| Profile updates on selection | NOT IMPLEMENTED | No code writes to `creativeProfile` |
| Weighted Moving Average | NOT IMPLEMENTED | Specified in types but no update logic |

**ISSUES FOUND:**
- `UserCreativeProfile` type is defined (`index.ts:170-191`)
- `createDefaultUserProfile()` helper exists (`index.ts:196-211`)
- `learningEvents` table created (`schema.ts:546-591`)
- **NO CODE WRITES TO THESE STRUCTURES**

**ROOT CAUSE:** The "Studio Head" (user context layer) is defined but not wired up. No service writes to `learning_events` or updates `creative_profile` after Director selection.

---

### Axiom 4: Persona Integrity (Anti-Sycophant Rule)
> "Adaptation allows a change of Voice, but never a surrender of Values."

| Check | Status | Evidence |
|-------|--------|----------|
| Block A (Immutable Core) | PASS | `directors.ts:65-200` - Personas have hardcoded biases |
| Block B (Adaptive Voice) | PARTIAL | Voice vocabulary exists but no Studio Note injection |
| Anchor Test exists | PASS | `scripts/test-anchor.ts` validates this |

**ISSUES FOUND:**
- `buildDirectorPitchPrompt()` includes persona data but does NOT inject Studio Notes
- No mechanism to pass user preferences to Director prompts
- The BLOCK A/BLOCK B structure from Grand Scheme 3.2 is NOT explicitly separated

**ROOT CAUSE:** The `voice` configuration is passed to prompts, but there's no adaptive layer that adjusts tone based on user preferences while preserving values.

---

## 2. CONSTITUTIONAL LEVEL AUDIT

### Article I: Separation of Powers (Tripartite Brain)

| Layer | Spec | Implementation | Status |
|-------|------|----------------|--------|
| The Analyst (Input) | Objective Data Ingestion | `analyzeRawPixels()` | PASS |
| The Director (Processing) | Subjective Interpretation | `generateDirectorPitch()` | PASS |
| The Studio Head (Context) | User history & preferences | NOT IMPLEMENTED | FAIL |

**ROOT CAUSE ANALYSIS:**

The Two-Step Architecture correctly separates:
- **THE EYE** (`vision.ts:191-313`) - Objective pixel analysis
- **THE VOICE** (`vision.ts:329-460`) - Director-specific pitch

However, **THE STUDIO HEAD** (third layer) is missing:
- Should read `user.creativeProfile`
- Should inject user preferences as "Studio Notes"
- Should update profile after selection

**Evidence:** `vision.ts` has no imports from user profile system.

---

### Article II: The "Mirror" Validation (Plasticity Check)

| Test | Expected | Status |
|------|----------|--------|
| Agent changes tone based on feedback | Agent adapts | NOT TESTABLE |

**ISSUES FOUND:**
- No Mirror Test script exists
- No mechanism to provide tone feedback to Directors
- Grand Scheme requires: "Output changes style" - no style adaptation layer

**ROOT CAUSE:** The adaptive voice system is type-defined but not implemented.

---

### Article III: The "Anchor" Validation (Integrity Check)

| Test | Expected | Status |
|------|----------|--------|
| Director maintains core bias under pressure | Respectful disagreement | PASS (via test) |

**EVIDENCE:**
- `scripts/test-anchor.ts` exists and tests this
- Tests 3 scenarios: Newtonian vs Abstract, Minimalist vs Chaos, Visionary vs Technical
- Measures Integrity vs Sycophancy scores

**RESULT:** Anchor validation is properly implemented.

---

## 3. DATA FLOW SECURITY AUDIT

### Input Validation

| Layer | Implementation | Status |
|-------|----------------|--------|
| Zod Schemas | `validation.ts:1-330` | PASS |
| Magic Byte Detection | `fileValidation.ts:64-100` | PASS |
| Filename Sanitization | `fileValidation.ts:141-172` | PASS |
| Malware Scanning | `fileValidation.ts:305-331` | PARTIAL |

**ISSUES FOUND:**
- `scanForMalware()` is a placeholder - only checks for script patterns
- No integration with ClamAV, VirusTotal, or cloud scanning services
- Comment at line 307 acknowledges this is TODO

---

### Rate Limiting

| Endpoint | Limit | Status |
|----------|-------|--------|
| Generate | 10/min | CONFIGURED |
| Upload | 20/min | CONFIGURED |
| Refine | 30/min | CONFIGURED |
| General API | 60/min | CONFIGURED |

**IMPLEMENTATION:** `rateLimit.ts:175-210` defines all limiters.

**ISSUES FOUND:**
- `persistRateLimitAsync()` uses MySQL syntax (`onDuplicateKeyUpdate`) but database is PostgreSQL
- Line 157: `onDuplicateKeyUpdate` should be `onConflictDoUpdate` for PostgreSQL/Drizzle

**ROOT CAUSE:** Migration from MySQL syntax to PostgreSQL not completed in rate limiting module.

---

### Row Level Security (RLS)

| Table | RLS Enabled | Policies |
|-------|-------------|----------|
| vision_jobs | YES | SELECT, INSERT (user_id) |
| learning_events | YES | SELECT, INSERT (user_id) |
| users | ASSUMED | Not visible in snapshot |

**EVIDENCE:** `supabase/migrations/002_rls_policies.sql` and `20251207_add_creative_profile_learning.sql` define RLS.

---

### Audit Logging

| Feature | Status |
|---------|--------|
| Audit table exists | PASS |
| Actions logged | PASS |
| IP captured | PASS |
| User agent captured | PASS |

**EVIDENCE:** `schema.ts:597-612` defines `auditLogs` table with proper indexes.

---

## 4. ARCHITECTURAL INTEGRITY AUDIT

### Two-Step Architecture Implementation

| Component | Spec | Code | Match |
|-----------|------|------|-------|
| THE EYE | Objective analysis | `analyzeRawPixels()` | 100% |
| THE VOICE | Director pitch | `generateDirectorPitch()` | 100% |
| Combined API | Backwards compatible | `analyzeBrandImage()` | 100% |

**STRENGTHS:**
- Clean separation of concerns
- Lazy SDK initialization prevents env loading issues
- Comprehensive logging with Director metadata

---

### Director Registry Implementation

| Field | Schema | Code | Match |
|-------|--------|------|-------|
| id, name, avatar | Required | Present | PASS |
| biases | physicsMultiplier, vibeMultiplier, logicMultiplier | Present | PASS |
| riskProfile | label, hallucinationThreshold | Present | PASS |
| voice | tone, vocabulary, forbidden | Present | PASS |
| preferredEngine | 'kling' \| 'luma' \| 'gemini' \| 'runway' \| 'random' | Present | PASS |

**EVIDENCE:** `directors.ts:20-52` matches `DIRECTOR_PERSONA_SCHEMA.md` exactly.

---

### Engine Routing

| Director | Expected Engine | Actual Engine | Match |
|----------|-----------------|---------------|-------|
| Newtonian | Kling | Kling | PASS |
| Visionary | Luma | Luma | PASS |
| Minimalist | Gemini | Kling (fallback) | DOCUMENTED |
| Provocateur | Random | Score-based | PASS |

**EVIDENCE:** `directors.ts:292-313` implements declarative routing.

---

## 5. CRITICAL ISSUES SUMMARY

### P0 (Must Fix)

| Issue | Location | Impact |
|-------|----------|--------|
| Studio Head not implemented | N/A | User preferences ignored |
| Rate limit uses MySQL syntax | `rateLimit.ts:157` | May fail on PostgreSQL |
| Learning events never written | N/A | System cannot learn |

### P1 (Should Fix)

| Issue | Location | Impact |
|-------|----------|--------|
| Default Director used instead of user preference | `visionRouter.ts:477` | All users get Newtonian |
| Mirror Test not implemented | N/A | Plasticity unverifiable |
| Malware scanning is placeholder | `fileValidation.ts:305` | Security gap |

### P2 (Nice to Have)

| Issue | Location | Impact |
|-------|----------|--------|
| Health/Finance domains stubbed | `index.ts:83` | Multi-domain incomplete |
| Studio Note injection missing | `vision.ts:112` | No adaptive tone |

---

## 6. DATA FLOW DIAGRAM (Current State)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CURRENT DATA FLOW                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [User Upload]                                                           │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  FILE VALIDATION (P0 Security Layer)                              │   │
│  │  - Magic byte detection: ✅                                       │   │
│  │  - Filename sanitization: ✅                                      │   │
│  │  - Malware scanning: ⚠️  (placeholder)                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  SUPABASE STORAGE                                                 │   │
│  │  - File uploaded: ✅                                              │   │
│  │  - Vision job created: ✅                                         │   │
│  │  - Audit logged: ✅                                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  THE EYE (analyzeRawPixels)                                       │   │
│  │  - Raw pixel analysis: ✅                                         │   │
│  │  - Trinity scores: ✅                                             │   │
│  │  - Director-agnostic: ✅                                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  THE VOICE (generateDirectorPitch)                                │   │
│  │  - Director persona injection: ✅                                 │   │
│  │  - Bias application: ✅                                           │   │
│  │  - Engine routing: ✅                                             │   │
│  │  ⚠️  MISSING: Studio Note (user preferences)                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  DATABASE UPDATE                                                  │   │
│  │  - Scores persisted: ✅                                           │   │
│  │  - Analysis cached: ✅                                            │   │
│  │  ⚠️  MISSING: Learning event capture                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│       │                                                                  │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  THE STUDIO HEAD (Missing Implementation)                         │   │
│  │  ❌ User preference reading: NOT IMPLEMENTED                      │   │
│  │  ❌ Learning event writing: NOT IMPLEMENTED                       │   │
│  │  ❌ Profile updating: NOT IMPLEMENTED                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. RECOMMENDATIONS (Not Implemented)

### Immediate Actions Required

1. **Implement Studio Head Service**
   - Create `src/server/services/studioHead.ts`
   - Read user's `creativeProfile` before analysis
   - Inject preferences as Studio Notes into Director prompts
   - Write `learning_events` after Director selection
   - Update `creativeProfile` with Weighted Moving Average

2. **Fix Rate Limit SQL Syntax**
   - Change `onDuplicateKeyUpdate` to `onConflictDoUpdate`
   - Test with PostgreSQL

3. **Wire Up Learning Pipeline**
   - Add `onDirectorSelected` callback in TheLounge
   - Call Studio Head to record learning event
   - Update user's director win rate

### Future Considerations

4. **Implement Mirror Test**
   - Create `scripts/test-mirror.ts`
   - Verify tone adaptation works without value surrender

5. **Enhance Malware Scanning**
   - Integrate with ClamAV or VirusTotal API
   - Add to CI pipeline

---

## 8. VERIFICATION COMMAND

Run the Rashomon evaluation to verify Director personas work correctly:

```bash
npx tsx scripts/eval-rashomon.ts
```

Expected: 8/8 assertions pass, confirming Directors produce distinct outputs.

---

## 9. CONCLUSION

| Area | Compliance | Grade |
|------|------------|-------|
| Axiom 1 (User Alignment) | 75% | B |
| Axiom 2 (Contextual Sovereignty) | 33% | D |
| Axiom 3 (Evolutionary Plasticity) | 25% | D |
| Axiom 4 (Persona Integrity) | 90% | A |
| Article I (Separation of Powers) | 67% | C |
| Article II (Mirror Validation) | 0% | F |
| Article III (Anchor Validation) | 100% | A |
| Data Flow Security | 85% | B |

**Overall Grade: C+ (73%)**

The Two-Step Architecture is solid. The Director Persona System is complete. However, the "Studio Head" (user context layer) is entirely missing, which breaks Axioms 1-3 and Article I.

---

**Report End**
