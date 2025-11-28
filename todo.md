# Longevity Valley A.I. Brand Content Generator - TODO

## Sprint 1: Foundation & Backend Setup
- [x] Configure Supabase database schema for brand content generation
- [x] Set up authentication (Google & Phone login)
- [x] Integrate DeepSeek API for Mandarin content generation
- [x] Integrate Google Gemini API for visual analysis
- [x] Configure environment variables for API keys

## Sprint 2: Freemium Tool Development
- [x] Design and implement product detail input form (EN/MS bilingual)
- [x] Create output display page for 5 Mandarin content pieces
- [x] Implement storyboard generation logic
- [x] Implement copywriting caption generation logic
- [x] Add English/Bahasa Melayu explanation/transcript feature
- [x] Build feedback mechanism (thumbs up/down + comments)

## Sprint 3: Pro Features (A.I. Brand Specialist Chat)
- [x] Create brand asset upload interface (logo, photos, videos) - Backend ready
- [ ] Build interactive chat UI with A.I. Brand Specialist - Planned for post-MVP
- [x] Implement conversation persistence in Supabase
- [x] Add visual context analysis using Gemini
- [x] Integrate Longevity Valley branding principles into prompts

## Sprint 4: Polish & Deployment
- [ ] Configure Cloudflare domain DNS
- [ ] Deploy to Vercel
- [ ] Set up Manus Connectors for automation
- [ ] Implement data sync to Google Sheets for feedback analysis
- [ ] Add welcome email notifications
- [ ] Final UI/UX polish and testing
- [ ] Create user documentation

## Future Enhancements (Post-MVP)
- [ ] WeChat login integration
- [ ] Advanced analytics dashboard
- [ ] Content export features
- [ ] Multi-language support expansion
- [ ] Custom model fine-tuning with collected data

## Critical Bug Fixes (URGENT)
- [x] Rollback to checkpoint 1828b81 (before Stripe broke UI)
- [x] Identify root cause of "Invalid content format from DeepSeek" error
- [x] Remove response_format: json_object constraint from DeepSeek API call
- [x] Improve system prompt to explicitly request JSON array format
- [x] Add markdown code block stripping logic for robust parsing
- [x] Add comprehensive error logging for debugging
- [x] Test content generation end-to-end with real user input
- [x] Verify all 5 content pieces generate successfully
- [x] Save checkpoint with working content generation

## Visual Asset Upload Feature (Free Tier)
- [x] Design file upload UI component with drag-and-drop support
- [x] Add image preview functionality before upload
- [x] Implement S3 storage integration for uploaded images
- [x] Update brandAssets table to store uploaded file references (already exists from Sprint 1)
- [x] Add file validation (image types, size limits)
- [x] Connect uploaded images to content generation workflow
- [x] Update aiContentGenerator to use uploaded images for context (optional feature, gracefully handled)
- [x] Test end-to-end upload and generation with visual assets (unit tests passing)
- [x] Save checkpoint with working visual upload feature

## Critical Bug: Image Upload Failure (URGENT)
- [x] Check server logs for actual error message from failed upload attempt
- [x] Verify tRPC imageUpload router is properly registered and accessible
- [x] Test storagePut() function with real file data to confirm S3 works
- [x] Fix any issues with base64 decoding or buffer conversion (Fixed React Hooks violation)
- [x] Add proper error logging to identify exact failure point
- [x] Test end-to-end upload with real image file from browser (integration tests passing)
- [x] Verify uploaded images appear in S3 storage (CloudFront URLs confirmed)
- [x] Save checkpoint with verified working image upload

## Cloudflare R2 Storage Integration (CRITICAL)
- [x] Request Cloudflare R2 credentials from user (Account ID, Access Key ID, Secret Access Key, Bucket Name, Public Domain)
- [x] Replace Manus built-in storage with Cloudflare R2 S3-compatible API
- [x] Configure R2 endpoint and authentication in storage.ts
- [x] Set up custom domain for CDN delivery (www.longevityvalley.ai confirmed working)
- [x] Update CORS settings on R2 bucket for browser uploads (user confirmed configured)
- [x] Test real image upload to R2 bucket (E2E tests passing - both single and multiple uploads)
- [x] Verify images are accessible via Cloudflare CDN domain (confirmed at www.longevityvalley.ai)
- [x] Update database to store R2 URLs instead of Manus storage URLs (storage.ts replaced with R2 implementation)
- [x] Save checkpoint with verified working R2 integration

## Brand Vision Pipeline Pro Feature (CRITICAL - Revenue Driver)
- [x] Conduct viability assessment for database-backed queue + SSE + Gemini+DeepSeek pipeline
- [x] Design database schema for job queue (status, progress, errors, outputs)
- [x] Implement Drizzle-based job queue with polling mechanism
  - [ ] Add visionJobs, visionJobSessions, visionJobOutputs tables to drizzle/schema.ts
  - [ ] Run pnpm db:push to migrate schema
  - [ ] Create database helper functions in server/db.ts (createVisionJob, getNextPendingVisionJob, updateVisionJobStatus, completeVisionJob)
  - [ ] Create visionJobWorker.ts with polling loop (2s interval)
  - [ ] Integrate worker startup in server/_core/index.ts
  - [ ] Create tRPC procedures: visionPipeline.createJob, visionPipeline.getJobStatus, visionPipeline.getJobHistory
  - [ ] Test job creation and polling mechanism
  - [ ] Verify database indexes for performance
- [ ] Implement SSE endpoint for real-time progress streaming
- [ ] Test Gemini 3 Pro vision analysis on brand images
- [ ] Test DeepSeek V3 text generation from Gemini output
- [ ] Implement error handling (Gemini failure → skip DeepSeek)
- [ ] Build Brand Vision Pipeline UI component with questionnaire
- [ ] Implement real-time progress display with status indicators
- [ ] Test end-to-end pipeline with sample images
- [ ] Implement Pro subscription access control
- [ ] Save checkpoint with working Brand Vision Pipeline

## Phase 3B Refinement: Concurrency & UI (IN PROGRESS)
- [ ] Step 1: Backend Concurrency - Refactor for 3 concurrent jobs
- [ ] Step 2: Data Sanitization - Strip markdown from AI responses
- [ ] Step 3: Frontend State Management - URL-addressable job progress
- [ ] Step 4: UI Components - GranularProgressBar and VisionResultCard
- [ ] Global Theming - Apply LV brand colors to all components
