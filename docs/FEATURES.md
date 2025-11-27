# Features & User Flow Documentation

## Product Overview

**Longevity Valley A.I.** is a freemium SaaS platform that transforms Western wellness brands into China-ready content creators. The platform generates culturally-optimized Mandarin content (storyboards and captions) from product information and visual assets, enabling brands to enter the Chinese market without language or cultural barriers.

**Core Value Proposition:**
- **Speed**: Generate five content pieces in 3 minutes
- **Culture**: AI understands Chinese social media norms and consumer psychology
- **Cost**: Eliminates expensive translation and cultural consulting
- **Data**: Builds a dataset of wellness products for future AI training

## User Personas

### 1. Small Wellness Brand Owner (Primary)

**Profile**: Founder of a small wellness brand (supplements, skincare, wellness devices) with 1-10 employees, annual revenue $100K-$1M.

**Goals**: Enter the Chinese market without hiring expensive consultants or translators.

**Pain Points**:
- No Mandarin language skills
- Unfamiliar with Chinese social media platforms (WeChat, Douyin, Xiaohongshu)
- Limited budget for market research and content creation
- Worried about cultural missteps damaging brand reputation

**How They Use Longevity Valley**:
1. Sign up with Google account (quick onboarding)
2. Upload product photos and brand logo
3. Fill out a simple form with product details
4. Get five ready-to-use Mandarin content pieces
5. Copy captions and post to Chinese social platforms

### 2. Marketing Manager (Secondary)

**Profile**: Marketing manager at a larger wellness company (50-500 employees) responsible for international expansion.

**Goals**: Quickly test market demand in China before committing to a full localization effort.

**Pain Points**:
- Managing multiple content calendars across regions
- Coordinating with freelance translators and cultural consultants
- Tight deadlines for campaign launches
- Need to justify content spend to executives

**How They Use Longevity Valley**:
1. Sign up with company email
2. Upload multiple product variants
3. Generate content for A/B testing different messaging
4. Use feedback mechanism to validate which content resonates
5. Subscribe to Pro tier for unlimited generations

### 3. Content Creator / Influencer (Tertiary)

**Profile**: Wellness influencer or content creator with 10K-100K followers on Chinese platforms.

**Goals**: Diversify income by representing Western wellness brands to their Chinese audience.

**Pain Points**:
- Difficulty understanding unfamiliar products
- Time-consuming research to create authentic content
- Uncertainty about what messaging resonates with followers
- Need to maintain consistent posting schedule

**How They Use Longevity Valley**:
1. Sign up with Google account
2. Upload product photos and brand guidelines
3. Generate multiple content variations
4. Use feedback to understand which angles resonate
5. Adapt AI-generated content to their personal voice

## User Journey

### Phase 1: Discovery & Signup (0-5 minutes)

**User Flow:**

```
Landing Page (Home.tsx)
    ↓
User reads value proposition
    ↓
Clicks "Get Started" or "Generate Content"
    ↓
Redirected to OAuth login (Manus or Google)
    ↓
User authenticates
    ↓
Account created in database
    ↓
Redirected to Content Generator form
```

**Key Interactions:**
- Landing page emphasizes speed ("3 minutes") and simplicity
- Two login options (Manus OAuth, Google OAuth) for maximum accessibility
- No email verification required (reduce friction)
- Automatic account creation on first login

**Success Metric**: User reaches the content generator form

### Phase 2: Content Generation (5-10 minutes)

**User Flow:**

```
Content Generator Form (ContentGenerator.tsx)
    ↓
User fills product information (required)
    ↓
User fills selling points (required)
    ↓
User optionally uploads brand photos (1-5 images)
    ↓
User optionally fills target audience, pain points, scenarios, CTA
    ↓
User clicks "Generate My 5 Free Content Ideas"
    ↓
Loading state (15-30 seconds)
    ↓
Results page displays 5 content pieces
```

**Form Fields:**

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| Product Information | Text | Yes | Product name, type, key ingredients |
| Key Selling Points | Textarea | Yes | Main benefits, unique features |
| Target Audience | Text | No | Who should buy (age, demographics) |
| User Pain Points | Textarea | No | Problems the product solves |
| Applicable Scenarios | Textarea | No | When/where to use the product |
| Promo Offer / CTA | Text | No | Special offer or call to action |
| Brand Visual Assets | Image Upload | No | Logo, product photos (max 5, 10MB each) |

**Validation Rules:**
- Product Information: 10-500 characters
- Key Selling Points: 10-1000 characters
- All optional fields: 0-1000 characters
- Images: JPG/PNG/WebP, max 10MB, max 5 files

**Success Metric**: User receives five content pieces

### Phase 3: Content Review & Feedback (10-15 minutes)

**User Flow:**

