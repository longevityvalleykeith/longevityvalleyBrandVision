# Longevity Valley A.I. Brand Content Generator

**Transform wellness brands into China-ready content creators in 3 minutes.**

Longevity Valley is a freemium SaaS platform that helps Western wellness brands enter the Chinese market by automatically generating culturally-optimized Mandarin content from product information and visual assets. Users submit product details and brand photos, and the A.I. generates five ready-to-use content pieces (storyboards + captions) optimized for WeChat, Douyin, and Xiaohongshu.

## Quick Start

### Prerequisites

- **Node.js**: 22.13.0 or higher
- **pnpm**: 10.4.1 or higher
- **MySQL/TiDB**: Database connection string (provided via environment variables)
- **API Keys**: DeepSeek, Google Gemini, Cloudflare R2, Stripe (optional for payments)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd longevity-valley-ai

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys and database URL

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Build for Production

```bash
pnpm build
pnpm start
```

## Project Structure

The codebase follows a monorepo structure with clear separation between frontend and backend:

```
longevity-valley-ai/
├── client/                    # React frontend (Vite + TypeScript)
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── _core/           # Authentication and utilities
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── App.tsx          # Main router
│   │   └── index.css        # Global styles (Tailwind)
│   └── index.html
│
├── server/                    # Express backend (Node.js + TypeScript)
│   ├── _core/               # Core infrastructure (auth, LLM, storage)
│   ├── routers.ts           # tRPC procedure definitions
│   ├── db.ts                # Database query helpers
│   ├── storage.ts           # Cloudflare R2 integration
│   ├── aiContentGenerator.ts # DeepSeek API integration
│   └── imageUpload.ts       # Image upload handler
│
├── drizzle/                  # Database schema and migrations
│   ├── schema.ts            # Table definitions
│   └── migrations/          # SQL migration files
│
├── shared/                   # Shared types and constants
│   ├── const.ts             # App-wide constants
│   └── types.ts             # TypeScript type definitions
│
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md       # Technical architecture
│   ├── FEATURES.md          # Feature specifications
│   └── USER_FLOW.md         # User journey documentation
│
└── package.json              # Dependencies and scripts
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Vite, TypeScript | User interface and interactions |
| **Styling** | Tailwind CSS 4, shadcn/ui | Responsive design and components |
| **Backend** | Express 4, Node.js | API server and business logic |
| **RPC** | tRPC 11 | Type-safe client-server communication |
| **Database** | MySQL/TiDB, Drizzle ORM | Data persistence and queries |
| **Authentication** | Manus OAuth, JWT | User identity and session management |
| **AI/LLM** | DeepSeek V3, Google Gemini | Content generation and visual analysis |
| **Storage** | Cloudflare R2, AWS S3 SDK | Image upload and CDN delivery |
| **Payments** | Stripe | Subscription management (optional) |
| **Testing** | Vitest | Unit and integration tests |

## Key Features

### Freemium Content Generator (Free Tier)

Users can submit product information through a bilingual form (English/Bahasa Melayu) and receive five AI-generated Mandarin content pieces. Each piece includes a visual storyboard concept and a ready-to-use caption optimized for Chinese social platforms. Users can upload up to five brand logos or product photos to provide visual context.

**Form Fields:**
- Product Information (required)
- Key Selling Points (required)
- Target Audience (optional)
- User Pain Points (optional)
- Applicable Scenarios (optional)
- Promo Offer / Call to Action (optional)

**Output:**
- Five Mandarin content pieces, each with:
  - Visual storyboard description (Mandarin)
  - Platform-optimized caption (Mandarin, 50-150 characters)
  - Cultural strategy explanation (English)
- Copy-to-clipboard functionality
- Feedback mechanism (helpful/not helpful + comments)

### Image Upload & Storage (Free Tier)

Users can upload up to five brand logos or product photos (max 10MB each, JPG/PNG/WEBP). Images are stored in Cloudflare R2 and served via CDN at `www.longevityvalley.ai`. Uploaded images are associated with the user's account for future reference and data collection.

### Authentication

The platform supports two authentication methods:

1. **Manus OAuth** (default) - Integrated via the Manus platform
2. **Google OAuth** (in development) - To enable rapid user acquisition and data collection

Users can sign in with either method, and their accounts are automatically created in the database.

### Subscription Management (Pro Tier - Optional)

Stripe integration enables subscription management with tiered pricing:

- **Free Tier**: 3 content generations per day, 5 images per generation
- **Pro Tier** ($29/month): Unlimited generations, unlimited images, priority support
- **Enterprise Tier** ($99/month): Everything in Pro + API access, custom branding

Stripe webhooks automatically update user subscription status when payments succeed or fail.

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET=your-jwt-secret-key
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# AI/LLM
DEEPSEEK_API_KEY=your-deepseek-api-key
GEMINI_API_KEY=your-google-gemini-api-key

# Storage (Cloudflare R2)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=longevityvalleyai
CLOUDFLARE_R2_PUBLIC_DOMAIN=www.longevityvalley.ai

# Payments (Optional)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
VITE_STRIPE_PUBLISHABLE_KEY=your-publishable-key

# Platform
VITE_APP_TITLE=Longevity Valley A.I.
VITE_APP_LOGO=/logo.svg
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-manus-open-id
```

