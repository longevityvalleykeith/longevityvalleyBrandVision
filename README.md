# Phase 3: Brand Content Factory

> **Single Source of Truth Codebase**  
> Phase 3B (Brand Analysis) + Phase 3C (Video Director Mode)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THE BRAND CONTENT FACTORY                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │          │    │          │    │          │    │              │  │
│  │ UPLOAD   │───▶│ ANALYSIS │───▶│ DIRECTOR │───▶│  PRODUCTION  │  │
│  │          │    │ (Gemini) │    │(DeepSeek)│    │   (Kling)    │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────┘  │
│       │               │               │                  │          │
│       ▼               ▼               ▼                  ▼          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │ Validate │    │ Quality  │    │  Flux    │    │    Async     │  │
│  │ + Store  │    │  Score   │    │ Previews │    │     Job      │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## P0 Critical Fixes Implemented

| Fix | Status | Implementation |
|-----|--------|----------------|
| Input validation & sanitization | ✅ | `types/validation.ts` - Zod schemas with sanitization |
| Rate limiting on all endpoints | ✅ | `server/middleware/rateLimit.ts` - Sliding window algorithm |
| Error boundaries in React | ✅ | `client/components/ErrorBoundary.tsx` - Class + function components |
| File upload magic byte validation | ✅ | `server/utils/fileValidation.ts` - JPEG/PNG/WebP detection |
| Database indexes on foreign keys | ✅ | `drizzle/schema.ts` - All FK columns indexed |

## Project Structure

```
phase3-ssot/
├── types/                      # Shared type definitions
│   ├── index.ts               # Core types (SSOT)
│   └── validation.ts          # Zod validation schemas
│
├── drizzle/                    # Database layer
│   ├── schema.ts              # Table definitions
│   └── db.ts                  # Connection & utilities
│
├── server/                     # Backend
│   ├── trpc.ts                # tRPC configuration
│   ├── middleware/
│   │   └── rateLimit.ts       # Rate limiting
│   ├── utils/
│   │   ├── fileValidation.ts  # File security
│   │   └── stylePresets.ts    # Style definitions
│   ├── services/
│   │   ├── deepseekDirector.ts # AI storyboard generation
│   │   └── fluxPreviewer.ts    # Image preview generation
│   └── routers/
│       ├── index.ts           # Main router
│       ├── visionRouter.ts    # Phase 3B endpoints
│       └── directorRouter.ts  # Phase 3C endpoints
│
├── client/                     # Frontend
│   ├── components/
│   │   ├── ErrorBoundary.tsx  # Error handling
│   │   └── DirectorMode.tsx   # Video director UI
│   ├── hooks/
│   │   └── useDirector.ts     # Director state management
│   └── lib/
│       └── trpc.ts            # tRPC client
│
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── .env.example
```

## Data Flow

### Phase 3B: Brand Analysis

```
User Upload → File Validation → Storage → Gemini Analysis → Vision Job
     │              │               │            │              │
     ▼              ▼               ▼            ▼              ▼
  Base64      Magic Bytes      S3/R2 URL   Quality Score    Database
              Sanitization                 Visual Elements
                                           Brand Attributes
```

### Phase 3C: Video Director Mode

```
Vision Job → Gatekeeper → Director → Preview → Refine → Production
     │           │            │          │         │         │
     ▼           ▼            ▼          ▼         ▼         ▼
  Quality    <7? Remaster  DeepSeek   Flux     Traffic    Kling
   Check     via Flux-Dev   V3       Schnell   Light      API
                           Extract              System
                           Invariant
                           Token
```

## API Reference

### Vision Endpoints (Phase 3B)

```typescript
// Upload image for analysis
trpc.vision.uploadImage.mutate({
  filename: string,
  mimeType: string,
  data: string  // base64
}) → { jobId, status, imageUrl }

// Get job status
trpc.vision.getJob.query({ jobId }) → VisionJob

// List user's jobs
trpc.vision.listJobs.query({ page, limit, status? }) → PaginatedResponse<VisionJob>
```