```
Results Page (Results.tsx)
    ↓
User reads first content piece
    ├─ Visual Storyboard (Mandarin)
    ├─ Platform Caption (Mandarin)
    └─ Strategy Explanation (English)
    ↓
User clicks "Copy" to copy caption to clipboard
    ↓
User rates content as "Helpful" or "Not Helpful"
    ↓
User optionally leaves comment
    ↓
User repeats for remaining 4 pieces
    ↓
User can:
    ├─ Generate new content (different product)
    ├─ Upgrade to Pro (unlimited generations)
    └─ Share feedback (email)
```

**Content Display:**

Each of the five content pieces includes:

1. **Visual Storyboard (Mandarin)** - 100-200 character description of a video scene concept
   - Example: "温馨家庭场景：一位老人小小碰到划伤，手臂出现淤青，子女关切地给出产品涂抹，第二天淤青明显变淡。最后全家围坐餐桌，老人开心展示恢复的手臂。"
   - Targets emotional resonance and family values

2. **Platform Caption (Mandarin)** - 50-150 character social media ready copy
   - Example: "父母健康，子女安心。专业淤青修复，让关爱不留痕迹。买1送1，为家人备上一份安心。"
   - Optimized for WeChat, Douyin, Xiaohongshu character limits
   - Includes CTA and emotional hook

3. **Strategy Explanation (English)** - 200-400 character cultural insight
   - Example: "This approach emphasizes filial piety (孝) and family care, core values in Chinese culture. The multi-generational family scene triggers emotional connection and trust. The 'buy 1 get 1' offer is culturally resonant as it allows the buyer to gift to family members."
   - Helps Western marketers understand why this messaging works

**Feedback Mechanism:**

After each content piece, users can:
- Click "Helpful" (thumbs up) - indicates this content style resonates
- Click "Not Helpful" (thumbs down) - indicates this approach doesn't fit brand
- Optional: Leave a comment explaining their feedback

**Data Collection:**
- Feedback is stored in the `generatedContent.userFeedbackScore` column
- Comments are stored in `generatedContent.userFeedbackText`
- This data trains future AI models to improve content quality

**Success Metric**: User provides feedback on at least 1 piece

### Phase 4: Upgrade Decision (15-30 minutes)

**User Flow:**

```
After first generation, user sees:
    ↓
"You've used your free generation for today"
    ↓
Option 1: Upgrade to Pro ($29/month)
    ├─ Unlimited generations
    ├─ Unlimited image uploads
    ├─ Priority support
    └─ Click → Stripe checkout
    ↓
Option 2: Come back tomorrow (free tier limit)
    ├─ 3 generations per day
    ├─ 5 images per generation
    └─ Feedback-driven improvements
    ↓
Option 3: Share feedback (email)
    └─ Help us improve
```

**Pricing Tiers:**

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Generations/day | 3 | Unlimited | Unlimited |
| Images/generation | 5 | 10 | Unlimited |
| Content history | 30 days | Unlimited | Unlimited |
| Support | Community | Email | Priority |
| Price | Free | $29/month | $99/month |

**Conversion Hooks:**
- After 3rd generation, show "Upgrade to Pro" CTA
- Show usage stats (e.g., "You've generated 3 pieces today, 2 remaining")
- Highlight Pro benefits (unlimited = more testing, faster iteration)
- Offer 7-day free trial (future enhancement)

**Success Metric**: User either upgrades or returns for more free generations

## Feature Specifications

### 1. Freemium Content Generator (MVP)

**Status**: ✅ Implemented

**Description**: Users submit product information and receive five AI-generated Mandarin content pieces optimized for Chinese social platforms.

**Technical Implementation**:
- Frontend: `ContentGenerator.tsx` form component
- Backend: `aiContentGenerator.ts` (DeepSeek API integration)
- Database: `brandInputs` and `generatedContent` tables
- Storage: Cloudflare R2 for image uploads

**Constraints**:
- Free tier: 3 generations per day
- Pro tier: Unlimited generations
- Content generation time: 15-30 seconds per request

**Success Criteria**:
- ✅ Form accepts all required fields
- ✅ Images upload to R2 and return CDN URLs
- ✅ DeepSeek generates valid JSON with 5 pieces
- ✅ Results display correctly with copy-to-clipboard
- ✅ Feedback mechanism stores user ratings

### 2. Image Upload & Storage (MVP)

**Status**: ✅ Implemented

**Description**: Users can upload up to 5 brand logos and product photos (max 10MB each) to provide visual context for content generation.

**Technical Implementation**:
- Frontend: `ImageUpload.tsx` component with drag-drop
- Backend: `imageUpload.ts` (Cloudflare R2 integration)
- Storage: Cloudflare R2 with CDN delivery
- Database: `brandAssets` table

**Constraints**:
- Max 5 images per generation
- Max 10MB per image
- Supported formats: JPG, PNG, WebP
- CDN domain: `www.longevityvalley.ai`

**Success Criteria**:
- ✅ Drag-drop upload works
- ✅ File validation prevents invalid uploads
- ✅ Images upload to R2 successfully
- ✅ CDN URLs returned and accessible
- ✅ Images persist in user account

