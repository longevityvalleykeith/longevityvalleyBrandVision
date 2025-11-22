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
- [ ] Save checkpoint with working content generation
