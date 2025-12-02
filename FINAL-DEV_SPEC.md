# 📜 FINAL-DEV_SPEC.md: Longevity Valley Architecture
**Authority:** Gemini (CTO)
**Stack:** Next.js 15 + Supabase (Postgres/Realtime) + tRPC (v11)
**Testing Strategy:** Headless-First (Deno/Vitest)

## 1. AI Agent Roles & Responsibilities

### **The Strategist: Gemini 1.5 Pro (or 3.0)**
* **Role:** **Brand DNA Extraction**.
* **Input:** Raw Image / Brand Assets.
* **Output:** JSON Strategy + `style_reference_url` (Optimized for Luma).
* **Safety:** **Integrity Filter**. Flags fake/spam inputs (Score < 0.4 = Flagged).

### **The Technical Director: DeepSeek V3**
* **Role:** **Cinematography & Routing**.
* **Input:** Brand Strategy JSON + `SKILL.md` Logic.
* **Task:**
    1.  Determine **Route** (Kling vs. Luma vs. Gemini 3 Pro).
    2.  Write **Technical Script** (Camera angles, lighting, duration).
* **Output:** Storyboard JSON.

### **The Storyboard Artist: Imagen 3 Fast (Vertex AI)**
* **Role:** **Rapid Prototyping**.
* **Task:** Generate static image previews from the Technical Script.
* [cite_start]**Why:** "Low Impedance" integration with Gemini Vision; sub-4s latency[cite: 73, 129]. [cite_start]Eliminates the need for complex prompt translation required by Flux[cite: 34].

### **The Production Engines (Dynamic Routing)**
* [cite_start]**Engine A: Kling AI:** For high physics/liquid dynamics/complex motion[cite: 113].
* [cite_start]**Engine B: Luma Dream Machine:** For "Vibe" transfer via `style_reference` (Zero-shot style transfer)[cite: 86].
* [cite_start]**Engine C: Gemini 3 Pro Image:** For high logic/text requirements and "Concept Passthrough"[cite: 40].

---

## 2. Database Schema (Supabase SSOT)

### Table: `vision_jobs` (Phase 3B)
* `id`: uuid (PK)
* `user_id`: uuid (FK)
* `status`: enum('uploading', 'analyzing', 'completed', 'flagged')
* `image_url`: text (Original Upload)
* `style_reference_url`: text (Asset optimized for Luma injection)
* `analysis_data`: jsonb (Brand DNA: Physics Score, Vibe Score, Logic Score)

### Table: `vision_job_video_prompts` (Phase 3C - The Director)
* `id`: uuid (PK)
* `job_id`: uuid (FK)
* `production_engine`: enum('KLING', 'LUMA', 'GEMINI_PRO')
* `status`: enum('scripting', 'preview_generation', 'review', 'rendering', 'completed')
* `scenes_data`: jsonb
    * *Schema Array:*
        ```typescript
        {
          "id": string,
          "cinematography_prompt": string,
          "preview_image_url": string,     // Imagen 3 Fast Output
          "traffic_light": "GREEN" | "YELLOW" | "RED",
          "user_feedback": string,
          "final_video_url": string | null
        }
        ```

---

## 3. The "Financial Firewall" Workflow

1.  **State: `SCRIPTING`** $\rightarrow$ DeepSeek determines Route & Script.
2.  [cite_start]**State: `PREVIEW_GENERATION`** $\rightarrow$ Imagen 3 Fast generates previews (~$0.025/img)[cite: 62].
3.  **State: `REVIEW` (Traffic Light)**
    * 🔴 **RED:** Re-roll Script & Preview.
    * 🟡 **YELLOW (Conversational Edit):** User: "Make it warmer." [cite_start]$\rightarrow$ Gemini 3 Pro maintains context and adjusts without full re-roll[cite: 54].
    * [cite_start]🟢 **GREEN:** Dispatch to `production_engine` (e.g., Kling at ~$0.028)[cite: 111].

---

## 4. Headless TDD Requirement
**Script:** `supabase/functions/tests/director-flow.ts`

1.  **Test 1 (Routing):** Mock "Sports Drink" input. Assert `production_engine` == 'KLING'.
2.  **Test 2 (Preview):** Trigger generation. Assert `preview_image_url` is valid.
3.  **Test 3 (Safety):** Simulate "Low Integrity" input. Assert job `flagged`.
