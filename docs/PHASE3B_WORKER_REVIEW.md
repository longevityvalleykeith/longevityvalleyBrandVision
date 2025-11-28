# Phase 3B: Worker Implementation - Manual Review Document

## Overview

Phase 3B implements the background job queue worker that:
1. Polls the database every 2 seconds for pending jobs
2. Processes jobs through Gemini vision analysis → DeepSeek content generation
3. Handles errors with automatic retry logic (max 3 retries)
4. Stores outputs in database for training dataset

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Every 2 seconds:                                                │
│                                                                  │
│ 1. SELECT * FROM visionJobs WHERE status='pending'              │
│    ORDER BY createdAt LIMIT 1                                   │
│                                                                  │
│ 2. If job found:                                                │
│    ├─ UPDATE status='gemini_analyzing', progress=25%            │
│    ├─ Call Gemini Vision API                                    │
│    ├─ UPDATE status='deepseek_generating', progress=60%         │
│    ├─ Call DeepSeek Chat API                                    │
│    ├─ UPDATE status='complete', progress=100%                   │
│    └─ Store outputs in visionJobOutputs table                   │
│                                                                  │
│ 3. If error at any stage:                                       │
│    ├─ UPDATE status='error', retryCount++                       │
│    └─ If retryCount < maxRetries: mark for retry                │
│                                                                  │
│ 4. SELECT * FROM visionJobs WHERE status='error'                │
│    AND retryCount < maxRetries LIMIT 5                          │
│    └─ Retry failed jobs (same pipeline)                         │
│                                                                  │
│ 5. Sleep 2 seconds, repeat                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to be Created/Modified

### 1. `server/visionJobWorker.ts` (NEW)
**Purpose**: Background polling worker for job queue

**Key Components**:
- `startJobQueueWorker()` - Initialize polling loop
- `stopJobQueueWorker()` - Graceful shutdown
- `pollAndProcessJobs()` - Main polling loop (runs every 2 seconds)
- `processVisionJob()` - Process single job through pipeline
- `handleJobError()` - Error handling with retry logic
- `getWorkerStatus()` - Monitoring endpoint

**Responsibilities**:
- Poll database for pending/failed jobs
- Call Gemini and DeepSeek APIs in sequence
- Update job status at each stage
- Handle errors gracefully
- Implement exponential backoff for retries

**Dependencies**:
- `server/db.ts` - Database queries
- `server/geminiVision.ts` - Gemini API integration (to be created)
- `server/aiContentGenerator.ts` - DeepSeek integration (already exists)

**Error Handling**:
- Gemini fails → Mark job as error, don't call DeepSeek
- DeepSeek fails → Mark job as error
- Storage fails → Mark job as error
- All errors trigger retry logic (max 3 retries)

---

### 2. `server/geminiVision.ts` (NEW)
**Purpose**: Gemini 3 Pro Vision API integration

**Key Function**:
```typescript
export async function analyzeImageWithGemini(
  imageUrl: string,
  imageContext: string,
  analysisPurpose: string,
  creativityLevel: number
): Promise<string>
```

**Returns**: JSON string matching this structure:
```json
{
  "colors": {
    "primary": ["color1", "color2"],
    "secondary": ["color3"],
    "accent": ["color4"],
    "description": "Color strategy explanation"
  },
  "visual_elements": {
    "objects": ["object1", "object2"],
    "shapes": ["shape1"],
    "text": "any text in image",
    "icons": ["icon1"]
  },
  "mood_and_tone": {
    "mood": "energetic, professional",
    "tone": "modern, minimalist",
    "energy_level": "high"
  },
  "composition": {
    "layout": "centered, balanced",
    "balance": "symmetrical",
    "focal_point": "product in center",
    "negative_space": "generous"
  },
  "lighting_and_style": {
    "lighting": "natural, soft",
    "style": "minimalist, clean",
    "texture": "smooth, matte"
  },
  "brand_insights": {
    "perceived_industry": "wellness, luxury",
    "target_audience": "affluent women 25-45",
    "brand_personality": "premium, trustworthy",
    "premium_level": "high"
  }
}
```

**Dependencies**:
- Google Generative AI SDK (or fetch-based API call)
- GEMINI_API_KEY environment variable

**Error Handling**:
- API rate limits → Retry with exponential backoff
- Invalid image URL → Throw error
- API timeout → Retry up to 3 times
- Invalid JSON response → Throw error

---

### 3. `server/_core/index.ts` (MODIFY)
**Purpose**: Integrate worker startup into server initialization

**Changes**:
```typescript
import { startJobQueueWorker } from "../visionJobWorker";

// In startServer() function, after Express setup:
startJobQueueWorker();
console.log("[Server] Vision Job Queue Worker started");
```

**Graceful Shutdown**:
```typescript
process.on('SIGTERM', () => {
  stopJobQueueWorker();
  server.close(() => process.exit(0));
});
```

---

## Implementation Checklist

