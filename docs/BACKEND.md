# Backend Technical Documentation

## Overview

The Longevity Valley backend is a **Node.js + Express** server built with **TypeScript** and **tRPC**, providing type-safe RPC endpoints for the React frontend. The backend handles authentication, content generation, image uploads, database operations, and integrations with external AI and storage services.

**Key Principles:**
- Type-safe: tRPC ensures frontend-backend type alignment
- Stateless: No server-side sessions (JWT-based authentication)
- Modular: Routers organized by feature domain
- Testable: Comprehensive unit and integration tests with Vitest

## Project Structure

```
server/
├── _core/                      # Core infrastructure (framework-level)
│   ├── index.ts               # Express app setup and middleware
│   ├── context.ts             # tRPC context (user, request, response)
│   ├── trpc.ts                # tRPC router and procedure definitions
│   ├── env.ts                 # Environment variable validation
│   ├── oauth.ts               # OAuth callback handler
│   ├── cookies.ts             # Session cookie management
│   ├── llm.ts                 # LLM API wrapper (DeepSeek, Gemini)
│   ├── imageGeneration.ts     # Image generation service
│   ├── voiceTranscription.ts  # Audio transcription service
│   ├── notification.ts        # Owner notification service
│   ├── dataApi.ts             # Data API integration
│   ├── map.ts                 # Google Maps integration
│   └── systemRouter.ts        # System-level procedures
│
├── routers.ts                 # Feature routers (main entry point)
├── db.ts                      # Database query helpers
├── storage.ts                 # Cloudflare R2 storage integration
├── aiContentGenerator.ts      # DeepSeek API for content generation
├── imageUpload.ts             # Image upload handler
│
└── tests/
    ├── contentGeneration.test.ts
    ├── imageUpload.r2.e2e.test.ts
    └── cloudflare-r2.test.ts
```

## Architecture

### Request Flow

```
Client (React)
    ↓
tRPC Client
    ↓
HTTP POST /api/trpc/{procedure}
    ↓
Express Server
    ↓
tRPC Router
    ↓
Procedure Handler
    ↓
Database / External API
    ↓
Response (JSON)
    ↓
Client (React)
```

### Core Components

#### 1. Express Server (`server/_core/index.ts`)

The Express server is the HTTP entry point. It handles:

- **Middleware**: CORS, JSON parsing, cookie parsing
- **OAuth Callback**: `/api/oauth/callback` for authentication
- **tRPC Gateway**: `/api/trpc/*` for all RPC calls
- **Webhook Handler**: `/api/webhooks/stripe` for payment events
- **Static Files**: Serves the React frontend from `dist/public/`

**Middleware Stack:**
```typescript
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('dist/public'));
```

#### 2. tRPC Router (`server/routers.ts`)

The main router aggregates all feature routers and exposes them as RPC procedures. Each procedure is either `publicProcedure` (no auth required) or `protectedProcedure` (auth required).

**Router Structure:**
```typescript
export const appRouter = router({
  auth: router({
    me: publicProcedure.query(...),
    logout: publicProcedure.mutation(...),
  }),
  contentGeneration: router({
    generateContent: publicProcedure.mutation(...),
    getHistory: protectedProcedure.query(...),
  }),
  imageUpload: router({
    uploadImages: protectedProcedure.mutation(...),
  }),
  // ... other routers
});
```

#### 3. Database Layer (`server/db.ts`)

Query helpers provide a clean interface for database operations. All queries use Drizzle ORM for type safety.

**Example Helper:**
```typescript
export async function createBrandInput(userId: number, input: InsertBrandInput) {
  const db = await getDb();
  const result = await db.insert(brandInputs).values({
    ...input,
    userId,
  });
  return result;
}
```

#### 4. Authentication Context (`server/_core/context.ts`)

The tRPC context is built for each request and provides:

```typescript
type TrpcContext = {
  user?: User;           // Current user (if authenticated)
  req: Request;          // Express request object
  res: Response;         // Express response object
};
```

The context is automatically available in all procedures:

```typescript
protectedProcedure
  .mutation(({ ctx, input }) => {
    // ctx.user is guaranteed to exist
    console.log(ctx.user.id);
  })
```

## Key Features

### 1. Content Generation (`aiContentGenerator.ts`)

Generates five Mandarin content pieces using the **DeepSeek API**.

**Process:**
1. Receive product information and optional image URLs from frontend
2. Build a detailed prompt with cultural context and Longevity Valley branding principles
3. Call DeepSeek API with the prompt
4. Parse the JSON response to extract five content pieces
5. Validate each piece has required fields (storyboard, caption, explanation)
6. Return structured content to frontend