## API Reference

### tRPC Procedures

The backend exposes type-safe RPC procedures through tRPC. All procedures are defined in `server/routers.ts`.

#### Content Generation

```typescript
// Generate 5 Mandarin content pieces from product information
trpc.contentGeneration.generateContent.useMutation({
  productInfo: string,
  sellingPoints: string,
  targetAudience?: string,
  painPoints?: string,
  scenarios?: string,
  ctaOffer?: string,
  uploadedImageUrls?: string[]
})
```

#### Image Upload

```typescript
// Upload images to Cloudflare R2
trpc.imageUpload.uploadImages.useMutation({
  files: File[]  // Array of image files
})
```

#### Authentication

```typescript
// Get current user
trpc.auth.me.useQuery()

// Logout
trpc.auth.logout.useMutation()
```

## Database Schema

### Users Table

Stores user account information and subscription status.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| openId | VARCHAR(64) | Manus OAuth identifier (unique) |
| name | TEXT | User's display name |
| email | VARCHAR(320) | User's email address |
| loginMethod | VARCHAR(64) | OAuth provider (manus, google) |
| role | ENUM | User role (user, admin) |
| createdAt | TIMESTAMP | Account creation time |
| updatedAt | TIMESTAMP | Last update time |
| lastSignedIn | TIMESTAMP | Last login time |

### Brands Table

Stores brand profile information for each user.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| userId | INT | Foreign key to users |
| brandName | VARCHAR(255) | Brand name |
| logoUrl | TEXT | URL to brand logo in R2 |
| createdAt | TIMESTAMP | Creation time |
| updatedAt | TIMESTAMP | Last update time |

### Brand Assets Table

Stores uploaded product photos and videos.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| brandId | INT | Foreign key to brands |
| assetType | ENUM | Asset type (photo, video) |
| storageUrl | TEXT | URL to asset in R2 |
| mimeType | VARCHAR(100) | MIME type (image/jpeg, etc.) |
| createdAt | TIMESTAMP | Upload time |

### Brand Inputs Table

Stores product detail form submissions.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| userId | INT | Foreign key to users |
| productInfo | TEXT | Product name and description |
| sellingPoints | TEXT | Key selling points |
| targetAudience | TEXT | Target audience description |
| painPoints | TEXT | User pain points |
| scenarios | TEXT | Use cases and scenarios |
| ctaOffer | TEXT | Promotional offer or CTA |
| createdAt | TIMESTAMP | Submission time |

### Generated Content Table

Stores AI-generated content pieces and user feedback.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| inputId | INT | Foreign key to brandInputs |
| userId | INT | Foreign key to users |
| storyboardMandarin | TEXT | Visual storyboard in Mandarin |
| captionMandarin | TEXT | Social media caption in Mandarin |
| explanationEnglish | TEXT | Cultural strategy explanation |
| userFeedbackScore | INT | Feedback (1 = helpful, -1 = not helpful) |
| userFeedbackText | TEXT | User comment on content |
| createdAt | TIMESTAMP | Generation time |
| updatedAt | TIMESTAMP | Last update time |

### Conversations Table

Stores chat history for the premium A.I. Brand Specialist feature.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| userId | INT | Foreign key to users |
| brandId | INT | Foreign key to brands |
| messageLog | TEXT | JSON array of chat messages |
| createdAt | TIMESTAMP | Conversation start time |
| updatedAt | TIMESTAMP | Last message time |

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/contentGeneration.test.ts

# Watch mode
pnpm test --watch
```

### Code Quality

```bash
# Type check
pnpm check

# Format code
pnpm format
```

### Database Migrations

```bash
# Generate migration from schema changes
pnpm db:push
```

## Deployment

The application is designed to run on the Manus platform, which provides:

- Managed Node.js runtime
- MySQL/TiDB database hosting
- OAuth authentication infrastructure
- Built-in LLM and storage APIs
- Automatic HTTPS and CDN

To deploy:

1. Push changes to the repository
2. Create a checkpoint via the Manus Management UI
3. Click "Publish" to deploy to production

## Support & Documentation

- **Architecture Details**: See `docs/ARCHITECTURE.md`
- **Feature Specifications**: See `docs/FEATURES.md`
- **User Flow**: See `docs/USER_FLOW.md`
- **Changelog**: See `CHANGELOG.md`

## License

MIT License - See LICENSE file for details

## Author

**Manus AI** - Autonomous development agent

---

**Last Updated**: November 2025  
**Current Version**: 1.0.0 (MVP)  
**Status**: Active Development
