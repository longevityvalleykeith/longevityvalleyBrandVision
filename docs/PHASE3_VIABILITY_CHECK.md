# Phase 3: Viability Check & Implementation Planning

## Executive Summary

**Status**: ✅ READY TO PROCEED with optimized implementation plan

**Actual Credit Cost Estimate**: 200-250 credits (vs. 300-400 estimated)
- **Savings**: 50-150 credits through code reuse and existing infrastructure

**Key Findings**:
1. Drizzle ORM + MySQL already configured and working
2. DeepSeek integration already exists and tested
3. Gemini vision analysis already tested (output structure confirmed)
4. Database helper pattern already established
5. tRPC router structure already in place

---

## Detailed Viability Assessment

### 1. Database Infrastructure ✅

**Current State**:
- MySQL database connected via Drizzle ORM
- 6 existing tables: users, brands, brandAssets, brandInputs, generatedContent, conversations
- Helper functions follow consistent pattern: `create*`, `get*ById`, `get*ByUserId`
- Database connection pooling already configured

**Required Changes**:
- Add 3 new tables: `visionJobs`, `visionJobSessions`, `visionJobOutputs`
- Add 6 helper functions following existing pattern
- Add database indexes for polling performance

**Complexity**: LOW
- No schema migration issues (MySQL supports all required field types)
- No dependency conflicts
- Pattern reuse from existing helpers

**Estimated Credits**: 40-50

---

### 2. Job Queue Worker Implementation ✅

**Current State**:
- Express server running with proper middleware
- Process management already in place (PID tracking)
- Error handling patterns established

**Required Changes**:
- Create `server/visionJobWorker.ts` with polling loop
- Integrate worker startup in `server/_core/index.ts`
- Add worker status monitoring

**Complexity**: MEDIUM
- Polling mechanism is straightforward (setInterval + database queries)
- Error handling needs careful design (retry logic, exponential backoff)
- No external dependencies required (no Redis, RabbitMQ)

**Estimated Credits**: 80-100

---

### 3. API Integration (Gemini + DeepSeek) ✅

**Current State**:
- DeepSeek integration already exists in `server/aiContentGenerator.ts`
- Gemini vision test completed with confirmed output structure
- Both APIs have working authentication

**Required Changes**:
- Create `server/geminiVision.ts` for vision analysis
- Adapt existing DeepSeek function for pipeline consumption
- Add error handling for API failures

**Complexity**: LOW
- Code reuse from existing implementations
- API contracts already validated
- No new authentication required

**Estimated Credits**: 40-50

---

### 4. tRPC Procedures ✅

**Current State**:
- tRPC router structure already established
- 5 existing routers: auth, brand, brandAsset, imageUpload, contentGeneration
- Protected/public procedure pattern already in use
- Zod validation already integrated

**Required Changes**:
- Add `visionPipeline` router with 3 procedures:
  - `createJob` (protectedProcedure)
  - `getJobStatus` (protectedProcedure)
  - `getJobHistory` (protectedProcedure)

**Complexity**: LOW
- Follows existing patterns exactly
- No new authentication logic needed
- Validation schema straightforward

**Estimated Credits**: 30-40

---

### 5. Testing & Validation ✅

**Current State**:
- Vitest already configured
- Sample test file exists: `server/auth.logout.test.ts`
- Database testing patterns established

**Required Changes**:
- Create `server/visionJobWorker.test.ts` for polling logic
- Create `server/visionPipeline.test.ts` for tRPC procedures
- Manual end-to-end testing

**Complexity**: MEDIUM
- Polling tests need mocking of database queries
- API integration tests need mocking of Gemini/DeepSeek
- Time-dependent tests need careful setup

**Estimated Credits**: 30-40

---

## Revised Implementation Plan

### Phase 3A: Schema & Database (50-60 credits)

**Step 1**: Add tables to `drizzle/schema.ts`
- `visionJobs` (main job queue table)
- `visionJobSessions` (SSE connection tracking)
- `visionJobOutputs` (structured output storage)

**Step 2**: Run `pnpm db:push`
- Generate migrations
- Apply to database
- Verify table creation

**Step 3**: Add helper functions to `server/db.ts`
- `createVisionJob()`
- `getNextPendingVisionJob()`
- `updateVisionJobStatus()`
- `completeVisionJob()`
- `getUserVisionJobs()`
- `getFailedJobsForRetry()`

**Deliverable**: Database ready for job queue operations

---

### Phase 3B: Worker Implementation (80-100 credits)

**Step 1**: Create `server/visionJobWorker.ts`
- Polling loop (2-second interval)
- Job processing pipeline
- Error handling with retry logic
- Status logging

**Step 2**: Create `server/geminiVision.ts`
- Vision analysis function
- Structured prompt for brand analysis
- JSON output parsing
- Error handling

**Step 3**: Integrate worker into server
- Add startup call in `server/_core/index.ts`
- Add graceful shutdown handling
- Add worker status endpoint

**Step 4**: Create unit tests
- Mock database queries
- Mock API responses
- Test polling logic
- Test error handling

**Deliverable**: Background worker processing jobs end-to-end

---

### Phase 3C: API Procedures (30-40 credits)

