# Architecture: The Director's Lounge (Modular Persona System)

**Document Version:** 1.0
**Date:** December 2025
**Status:** Approved for Implementation
**Context:** Phase 3C (Director Mode)

---

## 1. Core Philosophy: "Casting, Not Configuring"

We replace complex settings sliders with **Agentic Personas**.
The user does not "tune parameters"; they **"hire talent."**

*   **The User:** Executive Producer.
*   **The AI:** A roster of elite Directors.
*   **The Interaction:** Switching Directors changes the **Risk**, **Vocabulary**, **Engine Choice**, and **Temporal Pacing** instantly.

---

## 2. The Director Persona Schema ('DirectorProfile')

This is the data structure that defines a "Soul."

```typescript
export interface DirectorProfile {
  id: string;           // e.g., 'newtonian'
  name: string;         // e.g., "The Newtonian"
  avatar: string;       // Emoji or Asset URL
  archetype: string;    // e.g., "Physics Specialist"
  quote: string;        // e.g., "Respect the gravity."

  // 🧠 The Brain (Logic & Bias)
  biases: {
    physicsMultiplier: number; // >1.0 favors Kling
    vibeMultiplier: number;    // >1.0 favors Luma
    logicMultiplier: number;   // >1.0 favors Gemini/Runway
  };

  // ⚠️ The Safety Valve
  riskProfile: {
    label: 'Safe' | 'Balanced' | 'Experimental';
    hallucinationThreshold: number; // 0.0 (Strict) to 1.0 (Wild)
  };

  // 🗣️ The Voice (Linguistic Injection)
  voice: {
    tone: string;       // e.g., "Technical, Precise, Cold"
    vocabulary: string[]; // ["Momentum", "Friction", "Mass", "Velocity"]
    forbidden: string[];  // ["Magic", "Dream", "Glow"]
  };

  // 🎬 The Instructions (System Prompt Segment)
  systemPromptModifier: string;

  // 🎯 The Routing (Engine Preference)
  preferredEngine: 'kling' | 'luma' | 'gemini' | 'runway' | 'random';
}
```

---

## 3. The Persona Registry (The Roster)

We launch with 4 distinct Personalities.

### A. The Newtonian (Default for High Physics)
*   **Archetype:** The Simulationist.
*   **Bias:** Physics x1.5
*   **Risk:** Safe (0.2) -> "Don't warp the object."
*   **Voice:** "I see mass and velocity. I will preserve the structural integrity."
*   **Engine:** Hard-lock **Kling AI**.

### B. The Visionary (Default for High Vibe)
*   **Archetype:** The Auteur.
*   **Bias:** Vibe x1.5
*   **Risk:** Experimental (0.8) -> "Let the colors bleed. Morphing is art."
*   **Voice:** "I see a mood. I will enhance the atmosphere and lighting."
*   **Engine:** Hard-lock **Luma Dream Machine**.

### C. The Minimalist (Default for High Logic/Text)
*   **Archetype:** The Designer.
*   **Bias:** Logic x2.0
*   **Risk:** Safe (0.1) -> "Zero distortion allowed."
*   **Voice:** "I see structure and typography. I will stabilize the camera."
*   **Engine:** Hard-lock **Gemini Video / Runway**.

### D. The Provocateur (Wildcard)
*   **Archetype:** The Disruptor.
*   **Bias:** Vibe x1.2, Physics x1.2 (Chaos).
*   **Risk:** Experimental (0.95).
*   **Voice:** "I see potential for chaos. Let's break the rules."
*   **Engine:** Random / Best available for high motion-strength.

---

## 4. The Two-Step Architecture

To ensure speed and low cost, we separate **Analysis** (Expensive) from **Interpretation** (Cheap).

### Step 1: The "Eye" (Vision Service)
*   **Trigger:** Image Upload.
*   **Process:** Gemini 2.5 Flash analyzes pixels.
*   **Output:** **Raw Analysis JSON** (Objective).
    *   *Contains:* Objects, Colors, OCR Text, Scene Composition.
    *   *Does NOT Contain:* The Director's Pitch.
*   **Storage:** Saved to 'vision_jobs' table.

### Step 2: The "Voice" (Consultation Service)
*   **Trigger:** User selects a Director Card.
*   **Input:** Raw Analysis JSON + Director ID.
*   **Process:** Lightweight LLM Call (Gemini Flash).
*   **Prompt:** "You are [Director Name]. Look at this raw analysis. Pitch your vision."
*   **Output:**
    1.  **3-Beat Pulse:** (Vision / Safety / Magic)
    2.  **Scene Board:** (0s -> 2s -> 5s description)
    3.  **Routing:** Final Engine Selection.

---

## 5. The Scene Board (Temporal Logic)

The Director must output a timeline, not just a description. This maps to the UI Cards.

**JSON Structure:**
```json
"sceneBoard": {
  "start": {
    "time": "0s",
    "visual": "Static establishing shot. Sharp focus on logo.",
    "camera": "Locked off."
  },
  "middle": {
    "time": "2.5s",
    "visual": "Slow motion dust cloud expansion. Light leaks enter lens.",
    "camera": "Slow dolly in."
  },
  "end": {
    "time": "5s",
    "visual": "Logo resolves. Background blurs into bokeh.",
    "camera": "Freeze frame."
  }
}
```

---

## 6. Implementation Roadmap

1.  **Create Registry:** src/config/directors.ts (Store the personas).
2.  **Refactor Vision:** Split analyzeBrandImage into analyzeRawPixels and generateDirectorPitch.
3.  **Update Database:** Ensure vision_job_video_prompts can store the sceneBoard JSON.
4.  **Frontend:** Build the "Director Selector" UI (Horizontal Scroll Cards).

---

**End of Document**