### Step 1: Create Gemini Vision Integration
- [ ] Create `server/geminiVision.ts`
- [ ] Implement `analyzeImageWithGemini()` function
- [ ] Add structured prompt for brand analysis
- [ ] Add JSON parsing and validation
- [ ] Add error handling (rate limits, timeouts, invalid responses)
- [ ] Test with sample image URL

### Step 2: Create Job Queue Worker
- [ ] Create `server/visionJobWorker.ts`
- [ ] Implement polling loop (2-second interval)
- [ ] Implement job processing pipeline
- [ ] Add status update logic
- [ ] Add error handling with retry logic
- [ ] Add logging for debugging

### Step 3: Integrate Worker into Server
- [ ] Import worker in `server/_core/index.ts`
- [ ] Call `startJobQueueWorker()` on server startup
- [ ] Add graceful shutdown handling
- [ ] Add worker status monitoring endpoint

### Step 4: Create Unit Tests
- [ ] Create `server/visionJobWorker.test.ts`
- [ ] Mock database queries
- [ ] Mock Gemini API responses
- [ ] Mock DeepSeek API responses
- [ ] Test job processing pipeline
- [ ] Test error handling and retry logic
- [ ] Test status transitions

### Step 5: Manual Testing
- [ ] Start dev server
- [ ] Create a test job via tRPC
- [ ] Monitor job status transitions
- [ ] Verify Gemini output stored correctly
- [ ] Verify DeepSeek output stored correctly
- [ ] Test error handling by simulating API failure
- [ ] Verify retry logic works

---

## Critical Design Decisions

### 1. Polling Interval: 2 seconds
**Rationale**:
- Fast enough for responsive UX (user sees progress updates quickly)
- Slow enough to avoid database overload (30 queries/min is negligible)
- Balances latency vs. resource usage

**Alternative Considered**: 
- 1 second: Too aggressive, unnecessary database load
- 5 seconds: Too slow, users feel lag in progress updates
- WebSocket/SSE push: More complex, requires connection management

### 2. Max Retries: 3
**Rationale**:
- Handles transient API failures (network blips, rate limits)
- Prevents infinite retry loops
- Gives user feedback after ~30 seconds (3 retries × 2s polling + API time)

**Alternative Considered**:
- 1 retry: Too aggressive, legitimate failures fail immediately
- 5 retries: Too lenient, users wait too long for failure feedback

### 3. Error Handling: Don't call DeepSeek if Gemini fails
**Rationale**:
- DeepSeek needs Gemini output to generate content
- Prevents wasted API calls
- Clearer error messaging (user knows which step failed)

**Alternative Considered**:
- Use default/fallback Gemini output: Produces low-quality content
- Call DeepSeek with user input only: Loses visual brand analysis

### 4. Job Status Enum: 5 states
```
pending → gemini_analyzing → deepseek_generating → complete
                                                  ↘ error
```

**Rationale**:
- Clear pipeline visibility
- Enables granular progress reporting
- Helps identify where failures occur

**Alternative Considered**:
- 3 states (pending, processing, complete): Too vague
- 7+ states: Unnecessary complexity

---

## Performance Considerations

### Database Load
```
Polling: 30 polls/min × 2 queries = 60 queries/min
Query time: 1-2ms (with indexes)
Total overhead: ~100ms/min (0.17% CPU)
```

**Indexes Required** (already created by migration):
- `idx_status` on visionJobs(status)
- `idx_userId_status` on visionJobs(userId, status)
- `idx_createdAt` on visionJobs(createdAt)

### API Rate Limits
**Gemini 3 Pro**:
- Rate limit: ~60 requests/min (varies by tier)
- Timeout: 60 seconds
- Max retries: 3 with exponential backoff

**DeepSeek V3**:
- Rate limit: ~100 requests/min (varies by tier)
- Timeout: 60 seconds
- Max retries: 3 with exponential backoff

**Worker Handling**:
- Respect rate limits by spacing out requests
- Implement exponential backoff on 429 (rate limit) responses
- Log rate limit hits for monitoring

### Memory Usage
```
Per job: ~50KB (JSON outputs)
Max concurrent jobs: 1 (sequential processing)
Memory footprint: ~10MB (stable)
```

---

## Error Scenarios & Recovery

### Scenario 1: Gemini API Rate Limit
```
Job status: pending
Worker calls Gemini → 429 Rate Limit response
Action: Mark job as error, retryCount=1
Next cycle: Retry job (should succeed after backoff)
```

### Scenario 2: DeepSeek API Timeout
```
Job status: gemini_analyzing (Gemini succeeded)
Worker calls DeepSeek → Timeout after 60s
Action: Mark job as error, errorStage=deepseek
Next cycle: Retry job (Gemini will be called again, then DeepSeek)
```

### Scenario 3: Invalid Gemini Output
```
Job status: gemini_analyzing
Worker calls Gemini → Returns invalid JSON
Action: Mark job as error, errorMessage="Invalid JSON from Gemini"
Next cycle: Retry job (should succeed if API is working)
```