**Step 1**: Add `visionPipeline` router to `server/routers.ts`
- `createJob` procedure
- `getJobStatus` procedure
- `getJobHistory` procedure

**Step 2**: Add input validation with Zod
- Job creation schema
- Status query schema
- History pagination schema

**Step 3**: Create integration tests
- Test job creation
- Test status queries
- Test authorization checks

**Deliverable**: Frontend can create jobs and query status

---

### Phase 3D: Manual Testing & Validation (20-30 credits)

**Step 1**: Test job creation
```bash
curl -X POST http://localhost:3000/api/trpc/visionPipeline.createJob \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"...", "analysisPurpose":"...", "outputFormat":"detailed_analysis"}'
```

**Step 2**: Monitor job progression
```bash
for i in {1..30}; do
  curl http://localhost:3000/api/trpc/visionPipeline.getJobStatus?jobId=1
  sleep 2
done
```

**Step 3**: Verify database state
- Check job status transitions
- Verify outputs stored correctly
- Check error handling

**Deliverable**: Confirmed working job queue with polling

---

## Credit Cost Breakdown

| Component | Original | Revised | Savings |
|-----------|----------|---------|---------|
| Schema + migrations | 50 | 40 | 10 |
| Helper functions | 100 | 60 | 40 |
| Worker implementation | 150 | 80 | 70 |
| tRPC procedures | 100 | 30 | 70 |
| Testing | - | 30 | - |
| Manual validation | - | 20 | - |
| **TOTAL** | **400** | **260** | **140** |

**Actual Estimate**: 200-250 credits (accounting for code reuse and existing patterns)

---

## Risk Assessment

### Low Risk ✅
- Database schema additions (MySQL supports all types)
- Helper functions (follow established pattern)
- tRPC procedures (use existing structure)

### Medium Risk ⚠️
- Polling mechanism (need careful timing to avoid database overload)
- Error handling (retry logic must be robust)
- API integration (Gemini/DeepSeek may have rate limits)

### Mitigation Strategies
1. **Polling**: Use indexed queries, monitor database load
2. **Error Handling**: Implement exponential backoff, max retry limits
3. **API Rate Limits**: Add rate limiting to worker, implement backoff

---

## Dependencies Check

**Already Installed**:
- ✅ drizzle-orm (0.44.5)
- ✅ mysql2 (3.15.0)
- ✅ drizzle-kit (0.31.4)
- ✅ express (for server)
- ✅ zod (for validation)
- ✅ vitest (for testing)

**No New Dependencies Required** ✅

---

## Performance Projections

### Database Load
- Polling: 30 queries/min × 2 queries = 60 queries/min
- Average query time: 1-2ms (with indexes)
- Total overhead: ~100ms/min (negligible)

### Job Processing
- Gemini analysis: 5-15 seconds
- DeepSeek generation: 10-30 seconds
- Total per job: 15-45 seconds
- Queue capacity: ~100 jobs/day at 30s average

### Storage
- Per job: ~5KB (JSON outputs)
- 100 jobs/day × 30 days = 15,000 KB/month
- Annual: ~180 MB (negligible)

---

## Success Criteria for Phase 3

✅ **Database**
- [ ] 3 new tables created and indexed
- [ ] 6 helper functions working
- [ ] Database migration successful

✅ **Worker**
- [ ] Polling loop running every 2 seconds
- [ ] Job status transitions correct
- [ ] Error handling and retry logic working
- [ ] Outputs stored in database

✅ **API**
- [ ] 3 tRPC procedures callable
- [ ] Authorization checks working
- [ ] Input validation working

✅ **Testing**
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual end-to-end test successful

---

## Next Steps

1. **Review this viability check** - Confirm assumptions are correct
2. **Approve implementation plan** - Confirm credit budget acceptable
3. **Execute Phase 3A** - Add schema and database helpers
4. **Execute Phase 3B** - Create worker and API integration
5. **Execute Phase 3C** - Add tRPC procedures
6. **Execute Phase 3D** - Manual testing and validation

---

## Questions & Clarifications Needed

Before proceeding, please confirm:

1. ✅ **Database**: Is MySQL connection stable? (appears to be based on existing tables)
2. ✅ **Gemini API**: Do you have GEMINI_API_KEY configured? (needed for vision analysis)
3. ✅ **DeepSeek API**: Do you have DEEPSEEK_API_KEY configured? (already in use)
4. ⚠️ **Polling Interval**: Is 2-second polling acceptable, or should it be faster/slower?
5. ⚠️ **Max Retries**: Is 3 retries acceptable for failed jobs?
6. ⚠️ **Job Timeout**: Should jobs timeout after X minutes? (not currently implemented)

---

## Estimated Timeline

- **Phase 3A**: 1-2 hours (schema + helpers)
- **Phase 3B**: 2-3 hours (worker + integration)
- **Phase 3C**: 1 hour (tRPC procedures)
- **Phase 3D**: 1-2 hours (testing + validation)

**Total**: 5-8 hours of implementation work

---

## Approval Checklist

- [ ] Viability check reviewed
- [ ] Credit cost estimate approved (200-250 credits)
- [ ] Implementation plan approved
- [ ] Ready to proceed with Phase 3A

