/**
 * Two-Step Architecture Test
 *
 * Tests the Eye (analyzeRawPixels) and Voice (generateDirectorPitch) separately,
 * then demonstrates how different Directors interpret the same image.
 *
 * @module scripts/test-two-step
 */

import { config } from 'dotenv';
const result = config({ path: '.env.local' });
if (result.error) {
  console.error('Failed to load .env.local:', result.error);
  process.exit(1);
}

if (!process.env['GEMINI_API_KEY'] || process.env['GEMINI_API_KEY'] === 'xxx') {
  console.error('GEMINI_API_KEY not configured');
  process.exit(1);
}

const { analyzeRawPixels, generateDirectorPitch } = await import('../src/server/services/vision');
const { getAllDirectors } = await import('../src/config/directors');

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

const TEST_IMAGE_URL = 'https://images.pexels.com/photos/707046/pexels-photo-707046.jpeg?auto=compress&cs=tinysrgb&w=800';

// =============================================================================
// MAIN TEST
// =============================================================================

async function runTwoStepTest(): Promise<void> {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           🔬 TWO-STEP ARCHITECTURE TEST                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // =========================================================================
  // STEP 1: THE EYE
  // =========================================================================
  console.log('┌──────────────────────────────────────────────────────────────────┐');
  console.log('│  STEP 1: THE EYE (Raw Pixel Analysis)                            │');
  console.log('└──────────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log(`📸 Analyzing: ${TEST_IMAGE_URL.substring(0, 50)}...`);
  console.log('⏳ This is the EXPENSIVE step (image analysis)...\n');

  const startEye = Date.now();
  const rawAnalysis = await analyzeRawPixels(TEST_IMAGE_URL);
  const eyeDuration = Date.now() - startEye;

  console.log(`✅ THE EYE completed in ${(eyeDuration / 1000).toFixed(1)}s\n`);

  // Display raw scores
  console.log('📊 Raw Trinity Scores (Before Director Bias):');
  const physicsBar = '█'.repeat(Math.round(rawAnalysis.physics_score)) + '░'.repeat(10 - Math.round(rawAnalysis.physics_score));
  const vibeBar = '█'.repeat(Math.round(rawAnalysis.vibe_score)) + '░'.repeat(10 - Math.round(rawAnalysis.vibe_score));
  const logicBar = '█'.repeat(Math.round(rawAnalysis.logic_score)) + '░'.repeat(10 - Math.round(rawAnalysis.logic_score));

  console.log(`  Physics: ${physicsBar} ${rawAnalysis.physics_score.toFixed(1)}/10`);
  console.log(`  Vibe:    ${vibeBar} ${rawAnalysis.vibe_score.toFixed(1)}/10`);
  console.log(`  Logic:   ${logicBar} ${rawAnalysis.logic_score.toFixed(1)}/10`);
  console.log('');

  console.log('🔍 Detected Objects:', rawAnalysis.visual_elements.detected_objects?.join(', ') || 'N/A');
  console.log('📝 Detected Text:', rawAnalysis.visual_elements.detected_text?.join(', ') || 'None');
  console.log('');

  // =========================================================================
  // STEP 2: THE VOICE (Multiple Directors)
  // =========================================================================
  console.log('┌──────────────────────────────────────────────────────────────────┐');
  console.log('│  STEP 2: THE VOICE (Director Interpretations)                    │');
  console.log('└──────────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('⚡ This is the CHEAP step (no image, just text prompts)...\n');

  const directors = getAllDirectors();

  for (const director of directors) {
    console.log(`\n${'─'.repeat(68)}`);
    console.log(`${director.avatar} ${director.name.toUpperCase()} (${director.archetype})`);
    console.log(`"${director.quote}"`);
    console.log(`${'─'.repeat(68)}`);

    const startVoice = Date.now();
    const pitch = await generateDirectorPitch(rawAnalysis, director.id);
    const voiceDuration = Date.now() - startVoice;

    console.log(`⏱️  Generated in ${(voiceDuration / 1000).toFixed(1)}s`);
    console.log('');

    // 3-Beat Pulse
    console.log('📣 3-Beat Pulse:');
    console.log(`  👀 Vision: ${pitch.three_beat_pulse.vision}`);
    console.log(`  🛡️ Safety: ${pitch.three_beat_pulse.safety}`);
    console.log(`  ✨ Magic:  ${pitch.three_beat_pulse.magic}`);
    console.log('');

    // Biased Scores
    console.log('📊 Biased Scores:');
    const bPhysics = '█'.repeat(Math.round(pitch.biased_scores.physics)) + '░'.repeat(10 - Math.round(pitch.biased_scores.physics));
    const bVibe = '█'.repeat(Math.round(pitch.biased_scores.vibe)) + '░'.repeat(10 - Math.round(pitch.biased_scores.vibe));
    const bLogic = '█'.repeat(Math.round(pitch.biased_scores.logic)) + '░'.repeat(10 - Math.round(pitch.biased_scores.logic));

    console.log(`  Physics: ${bPhysics} ${pitch.biased_scores.physics.toFixed(1)}/10`);
    console.log(`  Vibe:    ${bVibe} ${pitch.biased_scores.vibe.toFixed(1)}/10`);
    console.log(`  Logic:   ${bLogic} ${pitch.biased_scores.logic.toFixed(1)}/10`);
    console.log('');

    // Routing
    const engineEmoji = pitch.recommended_engine === 'kling' ? '⚙️' : '🌈';
    console.log(`🎬 Engine: ${engineEmoji} ${pitch.recommended_engine.toUpperCase()}`);
    console.log(`⚠️  Risk: ${pitch.risk_level}`);
    console.log('');

    // Scene Board
    console.log('🎬 Scene Board:');
    console.log(`  [${pitch.scene_board.start.time}] ${pitch.scene_board.start.visual}`);
    console.log(`        Camera: ${pitch.scene_board.start.camera}`);
    console.log(`  [${pitch.scene_board.middle.time}] ${pitch.scene_board.middle.visual}`);
    console.log(`        Camera: ${pitch.scene_board.middle.camera}`);
    console.log(`  [${pitch.scene_board.end.time}] ${pitch.scene_board.end.visual}`);
    console.log(`        Camera: ${pitch.scene_board.end.camera}`);
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ TWO-STEP ARCHITECTURE TEST COMPLETE                          ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  THE EYE (1 call):     ${(eyeDuration / 1000).toFixed(1)}s (expensive, cacheable)              ║`);
  console.log(`║  THE VOICE (${directors.length} calls): Fast (cheap, repeatable)               ║`);
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  Users can now switch Directors without re-analyzing pixels!     ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  process.exit(0);
}

runTwoStepTest().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
