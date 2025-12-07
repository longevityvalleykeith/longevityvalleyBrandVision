# 📜 FINAL-DEV_SPEC.md: Longevity Valley Architecture (v3.0)

**Document Type:** Technical Architecture Review
**Audience:** CTO & Lead Engineer
**Purpose:** Evaluate Phase 4 system design decisions before implementation
**Stack:** Next.js 15 + Supabase (Postgres) + tRPC v11
**Last Updated:** December 8, 2025

---

## 0. Document Control

| Version | Date | Scope | Status |
|---------|------|-------|--------|
| 1.0 | Nov 30, 2025 | Initial architecture | ✅ Approved |
| 2.0 | Dec 2, 2025 | Security + Style Reference Pipeline | ✅ Approved |
| 3.0 | Dec 8, 2025 | **Phase 4: Rashomon Learning System** | 🟡 **Review Required** |

### Phase 4 Scope

This document evaluates the **Rashomon Learning System** architecture:

1. **Learning Mechanism:** Silent observation of user choices (not explicit preferences)
2. **Director System:** Three AI personalities with bias vectors applied to objective scores
3. **Data Capture:** `learning_events` table design and creative profile updates
4. **UI Impact:** "The Lounge" director selection interface

**What this document is NOT:**
- ❌ Implementation guide
- ❌ UI/UX specification
- ❌ API documentation

**What this document IS:**
- ✅ Architecture decision record
- ✅ Technical trade-off analysis
- ✅ System integration evaluation
- ✅ Risk assessment

---

## 1. System Architecture Overview

### Current State (Phase 3C - Approved)

```
User Upload → Gemini Analysis → Director Workflow → Production
              (Brand DNA)        (DeepSeek V3)      (Kling/Luma)
```

### Proposed State (Phase 4 - Under Review)

```
User Upload → The Eye → Director Selection → Chosen Director → Production
              (Gemini)   (User picks 1 of 3)  (DeepSeek V3)     (Kling/Luma)
                ↓              ↓
         Objective Scores  Learning Event
         (Ground Truth)    (Captured to DB)
                               ↓
                         Creative Profile Update
```

---

## 2. Core Design Decisions Requiring CTO Approval

### Decision 1: Gemini 2.5 Flash as "The Eye" (Objective Truth)

**Proposal:** Use Gemini 2.5 Flash exclusively for unbiased brand analysis.

**Rationale:**
- Provides ground truth Trinity scores (physics, vibe, logic)
- No bias applied at this stage
- Serves as baseline for measuring user preference drift

**Question for CTO:**
> Should we use Gemini 2.5 Flash or Gemini 2.0 Flash Thinking for The Eye?
> Trade-off: 2.5 Flash is faster, 2.0 Flash Thinking has explicit reasoning chains.

**Proposed Answer:** 2.5 Flash. Speed matters here, and we don't need reasoning chains for objective measurement.

---

### Decision 2: Director Bias Implementation

**Proposal:** Three "director personalities" all powered by **DeepSeek V3**, differentiated only by bias vectors applied to objective scores.

| Director | Bias Vector | Engine Preference |
|----------|-------------|-------------------|
| Physicist | `{physics: +0.2, vibe: -0.1, logic: 0}` | Kling AI |
| Aesthete | `{physics: -0.1, vibe: +0.2, logic: 0}` | Luma |
| Strategist | `{physics: 0, vibe: -0.1, logic: +0.2}` | Gemini Pro Video |

**Why Same Model (DeepSeek V3)?**
1. **Cost Efficiency:** One API key, one rate limit pool
2. **Consistent Quality:** Bias is mathematical, not model-dependent
3. **Simplified Testing:** Only test bias math, not model variance

**Example:**
```typescript
// The Eye provides objective truth
const objectiveScores = { physics: 0.65, vibe: 0.45, logic: 0.40 };

// Physicist applies +0.2 physics bias
const physicistView = {
  physics: Math.min(1.0, 0.65 + 0.2), // = 0.85 (clamped at 1.0)
  vibe: Math.max(0.0, 0.45 - 0.1),    // = 0.35
  logic: 0.40                          // = 0.40
};
// Result: Physicist recommends Kling (physics > 0.7 threshold)
```

**Question for CTO:**
> Is a ±0.2 bias range sufficient to create meaningfully different recommendations?
> Or should we increase to ±0.3?

