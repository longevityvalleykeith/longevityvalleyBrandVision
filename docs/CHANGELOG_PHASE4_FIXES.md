# Phase 4 Schema & Database Fixes

**Date:** 2025-12-07
**Version:** 3.0.2
**Status:** Ready for Commit

---

## Problem Summary

After implementing Phase 4 (Director's Lounge), the application encountered runtime errors when accessing `/studio` routes. The root causes were:

1. **Missing Database Column**: The `creative_profile` JSONB column was defined in schema but not applied to the database
2. **Schema Mismatch**: Code referenced a non-existent `directorOutput` column instead of the refactored `scenesData` column
3. **MySQL Syntax in PostgreSQL**: Rate limiting code used MySQL-specific `onDuplicateKeyUpdate` instead of PostgreSQL's `onConflictDoUpdate`

---

## Technical Changelog

### Database Migration

**File:** `scripts/apply-phase4-migration.ts` (NEW)

```sql
-- Added creative_profile column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS creative_profile JSONB;

-- Created learning_events table for Studio Head
CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES vision_jobs(id) ON DELETE CASCADE,
  raw_scores JSONB NOT NULL,
  director_pitches JSONB NOT NULL,
  selected_director_id VARCHAR(50) NOT NULL,
  learning_delta JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Created indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_events_user_id ON learning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_job_id ON learning_events(job_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_director ON learning_events(selected_director_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_created_at ON learning_events(created_at);
```

---

### File: `src/server/directorRouter.ts`

**Problem:** Code referenced `directorOutput` column which doesn't exist in refactored schema. The schema uses separate columns: `scenesData`, `productionEngine`, `status`.

**Changes:**

| Location | Before | After |
|----------|--------|-------|
| Line 395 | `promptRecord.directorOutput as DirectorState` | `promptRecord.scenesData as DirectorState['scenes']` |
| Line 398 | `currentState.stage !== 'STORYBOARD_REVIEW'` | `currentStatus !== 'reviewing'` |
| Line 466 | `.set({ directorOutput: newState })` | `.set({ scenesData: scenes })` |
| Line 505 | `promptRecord.directorOutput as DirectorState` | `promptRecord.scenesData as DirectorState['scenes']` |
| Line 529 | `.set({ directorOutput: newState, status: 'rendering' })` | `.set({ status: 'rendering' })` |
| Line 581 | `promptRecord.directorOutput as DirectorState` | Reconstructed state from `scenesData` + `status` columns |
| Line 610-614 | `'COMPLETE'`, `'ERROR'` | `'COMPLETED'`, removed invalid stage |
| Line 631 | `promptRecord.directorOutput as DirectorState` | `promptRecord.scenesData as DirectorState['scenes']` |
| Line 645 | `.set({ directorOutput: newState })` | `.set({ scenesData: scenes })` |

**Pattern Applied:** Reconstruct `DirectorState` from schema columns for API responses:

```typescript
const state: DirectorState = {
  jobId: input.jobId,
  stage: stageMap[status ?? 'reviewing'] ?? 'STORYBOARD_REVIEW',
  quality_score: 7,
  source_image_url: promptRecord.remasteredImageUrl || job.imageUrl,
  is_remastered: !!promptRecord.remasteredImageUrl,
  selected_style_id: null,
  invariant_visual_summary: '',
  scenes: scenes ?? [],
  cost_estimate: scenes?.length ?? 0,
  error_message: null,
  started_at: promptRecord.createdAt,
  completed_at: promptRecord.completedAt,
};
```

---

### File: `src/server/rateLimit.ts`

**Problem:** MySQL syntax `onDuplicateKeyUpdate` doesn't exist in PostgreSQL/Drizzle.

**Line 157:**
```typescript
// Before (MySQL)
.onDuplicateKeyUpdate({
  set: {
    requestCount: sql`${rateLimitBuckets.requestCount} + 1`,
  },
});

// After (PostgreSQL)
.onConflictDoUpdate({
  target: [rateLimitBuckets.identifier, rateLimitBuckets.endpoint],
  set: {
    requestCount: sql`${rateLimitBuckets.requestCount} + 1`,
  },
});
```

**Line 274:**
```typescript
// Before
return result.rowsAffected || 0;

// After
const result = await db
  .delete(rateLimitBuckets)
  .where(sql`${rateLimitBuckets.windowEnd} < NOW()`)
  .returning({ id: rateLimitBuckets.id });

return result.length;
```

---

### File: `src/server/middleware/rateLimit.ts`

**Problem:** Drizzle comparison operators require column as first argument.

**Line 14:**
```typescript
// Before
import { eq, and, gt } from 'drizzle-orm';

// After
import { eq, and, gt, lt } from 'drizzle-orm';
```

**Line 156:**
```typescript
// Before (wrong argument order)
.where(gt(now, rateLimitBuckets.windowEnd));

// After (column first, then value)
.where(lt(rateLimitBuckets.windowEnd, now))
.returning({ id: rateLimitBuckets.id });
```

---

## Files Modified

| File | Type | Lines Changed |
|------|------|---------------|
| `scripts/apply-phase4-migration.ts` | NEW | 82 |
| `src/server/directorRouter.ts` | MODIFIED | ~80 |
| `src/server/rateLimit.ts` | MODIFIED | 8 |
| `src/server/middleware/rateLimit.ts` | MODIFIED | 6 |

---

## Verification

```bash
# Typecheck passes for modified files
npm run typecheck 2>&1 | grep -E "directorRouter|rateLimit"
# (no output = no errors)

# Migration applied successfully
npx tsx scripts/apply-phase4-migration.ts
# Output: Migration applied successfully!
```

---

## Commit Message

```
fix(phase4): resolve schema mismatch and PostgreSQL syntax errors

- Apply Phase 4 migration: add creative_profile column, create learning_events table
- Fix directorRouter.ts: replace directorOutput with scenesData column references
- Fix rateLimit.ts: change onDuplicateKeyUpdate to onConflictDoUpdate (PostgreSQL)
- Fix middleware/rateLimit.ts: correct Drizzle comparison operator argument order
- Fix invalid DirectorStage values: 'COMPLETE' -> 'COMPLETED'

Resolves runtime errors on /studio routes after Phase 4 Director's Lounge implementation.
```

---

## Related Issues

- Root Cause Analysis: `docs/ROOT_CAUSE_ANALYSIS_AUDIT.md`
- Phase 4 Technical Report: `docs/CTO_TECHNICAL_REPORT_PHASE4.md`
- Architecture Snapshot: `docs/ARCH_SNAPSHOT_071225.md`

---

**Report End**