### Scenario 4: Max Retries Exceeded
```
Job status: error (after 3 retries)
Worker detects retryCount >= maxRetries
Action: Stop retrying, mark as permanent error
User sees: "Processing failed after 3 attempts. Please try again."
```

---

## Monitoring & Debugging

### Logging Strategy
```typescript
console.log(`[Job ${jobId}] Step 1: Gemini Vision Analysis`);
console.log(`[Job ${jobId}] Gemini response: ${geminOutput.substring(0, 100)}...`);
console.log(`[Job ${jobId}] ✅ COMPLETE`);
console.error(`[Job ${jobId}] Gemini analysis failed:`, error);
```

### Worker Status Endpoint
```typescript
GET /api/trpc/system.getWorkerStatus
Response: {
  isRunning: true,
  pollIntervalMs: 2000,
  maxRetries: 3,
  lastPollTime: "2024-01-15T10:30:45Z",
  jobsProcessedToday: 42,
  failureRate: 0.05
}
```

### Database Queries for Monitoring
```sql
-- Check pending jobs
SELECT COUNT(*) FROM visionJobs WHERE status='pending';

-- Check failed jobs waiting for retry
SELECT COUNT(*) FROM visionJobs WHERE status='error' AND retryCount < maxRetries;

-- Check completed jobs today
SELECT COUNT(*) FROM visionJobs WHERE status='complete' AND DATE(completedAt)=CURDATE();

-- Check average processing time
SELECT AVG(TIMESTAMPDIFF(SECOND, createdAt, completedAt)) 
FROM visionJobs WHERE status='complete';
```

---

## Testing Strategy

### Unit Tests
1. **Polling Logic**
   - Mock `getNextPendingVisionJob()` to return a job
   - Verify `processVisionJob()` is called
   - Verify job status transitions

2. **Gemini Integration**
   - Mock Gemini API response
   - Verify JSON parsing
   - Test error handling (rate limits, timeouts)

3. **DeepSeek Integration**
   - Mock DeepSeek API response
   - Verify content generation
   - Test error handling

4. **Error Handling**
   - Test retry logic (retryCount increments)
   - Test max retries (stops after 3)
   - Test error message storage

### Integration Tests
1. **End-to-End Pipeline**
   - Create a test job
   - Wait for processing
   - Verify outputs stored correctly
   - Verify job status is 'complete'

2. **Error Recovery**
   - Create a job
   - Simulate Gemini failure
   - Verify job marked as error
   - Verify retry succeeds

### Manual Testing
1. **Start Dev Server**
   ```bash
   pnpm dev
   ```

2. **Create Test Job**
   ```bash
   curl -X POST http://localhost:3000/api/trpc/visionPipeline.createJob \
     -H "Content-Type: application/json" \
     -d '{
       "imageUrl": "https://www.longevityvalley.ai/test-image.jpg",
       "analysisPurpose": "Brand analysis for wellness product",
       "outputFormat": "detailed_analysis",
       "creativityLevel": 1.0
     }'
   ```

3. **Monitor Progress**
   ```bash
   for i in {1..30}; do
     echo "=== Poll $i ===" 
     curl http://localhost:3000/api/trpc/visionPipeline.getJobStatus?jobId=1
     sleep 2
   done
   ```

4. **Verify Database**
   ```sql
   SELECT id, status, progress, errorMessage FROM visionJobs WHERE id=1;
   SELECT * FROM visionJobOutputs WHERE jobId=1;
   ```

---

## Estimated Credits for Phase 3B

| Component | Credits |
|-----------|---------|
| Gemini Vision integration | 30 |
| Job queue worker | 40 |
| Error handling + retry logic | 20 |
| Server integration | 10 |
| Unit tests | 20 |
| Manual testing + debugging | 10 |
| **TOTAL** | **130** |

**Actual estimate**: 80-100 credits (accounting for code reuse from existing DeepSeek integration)

---

## Approval Checklist

Before proceeding with Phase 3B implementation:

- [ ] Architecture diagram understood
- [ ] Error handling strategy approved
- [ ] Performance considerations acceptable
- [ ] Testing strategy comprehensive
- [ ] Monitoring approach sufficient
- [ ] Ready to implement

---

## Next Steps After Phase 3B

1. **Phase 3C**: Add tRPC procedures (30-40 credits)
2. **Phase 3D**: Manual testing and validation (20-30 credits)
3. **Phase 4**: Implement SSE endpoint for real-time updates
4. **Phase 5**: Build Brand Vision Pipeline UI component

---

## Questions & Clarifications

1. **Gemini API Key**: Confirmed GEMINI_API_KEY is set? ✅
2. **DeepSeek API Key**: Confirmed DEEPSEEK_API_KEY is set? ✅
3. **Polling Interval**: 2 seconds acceptable? ✅
4. **Max Retries**: 3 acceptable? ✅
5. **Error Notification**: Should we notify user when job fails? (Recommend: yes, via toast + email)
6. **Job Timeout**: Should jobs timeout after X minutes? (Recommend: 10 minutes)