**Proposed Answer:** Start with ±0.2. Can adjust based on A/B testing.

---

### Decision 3: Learning Events Table Design

**Proposal:** Capture every director selection as a learning event.

```sql
CREATE TABLE learning_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID NOT NULL,

  -- Ground truth from The Eye
  raw_scores JSONB NOT NULL,
  -- { physics: 0.65, vibe: 0.45, logic: 0.40 }

  -- All 3 pitches shown to user
  director_pitches JSONB NOT NULL,
  -- [{directorId, biasedScores, recommendedEngine}, ...]

  -- User's choice
  selected_director_id VARCHAR(50) NOT NULL,

  -- The learning signal
  learning_delta JSONB NOT NULL,
  -- { objectiveWinner: "physics", subjectiveChoice: "vibe", wasOverride: true }

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Question for CTO:**
> Should we also store the final video output URL in learning_events for A/B quality analysis?

**Proposed Answer:** No. Keep learning_events lean. Join with vision_job_video_prompts if needed.

---

### Decision 4: Creative Profile Update Algorithm

**Proposal:** After each learning event, update `users.creative_profile` (JSONB column).

```typescript
interface UserCreativeProfile {
  // Learned bias vector (starts at 0, evolves slowly)
  user_bias_vector: {
    physics: number;  // -1.0 to +1.0
    vibe: number;
    logic: number;
  };

  // Win rate per director
  director_win_rates: {
    physicist: number;   // 0.0 - 1.0
    aesthete: number;
    strategist: number;
  };

  // Metadata
  total_choices: number;
  override_rate: number;  // % of times user picked against objective winner
  last_updated: string;
}
```

**Update Logic:**
1. Increment `total_choices`
2. Update `director_win_rates[selected_director]`
3. If `wasOverride === true`, adjust `user_bias_vector` slightly toward chosen dimension
4. Recalculate `override_rate`

**Question for CTO:**
> How aggressively should we update user_bias_vector?
> Option A: Small steps (±0.05 per override)
> Option B: Larger steps (±0.1 per override)

**Proposed Answer:** Option A. Conservative learning prevents overfitting to noise.

---

## 3. Technical Concerns & Risk Assessment

### Concern 1: Director Pitch Generation Latency

**Issue:** Generating 3 director pitches requires:
- 3x DeepSeek API calls (script generation)
- Potential bottleneck if done sequentially

**Mitigation Options:**
1. **Parallel API Calls:** Fire all 3 simultaneously (reduces latency by 3x)
2. **Pre-computed Templates:** Directors use template-based pitches (no API call)
3. **Hybrid:** Use templates for pitch text, API only for routing decision

**Question for CTO:**
> Which approach? Parallel API calls cost 3x, templates sacrifice personality.

**Proposed Answer:** Parallel API calls. Cost is justified by UX quality.

---

### Concern 2: User Confusion (Too Many Choices?)

**Issue:** Showing 3 directors might overwhelm new users.

**UX Considerations:**
1. First-time users see all 3 cards (discovery)
2. Returning users see pre-selected "Recommended" director (based on profile)
3. Always allow override

**Question for CTO:**
> Should we A/B test "3 cards always" vs "1 recommended + 2 alternates"?

**Proposed Answer:** Yes. A/B test with 50/50 split.

---

### Concern 3: Cold Start Problem

**Issue:** New users have no creative profile. All directors equally likely.

**Proposed Solution:**
1. First 5 choices: Random assignment to force exploration
2. After 5 events: Start pre-selecting based on win rates
3. After 10 events: Enable adaptive UI (confidence indicators)

**Question for CTO:**
> Is 5-event threshold too low? Should we wait for 10?

**Proposed Answer:** 5 is fine. Allows faster personalization.

---

### Concern 4: Data Privacy (Learning Events)

**Issue:** `learning_events` table contains user preference data.

**Compliance Requirements:**
1. ✅ Row Level Security (RLS) enabled
2. ✅ Soft deletes on cascade (user deletion)
3. ❓ GDPR: Do we need explicit consent for "learning"?

**Question for CTO:**
> Legal review required? Or covered under existing ToS?

**Proposed Answer:** Legal review required. Add consent checkbox to onboarding.

---

## 4. Integration Points

### 4.1 Database Schema Changes

**New Table:**
```sql
CREATE TABLE learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES vision_jobs(id) ON DELETE CASCADE,
  raw_scores JSONB NOT NULL,
  director_pitches JSONB NOT NULL,
  selected_director_id VARCHAR(50) NOT NULL,
  learning_delta JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_events_user_id ON learning_events(user_id);
