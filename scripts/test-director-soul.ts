/**
 * Director Soul Test
 *
 * Verifies the Gemini model is obeying the 3-Beat Pulse tone
 * (Vision/Safety/Magic) with simple, punchy English.
 *
 * @module scripts/test-director-soul
 */

// Load env BEFORE importing vision service
import { config } from 'dotenv';
const result = config({ path: '.env.local' });
if (result.error) {
  console.error('Failed to load .env.local:', result.error);
  process.exit(1);
}

if (!process.env['GEMINI_API_KEY'] || process.env['GEMINI_API_KEY'] === 'xxx') {
  console.error('❌ GEMINI_API_KEY not configured');
  process.exit(1);
}

const { analyzeBrandImage } = await import('../src/server/services/vision');

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

// High-quality product/action shot for testing
const TEST_IMAGE_URL = 'https://images.pexels.com/photos/707046/pexels-photo-707046.jpeg?auto=compress&cs=tinysrgb&w=800';
const TEST_IMAGE_DESCRIPTION = 'BMW luxury car on dusty road';

// =============================================================================
// MAIN TEST
// =============================================================================

async function runDirectorSoulTest(): Promise<void> {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           🎬 DIRECTOR SOUL TEST - 3-Beat Pulse Check             ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log(`📸 Test Image: ${TEST_IMAGE_DESCRIPTION}`);
  console.log(`🔗 URL: ${TEST_IMAGE_URL.substring(0, 60)}...`);
  console.log('\n⏳ Analyzing...\n');

  try {
    const analysis = await analyzeBrandImage(TEST_IMAGE_URL);

    // ==========================================================================
    // DIRECTOR'S VISION (The 3 Beats)
    // ==========================================================================
    console.log('┌──────────────────────────────────────────────────────────────────┐');
    console.log('│           🎬 DIRECTOR\'S VISION (The 3 Beats)                     │');
    console.log('└──────────────────────────────────────────────────────────────────┘');
    console.log('');

    if (analysis.director_commentary) {
      // Split by newlines and print each beat
      const beats = analysis.director_commentary.split('\n').filter(Boolean);
      for (const beat of beats) {
        console.log(`  ${beat.trim()}`);
      }
    } else {
      console.log('  ❌ NO DIRECTOR COMMENTARY RETURNED');
    }

    console.log('');

    // ==========================================================================
    // TONE VERIFICATION
    // ==========================================================================
    console.log('┌──────────────────────────────────────────────────────────────────┐');
    console.log('│           ✅ TONE VERIFICATION                                   │');
    console.log('└──────────────────────────────────────────────────────────────────┘');
    console.log('');

    const commentary = analysis.director_commentary || '';
    const hasVision = commentary.includes('👀');
    const hasSafety = commentary.includes('🛡️');
    const hasMagic = commentary.includes('✨');

    console.log(`  👀 Vision Beat:  ${hasVision ? '✅ FOUND' : '❌ MISSING'}`);
    console.log(`  🛡️ Safety Beat:  ${hasSafety ? '✅ FOUND' : '❌ MISSING'}`);
    console.log(`  ✨ Magic Beat:   ${hasMagic ? '✅ FOUND' : '❌ MISSING'}`);
    console.log('');

    const allBeatsPresent = hasVision && hasSafety && hasMagic;
    if (allBeatsPresent) {
      console.log('  🎉 TONE CHECK: PASSED - All 3 beats present!');
    } else {
      console.log('  ⚠️  TONE FAILURE: Missing one or more beats!');
    }

    console.log('');

    // ==========================================================================
    // SCENE BOARD RAW DATA
    // ==========================================================================
    console.log('┌──────────────────────────────────────────────────────────────────┐');
    console.log('│           📐 SCENE BOARD RAW DATA                                │');
    console.log('└──────────────────────────────────────────────────────────────────┘');
    console.log('');

    console.log('  Focal Points:');
    const focalPoints = analysis.visual_elements?.focal_points || [];
    for (const point of focalPoints) {
      console.log(`    • ${point}`);
    }

    console.log('');
    console.log('  Composition:');
    console.log(`    ${analysis.visual_elements?.composition || 'N/A'}`);

    console.log('');
    console.log('  Style Keywords:');
    const keywords = analysis.visual_elements?.style_keywords || [];
    console.log(`    [${keywords.join(', ')}]`);

    console.log('');

    // ==========================================================================
    // SCORING MATRIX
    // ==========================================================================
    console.log('┌──────────────────────────────────────────────────────────────────┐');
    console.log('│           🧠 SCORING MATRIX                                      │');
    console.log('└──────────────────────────────────────────────────────────────────┘');
    console.log('');

    const physicsBar = '█'.repeat(Math.round(analysis.physics_score)) + '░'.repeat(10 - Math.round(analysis.physics_score));
    const vibeBar = '█'.repeat(Math.round(analysis.vibe_score)) + '░'.repeat(10 - Math.round(analysis.vibe_score));
    const logicBar = '█'.repeat(Math.round(analysis.logic_score)) + '░'.repeat(10 - Math.round(analysis.logic_score));

    console.log(`  Physics: ${physicsBar} ${analysis.physics_score.toFixed(1)}/10`);
    console.log(`  Vibe:    ${vibeBar} ${analysis.vibe_score.toFixed(1)}/10`);
    console.log(`  Logic:   ${logicBar} ${analysis.logic_score.toFixed(1)}/10`);

    console.log('');
    const engineEmoji = analysis.recommended_engine === 'kling' ? '⚙️' : '🌈';
    console.log(`  Recommended Engine: ${engineEmoji} ${analysis.recommended_engine?.toUpperCase() || 'N/A'}`);

    console.log('');

    // ==========================================================================
    // FINAL VERDICT
    // ==========================================================================
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    if (allBeatsPresent) {
      console.log('║  ✅ DIRECTOR SOUL TEST: PASSED                                   ║');
      console.log('║  The AI is speaking like a creative partner, not a robot.       ║');
    } else {
      console.log('║  ❌ DIRECTOR SOUL TEST: FAILED                                   ║');
      console.log('║  The 3-Beat Pulse format is not being followed correctly.       ║');
    }
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');

    process.exit(allBeatsPresent ? 0 : 1);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

runDirectorSoulTest();