### Director Endpoints (Phase 3C)

```typescript
// Initialize director mode
trpc.director.initDirector.mutate({
  jobId: number,
  forceRemaster?: boolean,
  preferredStyleId?: string
}) → DirectorState

// Refine scenes
trpc.director.refineStoryboard.mutate({
  jobId: number,
  refinements: Array<{
    sceneId: string,
    status: 'YELLOW' | 'RED',
    feedback?: string
  }>
}) → DirectorState

// Approve for production
trpc.director.approveProduction.mutate({
  jobId: number,
  confirmedSceneIds: string[]
}) → DirectorState
```

## Traffic Light System

The scene approval system uses a simple traffic light metaphor:

| Status | Meaning | Action |
|--------|---------|--------|
| 🔴 RED | Rejected | Complete regeneration |
| 🟡 YELLOW | Needs tweaks | Refine with feedback |
| 🟢 GREEN | Approved | Ready for production |
| ⚪ PENDING | Generating | Wait for preview |

## Style Presets

Available visual styles for video generation:

| ID | Name | Category | Premium |
|----|------|----------|---------|
| LUXURY_MINIMAL_V1 | Ethereal Luxury | luxury | No |
| TECH_NOIR_V1 | Cyberpunk Tech | tech | No |
| TECH_CLEAN_V1 | Apple Minimal | tech | No |
| NATURE_SERENE_V1 | Zen Garden | nature | No |
| DRAMATIC_CINEMA_V1 | Cinematic Epic | dramatic | Yes |

## Rate Limits

| Endpoint Type | Requests/Minute | Window |
|--------------|-----------------|--------|
| Generate | 10 | 60s |
| Upload | 20 | 60s |
| Refine | 30 | 60s |
| General API | 100 | 60s |

## Database Schema

### Core Tables

```sql
-- Vision Jobs (Phase 3B)
vision_jobs (
  id BIGINT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,     -- FK → users.id
  image_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  gemini_output JSON,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
)

-- Video Prompts (Phase 3C)
vision_job_video_prompts (
  id BIGINT PRIMARY KEY,
  job_id INT NOT NULL,              -- FK → vision_jobs.id
  director_output JSON NOT NULL,
  status VARCHAR(50) DEFAULT 'idle',
  INDEX idx_job_id (job_id)
)
```

## Environment Variables

```bash
# Required
DATABASE_HOST=localhost
DATABASE_NAME=phase3
DEEPSEEK_API_KEY=xxx
FAL_API_KEY=xxx

# Optional
GEMINI_API_KEY=xxx
KLING_API_KEY=xxx
S3_BUCKET=xxx
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Generate database migrations
npm run db:generate

# Push schema to database
npm run db:push

# Start development server
npm run dev
```

## Error Handling

All errors are typed and include:

```typescript
interface ApiError {
  code: ErrorCode;      // 'VALIDATION_ERROR' | 'NOT_FOUND' | etc.
  message: string;
  details?: object;
  timestamp: Date;
  requestId: string;
}
```

Error boundaries catch React errors and provide recovery options.

## Security Considerations

1. **File Uploads**: Magic byte validation prevents MIME type spoofing
2. **Input Sanitization**: All strings sanitized via Zod transforms
3. **Rate Limiting**: Prevents abuse and DoS attacks
4. **Authentication**: All mutations require valid auth token
5. **Authorization**: Users can only access their own resources
6. **Soft Deletes**: Data is never permanently deleted

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Contributing

1. All new code must include Zod validation schemas
2. All database columns need appropriate indexes
3. All React components need error boundaries
4. All API endpoints need rate limiting
5. All file uploads need magic byte validation

---

**Version**: 3.0.0  
**Status**: Ready for Implementation  
**Date**: November 30, 2025
