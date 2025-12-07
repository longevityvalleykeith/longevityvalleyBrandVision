/**
 * Rashomon Evaluation Script
 *
 * LIVE Gemini test proving that different Directors produce different realities.
 * Named after the Kurosawa film where witnesses see the same event differently.
 *
 * PASS: Each Director interprets the same image uniquely
 * FAIL: Directors produce identical outputs (the brain transplant failed)
 *
 * @module scripts/eval-rashomon
 * @version 1.0.0
 */

import { config } from 'dotenv';
const result = config({ path: '.env.local' });
if (result.error) {
  console.error('Failed to load .env.local:', result.error);
  process.exit(1);
}

// Verify API key
if (!process.env['GEMINI_API_KEY'] || process.env['GEMINI_API_KEY'] === 'xxx') {
  console.error('GEMINI_API_KEY not configured in .env.local');
  process.exit(1);
}

import { analyzeBrandImage } from '../src/server/services/vision';
import { DIRECTOR_PERSONAS, type DirectorProfile } from '../src/config/directors';
import type { GeminiAnalysisOutput } from '../src/types';

// =============================================================================
// CONFIGURATION
// =============================================================================

// High-contrast car image for testing
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070';

interface DirectorResult {
  director: DirectorProfile;
  output: GeminiAnalysisOutput;
  duration: number;
}

// =============================================================================
// RASHOMON EVALUATION
// =============================================================================

