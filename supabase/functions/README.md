# Supabase Edge Functions

This directory contains Supabase Edge Functions for the Longevity Valley Brand Content Factory.

## Directory Structure

```
supabase/
├── config.toml                 # Supabase project configuration
├── functions/
│   ├── _shared/               # Shared utilities and types
│   └── tests/
│       └── director-flow.ts   # Headless tests for Director Mode
└── migrations/
    ├── 001_initial_schema.sql       # Initial database schema
    ├── 002_rls_policies.sql         # Row-Level Security policies
    ├── 003_storage_buckets.sql      # Storage bucket configuration
    └── 004_seed_data.sql            # Seed data for testing
```

## Running Tests

### Using Vitest (Recommended)

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest run supabase/functions/tests/director-flow.ts
```

### Using Deno (Alternative)

```bash
# Run with Deno
deno test --allow-env --allow-net supabase/functions/tests/director-flow.ts
```

## Test Requirements

The `director-flow.ts` tests **MUST pass** before building any React UI. These tests validate:

1. ✅ Production engine routing (Physics → Kling, Vibe → Luma, Logic → Gemini Pro)
2. ✅ Integrity scoring and job flagging (< 0.4 = flagged)
3. ✅ Style reference generation (Flux-Dev img2img)
4. ✅ Traffic light system (PENDING → GREEN/YELLOW/RED)
5. ✅ YELLOW flow with conversation context
6. ✅ Production engine fallbacks and circuit breakers
7. ✅ Rate limiting per user
8. ✅ Input validation and sanitization
9. ✅ Scene data structure
10. ✅ End-to-end flow

## Manus AI Integration

For running headless tests via Manus AI, use:

```bash
npx vitest run supabase/functions/tests/director-flow.ts
```

All test exports are available for import:

```typescript
import {
  determineProductionEngine,
  shouldFlagJob,
  processAnalysis,
  generateFluxPreview,
  generateStyleReference,
  processYellowFeedback,
  dispatchToProduction,
  makeGenerateRequest,
  uploadFile,
  createMockScene,
  getCircuitState,
} from './director-flow';
```

## Database Migrations

Apply migrations in order:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually
psql $DATABASE_URL -f supabase/migrations/001_initial_schema.sql
psql $DATABASE_URL -f supabase/migrations/002_rls_policies.sql
psql $DATABASE_URL -f supabase/migrations/003_storage_buckets.sql
psql $DATABASE_URL -f supabase/migrations/004_seed_data.sql
```

## Environment Variables

Ensure these are set before running tests:

```bash
# Required for production
DEEPSEEK_API_KEY=sk-xxx
FAL_API_KEY=xxx
GEMINI_API_KEY=xxx
KLING_API_KEY=xxx
LUMA_API_KEY=xxx

# Optional for tests (uses mocks)
DATABASE_URL=postgresql://...
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run Director Flow Tests
  run: npx vitest run supabase/functions/tests/director-flow.ts
  env:
    NODE_ENV: test
```