**Prompt Structure:**
```
System: You are a cultural marketing expert...
User: Generate 5 Mandarin content pieces for [product]
     Selling points: [points]
     Target audience: [audience]
     ...
```

**Output Format:**
```json
[
  {
    "storyboardMandarin": "...",
    "captionMandarin": "...",
    "explanationEnglish": "..."
  },
  // ... 4 more pieces
]
```

**Error Handling:**
- If DeepSeek API fails, return error to frontend with user-friendly message
- If JSON parsing fails, log detailed error and retry with adjusted prompt
- If validation fails (missing fields), regenerate that specific piece

### 2. Image Upload (`imageUpload.ts`)

Handles image uploads to **Cloudflare R2** storage.

**Process:**
1. Receive base64-encoded image data from frontend
2. Validate file type (JPEG, PNG, WebP) and size (max 10MB)
3. Generate unique file key with random suffix to prevent enumeration
4. Upload to R2 using AWS S3 SDK
5. Return CDN URL (e.g., `https://www.longevityvalley.ai/...`)
6. Store URL in database for future reference

**File Naming:**
```
{userId}-uploads/{filename}-{randomSuffix}.{ext}
```

**Error Handling:**
- Invalid file type → Return 400 error
- File too large → Return 413 error
- R2 upload fails → Return 500 error with retry hint

### 3. Authentication

**OAuth Flow:**

1. Frontend redirects user to `getLoginUrl()` (Manus OAuth portal)
2. User authenticates with Google or Manus account
3. OAuth provider redirects to `/api/oauth/callback` with authorization code
4. Backend exchanges code for user info
5. Backend creates/updates user in database
6. Backend sets session cookie (JWT)
7. Frontend detects cookie and updates auth state

**Session Management:**

Sessions are stored as **JWT cookies** with the following properties:

- **Name**: `manus_session`
- **Expiration**: 7 days
- **Secure**: HTTPS only
- **HttpOnly**: Not accessible to JavaScript
- **SameSite**: Strict (prevents CSRF)

**Protected Procedures:**

Any procedure using `protectedProcedure` automatically validates the JWT and injects the user into the context:

```typescript
protectedProcedure
  .mutation(({ ctx }) => {
    // ctx.user is guaranteed to exist and be valid
    const userId = ctx.user.id;
  })
```

### 4. Storage Integration (`storage.ts`)

Handles file uploads to **Cloudflare R2** using the AWS S3 SDK.

**Configuration:**
```typescript
const s3Client = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});
```

**Upload Function:**
```typescript
export async function storagePut(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType?: string
): Promise<{ key: string; url: string }> {
  // Uploads to R2 and returns CDN URL
}
```

**CDN Delivery:**

All uploaded files are automatically served through Cloudflare's CDN at:
```
https://www.longevityvalley.ai/{key}
```

## Database Schema

### Users Table

Stores user account information with subscription status.

| Column | Type | Purpose |
|--------|------|---------|
| id | INT | Primary key |
| openId | VARCHAR(64) | OAuth identifier (unique) |
| name | TEXT | Display name |
| email | VARCHAR(320) | Email address |
| loginMethod | VARCHAR(64) | OAuth provider |
| role | ENUM | User role (user, admin) |
| createdAt | TIMESTAMP | Account creation |
| updatedAt | TIMESTAMP | Last update |
| lastSignedIn | TIMESTAMP | Last login |

**Indexes:**
- `openId` (unique) - Fast OAuth lookups
- `email` - Fast email lookups

### Brand Inputs Table

Stores product detail form submissions for content generation.

| Column | Type | Purpose |
|--------|------|---------|
| id | INT | Primary key |
| userId | INT | Foreign key to users |
| productInfo | TEXT | Product name/description |
| sellingPoints | TEXT | Key selling points |
| targetAudience | TEXT | Target audience |
| painPoints | TEXT | User pain points |
| scenarios | TEXT | Use cases |
| ctaOffer | TEXT | Call to action |
| createdAt | TIMESTAMP | Submission time |

**Indexes:**
- `userId` - Fast user lookups
- `createdAt` - Chronological ordering

### Generated Content Table

Stores AI-generated content pieces with user feedback.

