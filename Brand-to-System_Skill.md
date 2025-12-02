# 🧠 SKILL.md: Brand-to-System Alignment Logic
**Goal:** Minimize "Semantic Impedance" by routing Brand DNA to the correct Physics Engine.

## 1. Brand DNA Extraction (Gemini 3.0 Analysis)
**Prompt:** "Analyze this image. Output JSON with scores (1-10) for `physics_requirement`, `aesthetic_vibe`, and `semantic_density`."

| Parameter | Definition | Scoring Guide |
| :--- | :--- | :--- |
| **Physics** | Need for fluid dynamics, explosions, complex motion. | [cite_start]**10:** Sports drinks, Cars (High reliance on Kling's physics engine [cite: 113]). **1:** Stationary objects. |
| **Vibe** | Need for specific film grain, color grading, artistic style. | [cite_start]**10:** Fashion, Perfume (High reliance on Luma's style reference [cite: 86]). **1:** Generic corporate. |
| **Logic** | Need for readable text, specific UI elements, anatomical correctness. | [cite_start]**10:** Medical, Tech SaaS (High reliance on Gemini 3's reasoning [cite: 41]). **1:** Abstract art. |

## 2. The Routing Matrix (The Decision Tree)

### **Route A: The Physicist (Kling AI)**
* **Trigger:** `Physics Score > 7` AND `Logic Score < 6`.
* [cite_start]**Use Case:** Liquid splashes, fabric draping in wind, fast motion[cite: 114].
* **Implementation:** Use Kling 1.5 Professional Mode.

### **Route B: The Stylist (Luma Dream Machine)**
* **Trigger:** `Vibe Score > 7`.
* [cite_start]**Use Case:** Transferring a specific "Look & Feel" from the uploaded image without complex prompting[cite: 87].
* [cite_start]**Implementation:** Inject `vision_jobs.style_reference_url` into Luma's `style_reference` parameter[cite: 85].

### **Route C: The Logician (Gemini 3 Pro Image)**
* **Trigger:** `Logic Score > 7`.
* [cite_start]**Use Case:** Products with text, screens, or strict brand guidelines where "Concept Passthrough" is critical[cite: 40].
* [cite_start]**Implementation:** Use Vertex AI conversational editing for refinements[cite: 54].

## 3. Alignment Score (The Gatekeeper)
**Formula:** `Alignment = (Visual_Match * 0.5) + (Prompt_Adherence * 0.3) + (Brand_Safety * 0.2)`
* **Threshold:** Assets must score **> 8.0** to be shown to the user.