### 3. Authentication (MVP)

**Status**: ✅ Implemented

**Description**: Users can sign up and log in using Manus OAuth (default) or Google OAuth (in development).

**Technical Implementation**:
- Frontend: `useAuth()` hook and login buttons
- Backend: `/api/oauth/callback` handler
- Session: JWT cookies (7-day expiration)
- Database: `users` table

**Constraints**:
- OAuth providers: Manus, Google (future)
- Session duration: 7 days
- Automatic account creation on first login

**Success Criteria**:
- ✅ Manus OAuth login works
- ⏳ Google OAuth login (in development)
- ✅ Session persists across page reloads
- ✅ Logout clears session

### 4. Subscription Management (Optional)

**Status**: ⏳ In Development

**Description**: Users can upgrade to Pro tier ($29/month) for unlimited content generation and priority support.

**Technical Implementation**:
- Frontend: `Pricing.tsx` page with Stripe checkout
- Backend: Stripe API integration for payments
- Webhooks: Stripe webhook handler for subscription events
- Database: Subscription fields in `users` table

**Constraints**:
- Stripe test mode (sandbox)
- Subscription auto-renewal
- Cancellation via Stripe customer portal

**Success Criteria**:
- ⏳ Stripe checkout works
- ⏳ Subscription status updates on payment
- ⏳ Usage limits enforced by subscription tier
- ⏳ Cancellation works

### 5. Content History (Future)

**Status**: 🔲 Not Started

**Description**: Users can view their past content generations and uploaded images.

**Technical Implementation**:
- Frontend: `History.tsx` page with pagination
- Backend: Query procedures for user content
- Database: Existing `generatedContent` and `brandAssets` tables

**Constraints**:
- Free tier: 30-day retention
- Pro tier: Unlimited retention
- Pagination: 10 items per page

**Success Criteria**:
- Content list displays correctly
- Pagination works
- Users can re-use past inputs

### 6. A.I. Brand Specialist Chat (Future)

**Status**: 🔲 Not Started

**Description**: Pro users get access to an interactive chat with an A.I. brand specialist who helps optimize content strategy.

**Technical Implementation**:
- Frontend: `AIChatBox.tsx` component (pre-built)
- Backend: Chat router with conversation persistence
- Database: `conversations` table
- AI: DeepSeek API for conversational responses

**Constraints**:
- Pro tier only
- 50 messages per month (free), unlimited for Enterprise
- Conversation history stored for 90 days

**Success Criteria**:
- Chat interface works
- AI responds contextually
- Conversations persist

## Data Model

### User Journey Data

The system collects data at each stage to understand user behavior and improve the product:

**Stage 1: Signup**
- `users.createdAt` - When user joined
- `users.loginMethod` - How they signed up (Manus, Google)

**Stage 2: Content Generation**
- `brandInputs.*` - What product information they provided
- `brandAssets.*` - What images they uploaded
- `generatedContent.createdAt` - When they generated content

**Stage 3: Feedback**
- `generatedContent.userFeedbackScore` - Did they like the content?
- `generatedContent.userFeedbackText` - Why or why not?

**Stage 4: Conversion**
- `users.subscriptionPlan` - Did they upgrade?
- `users.subscriptionStartedAt` - When did they subscribe?

### Data Privacy

All user data is:
- Encrypted in transit (HTTPS)
- Encrypted at rest (database encryption)
- Accessible only to the user and Manus team
- Deleted on account deletion (future feature)

## Metrics & Analytics

### Key Performance Indicators (KPIs)

| Metric | Target | Current |
|--------|--------|---------|
| Signup to Generation | 70% | TBD |
| Generation to Feedback | 60% | TBD |
| Feedback to Upgrade | 15% | TBD |
| Monthly Active Users | 1000+ | TBD |
| Avg. Generations/User | 2+ | TBD |
| Upgrade Conversion Rate | 10% | TBD |

### Tracking Implementation

- Frontend: Google Analytics (future)
- Backend: Event logging to database (future)
- Dashboard: Analytics page for users (future)

## Roadmap

### Phase 1: MVP (Current)
- ✅ Freemium content generator
- ✅ Image upload to R2
- ✅ Manus OAuth authentication
- ✅ Stripe payment integration (optional)

### Phase 2: Growth (Next 3 months)
- ⏳ Google OAuth integration
- ⏳ Content history and analytics
- ⏳ Usage limit enforcement
- ⏳ Email notifications

### Phase 3: Pro Features (3-6 months)
- 🔲 A.I. Brand Specialist chat
- 🔲 Advanced analytics dashboard
- 🔲 API access for agencies
- 🔲 Batch content generation

### Phase 4: Scale (6-12 months)
- 🔲 Multi-language support (Spanish, French, etc.)
- 🔲 Video content generation
- 🔲 Influencer marketplace
- 🔲 Enterprise features (team accounts, SSO)

---

**Last Updated**: November 2025  
**Author**: Manus AI