| Column | Type | Purpose |
|--------|------|---------|
| id | INT | Primary key |
| inputId | INT | Foreign key to brandInputs |
| userId | INT | Foreign key to users |
| storyboardMandarin | TEXT | Visual storyboard |
| captionMandarin | TEXT | Social caption |
| explanationEnglish | TEXT | Strategy explanation |
| userFeedbackScore | INT | Feedback (1/-1) |
| userFeedbackText | TEXT | User comment |
| createdAt | TIMESTAMP | Generation time |
| updatedAt | TIMESTAMP | Last update |

**Indexes:**
- `userId` - Fast user lookups
- `inputId` - Fast input lookups
- `createdAt` - Chronological ordering

## API Procedures

### Content Generation

```typescript
trpc.contentGeneration.generateContent.mutation({
  productInfo: string,           // Required
  sellingPoints: string,         // Required
  targetAudience?: string,       // Optional
  painPoints?: string,           // Optional
  scenarios?: string,            // Optional
  ctaOffer?: string,             // Optional
  uploadedImageUrls?: string[]   // Optional
})
```

**Returns:**
```typescript
{
  contentPieces: [
    {
      storyboardMandarin: string,
      captionMandarin: string,
      explanationEnglish: string,
    },
    // ... 4 more pieces
  ],
  inputId: number,
  generatedAt: Date,
}
```

### Image Upload

```typescript
trpc.imageUpload.uploadImages.mutation({
  files: File[]  // Array of image files
})
```

**Returns:**
```typescript
{
  uploadedUrls: string[],  // CDN URLs
  uploadedAt: Date,
}
```

### Authentication

```typescript
// Get current user
trpc.auth.me.query()

// Logout
trpc.auth.logout.mutation()
```

## Error Handling

All procedures follow a consistent error handling pattern:

```typescript
try {
  // Business logic
} catch (error) {
  if (error instanceof TRPCError) {
    throw error;  // Already formatted
  }
  
  console.error('Unhandled error:', error);
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}
```

**Error Codes:**
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks permission
- `BAD_REQUEST` - Invalid input
- `NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Server error

## Testing

### Unit Tests

Test individual functions and procedures in isolation:

```bash
pnpm test server/contentGeneration.test.ts
```

**Example Test:**
```typescript
describe('contentGeneration', () => {
  it('should generate 5 content pieces', async () => {
    const result = await generateContent({
      productInfo: 'Test product',
      sellingPoints: 'Test points',
    });
    
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('storyboardMandarin');
  });
});
```

### Integration Tests

Test end-to-end flows with real API calls:

```bash
pnpm test server/imageUpload.r2.e2e.test.ts
```

**Example Test:**
```typescript
describe('R2 Upload E2E', () => {
  it('should upload image to R2 and return CDN URL', async () => {
    const imageBuffer = Buffer.from('...');
    const { url } = await storagePut('test.jpg', imageBuffer);
    
    expect(url).toContain('www.longevityvalley.ai');
  });
});
```

## Environment Variables

Required environment variables for backend operation:

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/db

# Authentication
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im

# AI/LLM
DEEPSEEK_API_KEY=your-deepseek-key
GEMINI_API_KEY=your-gemini-key

# Storage
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=longevityvalleyai
CLOUDFLARE_R2_PUBLIC_DOMAIN=www.longevityvalley.ai

# Payments (Optional)
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

## Deployment

### Build

```bash
pnpm build
```

This creates:
- `dist/public/` - React frontend (Vite build)
- `dist/index.js` - Express server (esbuild bundle)

### Start

```bash
NODE_ENV=production node dist/index.js
```

The server will:
1. Start Express on port 3000
2. Serve React frontend from `dist/public/`
3. Handle tRPC calls at `/api/trpc/*`
4. Listen for OAuth callbacks at `/api/oauth/callback`

## Performance Considerations

### Database Queries

- Use indexes on frequently queried columns (userId, createdAt)
- Batch operations when possible
- Avoid N+1 queries (use joins in Drizzle)

### API Calls

- Cache LLM responses if input is identical
- Implement rate limiting for free tier users
- Use timeouts for external API calls (30 seconds)

### Storage

- Validate file size before upload (prevent large uploads)
- Use CDN for image delivery (automatic with R2)
- Implement cleanup for unused files (future enhancement)

## Monitoring

### Logging

All errors are logged to console with timestamps:

```typescript
console.error('[ContentGeneration]', error);
console.log('[ImageUpload]', 'File uploaded:', url);
```

### Health Checks

The `/api/health` endpoint returns server status:

```json
{
  "status": "ok",
  "timestamp": "2025-11-27T10:00:00Z",
  "database": "connected"
}
```

---

**Last Updated**: November 2025  
**Author**: Manus AI