CREATE INDEX idx_learning_events_director ON learning_events(selected_director_id);
```

**Modified Table:**
```sql
ALTER TABLE users ADD COLUMN creative_profile JSONB;
```

**Migration Risk:** Low. Additive changes only, no breaking schema modifications.

---

### 4.2 API Surface Changes

**New tRPC Endpoints:**
```typescript
// Get all 3 director pitches for a job
director.getPitches(jobId: string)
  → { physicist: Pitch, aesthete: Pitch, strategist: Pitch }

// User selects a director (triggers learning event capture)
director.selectDirector(jobId: string, directorId: DirectorId)
  → { learningEventId: string, redirectUrl: string }

// Get user's creative profile
director.getProfile()
  → UserCreativeProfile | null
```

**Breaking Changes:** None. All new endpoints.

---

### 4.3 Frontend Components

**New Pages:**
- `/lounge` - Director selection interface

**New Components:**
- `TheLounge.tsx` - Container
- `DirectorCard.tsx` - Individual director card
- `DirectorGrid.tsx` - 3-column layout

**Design System Impact:** Requires new "card" component pattern. Should coordinate with design team.

---

## 5. Performance & Scalability Analysis

### Database Query Patterns

**Hot Path:**
```sql
-- On /lounge page load
SELECT * FROM vision_jobs WHERE id = $1;  -- Get objective scores

-- On director selection
INSERT INTO learning_events (...);        -- Capture event
UPDATE users SET creative_profile = $1 WHERE id = $2;  -- Update profile
```

**Query Performance:**
- `learning_events` writes: <50ms (indexed foreign keys)
- `users.creative_profile` JSONB update: <100ms
- Total latency: <150ms (acceptable)

**Scalability Concern:**
- `learning_events` table growth: ~1 row per user per job
- 10K users, 100 jobs each = 1M rows/year
- PostgreSQL handles this easily with proper indexing

---

### API Rate Limits

**DeepSeek V3:**
- Current plan: 10 req/s
- Director pitch generation: 3 req per /lounge load
- Max throughput: ~3 users/second (acceptable for MVP)

**Future Scaling:**
- If >3 users/sec, implement request queuing
- Or upgrade DeepSeek plan

---

## 6. Testing Strategy

### Unit Tests

```typescript
describe('Director Bias System', () => {
  it('applies physics bias correctly', () => {
    const raw = { physics: 0.65, vibe: 0.45, logic: 0.40 };
    const biased = applyBias(raw, 'physicist');
    expect(biased.physics).toBe(0.85);
  });

  it('clamps scores at 1.0', () => {
    const raw = { physics: 0.95, vibe: 0.45, logic: 0.40 };
    const biased = applyBias(raw, 'physicist');
    expect(biased.physics).toBe(1.0);  // 0.95 + 0.2 = 1.15 → clamped
  });
});