async function runRashomonEvaluation(): Promise<void> {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║               RASHOMON EVALUATION (LIVE GEMINI)                  ║');
  console.log('║               "Same Image, Different Realities"                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log(`📷 Test Image: ${TEST_IMAGE_URL.substring(0, 60)}...`);
  console.log(`🎬 Directors: ${DIRECTOR_PERSONAS.map(d => d.name).join(', ')}`);
  console.log('\n');
  console.log('Starting evaluation... (This will make 4 LIVE Gemini API calls)\n');
  console.log('─'.repeat(68));

  const results: DirectorResult[] = [];

  // Loop through all 4 Directors
  for (const director of DIRECTOR_PERSONAS) {
    console.log(`\n🎬 Consulting ${director.name}...`);
    const startTime = Date.now();

    try {
      const output = await analyzeBrandImage(TEST_IMAGE_URL, director.id);
      const duration = Date.now() - startTime;

      results.push({ director, output, duration });

      console.log(`   ✅ ${director.name} completed in ${duration}ms`);
      console.log(`   📊 Scores: P=${output.physics_score.toFixed(1)} V=${output.vibe_score.toFixed(1)} L=${output.logic_score.toFixed(1)}`);
      console.log(`   🎯 Engine: ${output.recommended_engine}`);
    } catch (error) {
      console.error(`   ❌ ${director.name} failed:`, error instanceof Error ? error.message : error);
      // Create a fallback result
      results.push({
        director,
        output: {
          brand_attributes: { primary_colors: [], mood: 'error', industry: 'unknown' },
          visual_elements: { composition: '', focal_points: [], style_keywords: [] },
          quality_score: 0,
          integrity_score: 0,
          physics_score: 0,
          vibe_score: 0,
          logic_score: 0,
          director_commentary: 'Analysis failed',
          recommended_engine: 'kling',
          director_id: director.id,
        },
        duration: Date.now() - startTime,
      });
    }
  }

  console.log('\n');
  console.log('═'.repeat(68));
  console.log('');

  // =============================================================================
  // COMPARISON TABLE
  // =============================================================================

  console.log('╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                    RASHOMON COMPARISON TABLE                                         ║');
  console.log('╠════════════════╦═════════╦═══════╦═══════╦════════╦══════════════════════════════════════════════════╣');
  console.log('║ Director       ║ Physics ║ Vibe  ║ Logic ║ Engine ║ Commentary Snippet                               ║');
  console.log('╠════════════════╬═════════╬═══════╬═══════╬════════╬══════════════════════════════════════════════════╣');

  for (const result of results) {
    const name = result.director.name.padEnd(14);
    const physics = result.output.physics_score.toFixed(1).padStart(7);
    const vibe = result.output.vibe_score.toFixed(1).padStart(5);
    const logic = result.output.logic_score.toFixed(1).padStart(5);
    const engine = (result.output.recommended_engine || 'N/A').padEnd(6);

    // Extract first 45 chars of commentary (Vision line)
    const commentary = result.output.director_commentary || '';
    const visionMatch = commentary.match(/Vision:\s*([^\n]+)/);
    const snippet = (visionMatch?.[1] || commentary).substring(0, 45).padEnd(45);

    console.log(`║ ${name} ║ ${physics} ║ ${vibe} ║ ${logic} ║ ${engine} ║ ${snippet}... ║`);
  }

  console.log('╚════════════════╩═════════╩═══════╩═══════╩════════╩══════════════════════════════════════════════════╝');
  console.log('');

  // =============================================================================
  // ASSERTIONS
  // =============================================================================

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                        ASSERTIONS                                ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  const newtonian = results.find(r => r.director.id === 'newtonian');
  const visionary = results.find(r => r.director.id === 'visionary');
  const minimalist = results.find(r => r.director.id === 'minimalist');
  const provocateur = results.find(r => r.director.id === 'provocateur');

  let passCount = 0;
  let failCount = 0;

  // Assertion 1: Newtonian has higher Physics than Visionary
  const assertion1 = newtonian && visionary &&
    newtonian.output.physics_score > visionary.output.physics_score;
  console.log(`${assertion1 ? '✅' : '❌'} Newtonian Physics (${newtonian?.output.physics_score.toFixed(1)}) > Visionary Physics (${visionary?.output.physics_score.toFixed(1)})`);
  assertion1 ? passCount++ : failCount++;

  // Assertion 2: Visionary has higher Vibe than Newtonian
  const assertion2 = newtonian && visionary &&
    visionary.output.vibe_score > newtonian.output.vibe_score;
  console.log(`${assertion2 ? '✅' : '❌'} Visionary Vibe (${visionary?.output.vibe_score.toFixed(1)}) > Newtonian Vibe (${newtonian?.output.vibe_score.toFixed(1)})`);
  assertion2 ? passCount++ : failCount++;

  // Assertion 3: Minimalist has highest Logic
  const assertion3 = minimalist && newtonian && visionary &&
    minimalist.output.logic_score >= newtonian.output.logic_score &&
    minimalist.output.logic_score >= visionary.output.logic_score;
  console.log(`${assertion3 ? '✅' : '❌'} Minimalist Logic (${minimalist?.output.logic_score.toFixed(1)}) >= Others`);
  assertion3 ? passCount++ : failCount++;

  // Assertion 4: Newtonian routes to Kling
  const assertion4 = newtonian?.output.recommended_engine === 'kling';
  console.log(`${assertion4 ? '✅' : '❌'} Newtonian -> Kling (got: ${newtonian?.output.recommended_engine})`);
  assertion4 ? passCount++ : failCount++;

  // Assertion 5: Visionary routes to Luma
  const assertion5 = visionary?.output.recommended_engine === 'luma';
  console.log(`${assertion5 ? '✅' : '❌'} Visionary -> Luma (got: ${visionary?.output.recommended_engine})`);
  assertion5 ? passCount++ : failCount++;

  // Assertion 6: Commentaries are distinct
  const commentaries = results.map(r => r.output.director_commentary || '');
  const uniqueCommentaries = new Set(commentaries);
  const assertion6 = uniqueCommentaries.size === 4;
  console.log(`${assertion6 ? '✅' : '❌'} All 4 commentaries are distinct (${uniqueCommentaries.size}/4 unique)`);
  assertion6 ? passCount++ : failCount++;

  // Assertion 7: Newtonian uses physics vocabulary
  const newtonianCommentary = newtonian?.output.director_commentary?.toLowerCase() || '';
  const physicsKeywords = ['mass', 'velocity', 'momentum', 'friction', 'motion', 'force', 'physics'];
  const hasPhysicsKeyword = physicsKeywords.some(kw => newtonianCommentary.includes(kw));
  const assertion7 = hasPhysicsKeyword;
  console.log(`${assertion7 ? '✅' : '❌'} Newtonian commentary contains physics vocabulary`);
  assertion7 ? passCount++ : failCount++;

  // Assertion 8: Visionary uses vibe vocabulary
  const visionaryCommentary = visionary?.output.director_commentary?.toLowerCase() || '';
  const vibeKeywords = ['mood', 'atmosphere', 'light', 'emotion', 'feeling', 'dream', 'glow'];
  const hasVibeKeyword = vibeKeywords.some(kw => visionaryCommentary.includes(kw));
  const assertion8 = hasVibeKeyword;
  console.log(`${assertion8 ? '✅' : '❌'} Visionary commentary contains vibe vocabulary`);
  assertion8 ? passCount++ : failCount++;

  console.log('');

  // =============================================================================
  // FULL COMMENTARY OUTPUT
  // =============================================================================

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    FULL DIRECTOR COMMENTARIES                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  for (const result of results) {
    console.log(`\n${'─'.repeat(68)}`);
    console.log(`${result.director.avatar} ${result.director.name} (${result.director.archetype})`);
    console.log(`📍 "${result.director.quote}"`);
    console.log(`${'─'.repeat(68)}`);
    console.log(result.output.director_commentary || 'No commentary available');
    console.log(`\n🎯 Recommended Engine: ${result.output.recommended_engine}`);
    console.log(`⏱️  Duration: ${result.duration}ms`);
  }

  console.log('\n');

  // =============================================================================
  // CTO REPORT
  // =============================================================================

  const timestamp = new Date().toISOString();
  const totalTests = passCount + failCount;
  const passRate = ((passCount / totalTests) * 100).toFixed(1);

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    CTO VERIFICATION REPORT                       ║');
  console.log('║                    Rashomon Evaluation (LIVE)                    ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Feature: Director Persona System (Two-Step Architecture)        ║`);
  console.log(`║  Timestamp: ${timestamp}              ║`);
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Assertions: ${String(totalTests).padEnd(2)} │ Pass Rate: ${passRate}%                     ║`);
  console.log(`║  Passed:           ${String(passCount).padEnd(2)} │ Failed: ${String(failCount).padEnd(2)}                          ║`);
  console.log('╠══════════════════════════════════════════════════════════════════╣');

  if (failCount === 0) {
    console.log('║  VERDICT: ✅ RASHOMON EFFECT CONFIRMED                           ║');
    console.log('║                                                                  ║');
    console.log('║  The same image produces DIFFERENT realities:                    ║');
    console.log('║  - Newtonian sees PHYSICS (mass, velocity, motion)               ║');
    console.log('║  - Visionary sees VIBE (mood, atmosphere, emotion)               ║');
    console.log('║  - Minimalist sees LOGIC (structure, typography, clarity)        ║');
    console.log('║  - Provocateur sees CHAOS (experimental, unpredictable)          ║');
    console.log('║                                                                  ║');
    console.log('║  "Changing the Director changes the Reality." - PROVEN           ║');
  } else {
    console.log('║  VERDICT: ❌ RASHOMON EFFECT INCOMPLETE                          ║');
    console.log('║                                                                  ║');
    console.log('║  Some assertions failed. Directors may not be distinct enough.   ║');
    console.log('║  Review the comparison table and commentary outputs above.       ║');
    console.log('║                                                                  ║');
    console.log('║  ACTION: The test failed. Fix the code.                          ║');
  }

  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Exit with appropriate code
  process.exit(failCount === 0 ? 0 : 1);
}

// Run the evaluation
runRashomonEvaluation().catch((error) => {
  console.error('Rashomon evaluation failed:', error);
  process.exit(1);
});
