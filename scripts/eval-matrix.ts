/**
 * Proprietary Scoring Matrix - Live Evaluation Script
 *
 * Tests the Gemini 2.5 prompt to verify correct categorization
 * based on Physics, Vibe, and Logic scores.
 *
 * @module scripts/eval-matrix
 */

// MUST load env BEFORE any imports that use process.env
import { config } from 'dotenv';
const result = config({ path: '.env.local' });
if (result.error) {
  console.error('Failed to load .env.local:', result.error);
  process.exit(1);
}

// Verify API key is loaded
if (!process.env['GEMINI_API_KEY'] || process.env['GEMINI_API_KEY'] === 'xxx') {
  console.error('❌ GEMINI_API_KEY not configured in .env.local');
  process.exit(1);
}
console.log('✅ GEMINI_API_KEY loaded');

// Now safe to import vision service (uses process.env at module load)
const { analyzeBrandImage } = await import('../src/server/services/vision');

// =============================================================================
// TEST CASES
// =============================================================================

interface TestCase {
  type: 'Physics' | 'Vibe' | 'Logic';
  description: string;
  url: string;
  expectedHighest: 'physics_score' | 'vibe_score' | 'logic_score';
}

const TEST_CASES: TestCase[] = [
  {
    type: 'Physics',
    description: 'Race car motion',
    // Race car - high physics (speed, machinery, motion)
    url: 'https://images.pexels.com/photos/707046/pexels-photo-707046.jpeg?auto=compress&cs=tinysrgb&w=800',
    expectedHighest: 'physics_score',
  },
  {
    type: 'Vibe',
    description: 'Starry night painting',
    // Van Gogh Starry Night - high vibe (artistic, emotional, aesthetic)
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
    expectedHighest: 'vibe_score',
  },
  {
    type: 'Logic',
    description: 'Stop sign clear CTA',
    // Stop sign - high logic (clear message, CTA)
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/STOP_sign.jpg/800px-STOP_sign.jpg',
    expectedHighest: 'logic_score',
  },
];

// =============================================================================
// EVALUATION
// =============================================================================

interface EvalResult {
  type: string;
  description: string;
  physics: number;
  vibe: number;
  logic: number;
  integrity: number;
  engine: string;
  passed: boolean;
  reason: string;
  directorCommentary?: string;
}

async function evaluateTestCase(testCase: TestCase): Promise<EvalResult> {
  try {
    console.log(`  Analyzing ${testCase.type}: ${testCase.description}...`);
    const analysis = await analyzeBrandImage(testCase.url);

    const scores = {
      physics_score: analysis.physics_score,
      vibe_score: analysis.vibe_score,
      logic_score: analysis.logic_score,
    };

    // Find the highest score
    const highest = Object.entries(scores).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as keyof typeof scores;

    const passed = highest === testCase.expectedHighest;
    const reason = passed
      ? `${testCase.expectedHighest.replace('_score', '')} is highest`
      : `Expected ${testCase.expectedHighest.replace('_score', '')}, got ${highest.replace('_score', '')}`;

    return {
      type: testCase.type,
      description: testCase.description,
      physics: analysis.physics_score,
      vibe: analysis.vibe_score,
      logic: analysis.logic_score,
      integrity: analysis.integrity_score,
      engine: analysis.recommended_engine || 'N/A',
      passed,
      reason,
      directorCommentary: analysis.director_commentary,
    };
  } catch (error) {
    return {
      type: testCase.type,
      description: testCase.description,
      physics: 0,
      vibe: 0,
      logic: 0,
      integrity: 0,
      engine: 'ERROR',
      passed: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function printTable(results: EvalResult[]): void {
  console.log('\n' + '='.repeat(100));
  console.log('PROPRIETARY SCORING MATRIX - EVALUATION RESULTS');
  console.log('='.repeat(100));

  // Header
  console.log(
    '| Type    | Description           | Physics | Vibe  | Logic | Integrity | Engine | Result |'
  );
  console.log(
    '|---------|----------------------|---------|-------|-------|-----------|--------|--------|'
  );

  // Rows
  for (const r of results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(
      `| ${r.type.padEnd(7)} | ${r.description.slice(0, 20).padEnd(20)} | ${r.physics.toFixed(1).padStart(7)} | ${r.vibe.toFixed(1).padStart(5)} | ${r.logic.toFixed(1).padStart(5)} | ${r.integrity.toFixed(2).padStart(9)} | ${r.engine.padStart(6)} | ${status} |`
    );
  }

  console.log('='.repeat(100));

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  console.log(`\nSUMMARY: ${passed}/${total} tests passed`);

  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED - Proprietary Matrix is working correctly!');
  } else {
    console.log('\n⚠️  FAILURES:');
    for (const r of results.filter(r => !r.passed)) {
      console.log(`   - ${r.type}: ${r.reason}`);
    }
  }

  console.log('\nENGINE ROUTING:');
  for (const r of results) {
    const routing = r.physics > r.vibe ? 'kling (physics-heavy)' : 'luma (aesthetic)';
    console.log(`   - ${r.type}: Routed to ${routing}`);
  }

  // Director Commentary section
  console.log('\n' + '='.repeat(100));
  console.log('DIRECTOR COMMENTARY');
  console.log('='.repeat(100));
  for (const r of results) {
    if (r.directorCommentary) {
      console.log(`\n🎬 ${r.type.toUpperCase()}:`);
      console.log(`   "${r.directorCommentary}"`);
    } else {
      console.log(`\n🎬 ${r.type.toUpperCase()}: No commentary available`);
    }
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log('🔬 PROPRIETARY SCORING MATRIX - LIVE EVALUATION\n');
  console.log('Testing Gemini 2.5 Flash with 3 image categories...\n');

  // Run all test cases in parallel
  console.log('Running analysis (parallel)...');
  const results = await Promise.all(TEST_CASES.map(evaluateTestCase));

  // Print results table
  printTable(results);

  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