describe('Learning Delta Calculation', () => {
  it('detects override correctly', () => {
    const raw = { physics: 0.40, vibe: 0.85, logic: 0.35 };
    const delta = calculateDelta(raw, 'physicist');
    expect(delta.objectiveWinner).toBe('vibe');
    expect(delta.subjectiveChoice).toBe('physics');
    expect(delta.wasOverride).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Director Selection Flow', () => {
  it('captures learning event on selection', async () => {
    const jobId = await createTestJob();

    await api.director.selectDirector({ jobId, directorId: 'physicist' });

    const event = await db.learningEvents.findFirst({ where: { jobId } });
    expect(event).toBeTruthy();
    expect(event.selected_director_id).toBe('physicist');
  });

  it('updates user creative profile', async () => {
    const userId = 'test-user';

    await api.director.selectDirector({ jobId, directorId: 'physicist' });

    const user = await db.users.findUnique({ where: { id: userId } });
    expect(user.creative_profile.total_choices).toBe(1);
    expect(user.creative_profile.director_win_rates.physicist).toBeGreaterThan(0);
  });
});
```

### E2E Tests

```typescript
test('Full Rashomon Learning Flow', async () => {
  // 1. Upload image
  const upload = await page.uploadImage('test.jpg');

  // 2. Wait for analysis
  await page.waitForSelector('[data-testid="lounge-ready"]');

  // 3. Navigate to lounge
  await page.click('[data-testid="choose-director"]');

  // 4. Verify 3 director cards render
  const cards = await page.$$('[data-testid="director-card"]');
  expect(cards.length).toBe(3);

  // 5. Select physicist
  await page.click('[data-testid="select-physicist"]');

  // 6. Verify learning event captured
  const event = await db.learningEvents.findLast();
  expect(event.selected_director_id).toBe('physicist');
});
```

---

## 7. Rollout Plan

### Phase 4A: Backend Infrastructure (Week 1)

- [ ] Deploy `learning_events` table migration
- [ ] Deploy `users.creative_profile` column
- [ ] Implement bias application logic
- [ ] Implement learning event capture
- [ ] Implement profile update algorithm
- [ ] Deploy new tRPC endpoints
- [ ] Run integration tests

**Success Criteria:**
- All tests pass
- Learning events captured successfully in staging
- Profile updates complete within 150ms

---

### Phase 4B: Frontend UI (Week 2)

- [ ] Design director card components
- [ ] Implement /lounge page
- [ ] Implement director selection flow
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Deploy to staging

**Success Criteria:**
- /lounge loads in <2s
- All 3 director cards render correctly
- Director selection triggers learning event

---

### Phase 4C: Production Rollout (Week 3)

- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Monitor learning event capture rate (target: >95%)
- [ ] A/B test: 3 cards vs 1 recommended + 2 alternates
- [ ] Collect user feedback

**Success Criteria:**
- No production errors
- Learning events captured for >95% of selections
- User feedback positive (>70% satisfaction)

---

## 8. Open Questions for CTO Decision

### Critical Path Blockers

| # | Question | Impact | Proposed Answer |
|---|----------|--------|-----------------|
| 1 | Gemini 2.5 Flash vs 2.0 Flash Thinking for The Eye? | Model selection | **2.5 Flash** (speed) |
| 2 | Bias range: ±0.2 or ±0.3? | Recommendation diversity | **±0.2** (start conservative) |
| 3 | Director pitch generation: Parallel API or templates? | Latency vs cost | **Parallel API** (better UX) |
| 4 | A/B test UI: 3 cards vs 1 recommended? | User experience | **Yes, 50/50 split** |
| 5 | Learning threshold: 5 or 10 events? | Personalization speed | **5 events** (faster) |
| 6 | Legal review for learning system? | Compliance | **Required** (add consent) |

### Non-Blocking Questions

| # | Question | Impact | Can Defer To |
|---|----------|--------|--------------|
| 7 | Should we show confidence scores in UI? | UX polish | Phase 4D |
| 8 | Add "Surprise Me" random director mode? | Feature scope | Phase 4D |
| 9 | Export learning data for analytics? | Data science | Phase 5 |

---

## 9. Success Metrics (Phase 4)

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Learning Event Capture Rate | >95% | Events / Selections |
| Profile Update Latency | <150ms | p95 write time |
| /lounge Page Load | <2s | p95 total load |

### Product Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Director Selection Time | <30s | Time from /lounge to selection |
| Director Diversity | >20% | % users who try all 3 |
| Repeat Usage | >50% | % users with 3+ events |

### Learning Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Override Rate | 20-40% | % selections against objective winner |
| Profile Convergence | 10 events | Events until stable win rates |

---

## 10. Approval Checklist

**For CTO:**
- [ ] Approve Gemini 2.5 Flash as The Eye
- [ ] Approve ±0.2 bias range for directors
- [ ] Approve learning_events schema design
- [ ] Approve creative profile update algorithm
- [ ] Approve parallel API call strategy for pitches
- [ ] Request legal review for learning system consent

**For Lead Engineer:**
- [ ] Review database migration scripts
- [ ] Review tRPC endpoint security
- [ ] Review RLS policies for learning_events
- [ ] Review testing coverage plan
- [ ] Approve rollout timeline

**Next Steps After Approval:**
1. Legal adds consent checkbox to ToS
2. Lead Engineer creates Phase 4A sprint backlog
3. Design team finalizes director card mockups
4. Backend team implements migration + endpoints
5. Frontend team implements /lounge UI

---

**Document Status:** 🟡 Awaiting CTO & Lead Engineer Review
**Review Deadline:** December 10, 2025
**Target Start Date:** December 11, 2025 (pending approval)
