# Phase 3B: Requirements Confirmation

**Date**: 2024-11-28  
**Status**: ✅ **ALL REQUIREMENTS CONFIRMED AND READY FOR IMPLEMENTATION**

---

## User Confirmations

### 1. Architecture Review
- ⚠️ No Architecture diagram to be reviewed
- ✅ **CONFIRMED**: Proceed without architecture review meeting
- ✅ **DELIVERED**: Phase 3B Architecture Diagram (see PHASE3B_ARCHITECTURE_DIAGRAM.png)

### 2. Error Handling Strategy
- ✅ **CONFIRMED**: Error handling strategy approved
- ✅ **IMPLEMENTATION**: 
  - If Gemini fails → Mark job as error, don't call DeepSeek
  - If DeepSeek fails → Mark job as error
  - Automatic retry up to 3 times
  - Exponential backoff on rate limits

### 3. Performance Considerations
- ✅ **CONFIRMED**: Performance considerations acceptable
- ✅ **IMPLEMENTATION**:
  - Polling interval: 2 seconds (30 queries/min)
  - Database overhead: ~100ms/min (negligible)
  - Max concurrent jobs: 1 (sequential processing)
  - Memory footprint: ~10MB stable

### 4. Testing Strategy
- ✅ **CONFIRMED**: Testing strategy comprehensive
- ✅ **IMPLEMENTATION**:
  - Unit tests: Polling logic, API integration, error handling
  - Integration tests: End-to-end pipeline, error recovery
  - Manual tests: Job creation, progress monitoring, output verification

### 5. User Notification on Job Failure
- ✅ **CONFIRMED**: Notify users when jobs fail via toast
- ✅ **ADDITIONAL REQUIREMENT**: Include credit refund text
- ✅ **IMPLEMENTATION**:
  ```typescript
  // When job fails after max retries:
  toast.error({
    title: "Processing Failed",
    description: "Your Brand Vision Pipeline job failed after 3 attempts. Your credits have been refunded.",
    action: {
      label: "View Details",
      onClick: () => router.push(`/jobs/${jobId}`)
    }
  });
  
  // Email notification (optional):
  // "Your job processing failed. We've refunded your credits. Please try again or contact support."
  ```

### 6. Job Timeout Configuration
- ✅ **CONFIRMED**: Jobs timeout after 5 minutes
- ✅ **IMPLEMENTATION**:
  ```typescript
  // In visionJobWorker.ts:
  const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  
  // Check if job has been processing too long:
  if (Date.now() - job.createdAt.getTime() > JOB_TIMEOUT_MS) {
    await handleJobError(job, "timeout", new Error("Job exceeded 5-minute timeout"));
  }
  ```

---

## Phase 3B Implementation Scope

### Files to Create

#### 1. `server/geminiVision.ts`
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

**Returns**: JSON string with:
- Colors (primary, secondary, accent, description)
- Visual elements (objects, shapes, text, icons)
- Mood and tone (mood, tone, energy_level)
- Composition (layout, balance, focal_point, negative_space)
- Lighting and style (lighting, style, texture)
- Brand insights (perceived_industry, target_audience, brand_personality, premium_level)

**Error Handling**:
- Rate limits (429) → Retry with exponential backoff
- Timeouts → Retry up to 3 times
- Invalid JSON → Throw error
- Invalid image URL → Throw error

---

#### 2. `server/visionJobWorker.ts`
**Purpose**: Background job queue worker

**Key Functions**:
- `startJobQueueWorker()` - Initialize polling loop
- `stopJobQueueWorker()` - Graceful shutdown
- `pollAndProcessJobs()` - Main polling loop (2-second interval)
- `processVisionJob()` - Process single job through pipeline
- `handleJobError()` - Error handling with retry logic
- `getWorkerStatus()` - Monitoring endpoint

**Pipeline**:
1. Poll database for pending jobs (every 2 seconds)
2. If job found:
   - Update status to 'gemini_analyzing', progress=25%
   - Call Gemini Vision API
   - Update status to 'deepseek_generating', progress=60%
   - Call DeepSeek Chat API
   - Update status to 'complete', progress=100%
   - Store outputs in visionJobOutputs table
3. If error:
   - Update status to 'error'
   - Increment retryCount
   - If retryCount < maxRetries: mark for retry
   - Else: permanent error
4. Sleep 2 seconds, repeat

**Error Handling**:
- Gemini fails → Mark error, don't call DeepSeek
- DeepSeek fails → Mark error
- Storage fails → Mark error
- All errors trigger retry logic (max 3 retries)
- Max retries exceeded → Permanent error with user notification

**Timeout Logic**:
- Check if job has been processing > 5 minutes
- If timeout: mark as error, notify user, refund credits

---

### Files to Modify

#### 1. `server/_core/index.ts`
**Changes**:
```typescript
import { startJobQueueWorker, stopJobQueueWorker } from "../visionJobWorker";

// In startServer() function, after Express setup:
startJobQueueWorker();
console.log("[Server] Vision Job Queue Worker started");

// Add graceful shutdown:
process.on('SIGTERM', () => {
  console.log("[Server] SIGTERM received, shutting down...");
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
- [ ] Test with sample image URL from R2 storage

### Step 2: Create Job Queue Worker
- [ ] Create `server/visionJobWorker.ts`
- [ ] Implement polling loop (2-second interval)
- [ ] Implement job processing pipeline
- [ ] Add status update logic
- [ ] Add error handling with retry logic
- [ ] Add timeout logic (5-minute timeout)
- [ ] Add logging for debugging
- [ ] Add worker status monitoring endpoint

### Step 3: Integrate Worker into Server
- [ ] Import worker in `server/_core/index.ts`
- [ ] Call `startJobQueueWorker()` on server startup
- [ ] Add graceful shutdown handling
- [ ] Verify worker starts without errors

### Step 4: Create Unit Tests
- [ ] Create `server/visionJobWorker.test.ts`
- [ ] Mock database queries
- [ ] Mock Gemini API responses
- [ ] Mock DeepSeek API responses
- [ ] Test job processing pipeline
- [ ] Test error handling and retry logic
- [ ] Test timeout logic
- [ ] Test status transitions

### Step 5: Manual Testing
- [ ] Start dev server
- [ ] Create a test job via tRPC
- [ ] Monitor job status transitions
- [ ] Verify Gemini output stored correctly
- [ ] Verify DeepSeek output stored correctly
- [ ] Test error handling by simulating API failure
- [ ] Verify retry logic works
- [ ] Test timeout by manually updating createdAt
- [ ] Verify user notification toast appears on failure
- [ ] Verify credit refund text in toast message

---

## User Notification Implementation

### Toast Notification (On Job Failure)
```typescript
import { useToast } from "@/components/ui/use-toast";

// When job fails after max retries:
const { toast } = useToast();

toast({
  title: "Processing Failed",
  description: "Your Brand Vision Pipeline job failed after 3 attempts. Your credits have been refunded to your account.",
  variant: "destructive",
  action: {
    label: "View Job",
    onClick: () => router.push(`/vision-jobs/${jobId}`)
  }
});
```

### Email Notification (Optional - Phase 4+)
```
Subject: Brand Vision Pipeline Job Failed

Your job processing failed after 3 attempts. We've refunded your credits.

Job ID: {jobId}
Error: {errorMessage}
Refund: 1 credit returned to your account

Please try again or contact support if the issue persists.
```

---

## Timeout Implementation Details

### Timeout Check Location
```typescript
// In processVisionJob() function:
const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

async function processVisionJob(job: VisionJob, isRetry: boolean = false) {
  // Check timeout
  const elapsedTime = Date.now() - job.createdAt.getTime();
  if (elapsedTime > JOB_TIMEOUT_MS) {
    console.log(`[Job ${job.id}] Timeout: ${elapsedTime}ms > ${JOB_TIMEOUT_MS}ms`);
    await handleJobError(job, "timeout", new Error("Job exceeded 5-minute timeout"));
    return;
  }

  // Continue with normal processing...
}
```

### Timeout Error Message
```
Error Stage: "timeout"
Error Message: "Job exceeded 5-minute timeout. Please try again."
Retry: No (timeout is permanent error)
User Notification: "Your job processing timed out. Please try again with a smaller image or simpler analysis."
```

---

## API Rate Limit Handling

### Gemini 3 Pro Rate Limits
- **Limit**: ~60 requests/min (varies by tier)
- **Response**: HTTP 429 (Too Many Requests)
- **Handling**: Exponential backoff (1s, 2s, 4s, 8s...)

### DeepSeek V3 Rate Limits
- **Limit**: ~100 requests/min (varies by tier)
- **Response**: HTTP 429 (Too Many Requests)
- **Handling**: Exponential backoff (1s, 2s, 4s, 8s...)

### Implementation
```typescript
async function callWithRetry(
  apiCall: () => Promise<string>,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, backing off for ${backoffMs}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      } else {
        throw error;
      }
    }
  }
}
```

---

## Estimated Credits for Phase 3B

| Component | Credits |
|-----------|---------|
| Gemini Vision integration | 30 |
| Job queue worker | 40 |
| Error handling + retry logic | 20 |
| Timeout implementation | 10 |
| User notification toast | 10 |
| Server integration | 10 |
| Unit tests | 20 |
| Manual testing + debugging | 10 |
| **TOTAL** | **150** |

**Actual estimate**: 100-120 credits (accounting for code reuse from existing DeepSeek integration)

---

## Success Criteria for Phase 3B

✅ **Database**
- [x] 3 new tables created (Phase 3A)
- [x] 11 helper functions working (Phase 3A)

✅ **Worker**
- [ ] Polling loop running every 2 seconds
- [ ] Job status transitions correct (pending → gemini_analyzing → deepseek_generating → complete/error)
- [ ] Error handling and retry logic working
- [ ] Timeout logic working (5-minute timeout)
- [ ] Outputs stored in database
- [ ] User notifications sent on failure (with credit refund text)

✅ **API Integration**
- [ ] Gemini Vision API called correctly
- [ ] DeepSeek Chat API called correctly
- [ ] Rate limiting handled with exponential backoff
- [ ] API errors handled gracefully

✅ **Testing**
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual end-to-end test successful
- [ ] Error scenarios tested

---

## Approval Checklist

Before proceeding with Phase 3B implementation:

- [x] Phase 3A fully functional (no errors)
- [x] Architecture diagram generated
- [x] Error handling strategy approved
- [x] Performance considerations acceptable
- [x] Testing strategy comprehensive
- [x] User notification requirements confirmed (toast + credit refund text)
- [x] Job timeout confirmed (5 minutes)
- [x] All requirements documented
- [x] Ready to implement Phase 3B

---

## Next Steps

1. **Implement Phase 3B** (100-120 credits)
   - Create `server/geminiVision.ts`
   - Create `server/visionJobWorker.ts`
   - Modify `server/_core/index.ts`
   - Add unit tests
   - Manual testing

2. **Phase 3C**: Add tRPC procedures (30-40 credits)

3. **Phase 3D**: Manual testing and validation (20-30 credits)

4. **Phase 4**: Implement SSE endpoint for real-time updates

---

## Questions?

All requirements have been confirmed and documented. Ready to proceed with Phase 3B implementation.

