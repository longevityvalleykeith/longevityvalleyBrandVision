/**
 * Director Routing Verification Script
 *
 * Tests the preferredEngine routing logic for all Directors.
 * Run after every feature iteration to verify Grand Scheme compliance.
 *
 * PASS: All Directors route to their declared preferredEngine
 * FAIL: Routing logic does not match Director's soul
 *
 * @module scripts/test-director-routing
 * @version 1.0.0
 */

import {
  DIRECTOR_PERSONAS,
  DirectorProfile,
  getDirectorById,
  getAllDirectors,
  getRecommendedDirector,
  applyDirectorBiases,
  determineEngine,
  DEFAULT_DIRECTOR_ID,
} from '../src/config/directors';

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  expected?: string;
  actual?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => { passed: boolean; details: string; expected?: string; actual?: string }) {
  try {
    const result = fn();
    results.push({ name, ...result });
  } catch (error) {
    results.push({
      name,
      passed: false,
      details: `Exception: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

// =============================================================================
// TEST SUITE: SCHEMA COMPLIANCE
// =============================================================================

console.log('\n');
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║         DIRECTOR ROUTING VERIFICATION SCRIPT                     ║');
console.log('║         Feature: preferredEngine Field Implementation            ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('\n');

// Test 1: All Directors have preferredEngine field
test('Schema Compliance: All Directors have preferredEngine', () => {
  const missingEngine: string[] = [];
  for (const director of DIRECTOR_PERSONAS) {
    if (!director.preferredEngine) {
      missingEngine.push(director.id);
    }
  }
  return {
    passed: missingEngine.length === 0,
    details: missingEngine.length === 0
      ? 'All 4 Directors have preferredEngine defined'
      : `Missing preferredEngine: ${missingEngine.join(', ')}`,
  };
});

// Test 2: preferredEngine values are valid
test('Schema Compliance: preferredEngine values are valid', () => {
  const validEngines = ['kling', 'luma', 'gemini', 'runway', 'random'];
  const invalidEngines: Array<{ id: string; engine: string }> = [];

  for (const director of DIRECTOR_PERSONAS) {
    if (!validEngines.includes(director.preferredEngine)) {
      invalidEngines.push({ id: director.id, engine: director.preferredEngine });
    }
  }

  return {
    passed: invalidEngines.length === 0,
    details: invalidEngines.length === 0
      ? 'All preferredEngine values are valid'
      : `Invalid engines: ${JSON.stringify(invalidEngines)}`,
  };
});

// Test 3: Registry exports 4 Directors
test('Registry: Exports exactly 4 Directors', () => {
  const count = DIRECTOR_PERSONAS.length;
  return {
    passed: count === 4,
    details: `Found ${count} Directors`,
    expected: '4',
    actual: String(count),
  };
});

// =============================================================================
// TEST SUITE: ROUTING LOGIC
// =============================================================================

// Test 4: Newtonian routes to Kling
test('Routing: Newtonian -> Kling', () => {
  const newtonian = getDirectorById('newtonian');
  const engine = determineEngine(newtonian, { physics: 8, vibe: 5, logic: 6 });
  return {
    passed: engine === 'kling' && newtonian.preferredEngine === 'kling',
    details: `preferredEngine: ${newtonian.preferredEngine}, determineEngine: ${engine}`,
    expected: 'kling',
    actual: engine,
  };
});

// Test 5: Visionary routes to Luma
test('Routing: Visionary -> Luma', () => {
  const visionary = getDirectorById('visionary');
  const engine = determineEngine(visionary, { physics: 5, vibe: 9, logic: 4 });
  return {
    passed: engine === 'luma' && visionary.preferredEngine === 'luma',
    details: `preferredEngine: ${visionary.preferredEngine}, determineEngine: ${engine}`,
    expected: 'luma',
    actual: engine,
  };
});

// Test 6: Minimalist routes to Gemini (maps to Kling)
test('Routing: Minimalist -> Gemini (maps to Kling)', () => {
  const minimalist = getDirectorById('minimalist');
  const engine = determineEngine(minimalist, { physics: 4, vibe: 3, logic: 9 });
  return {
    passed: minimalist.preferredEngine === 'gemini' && engine === 'kling',
    details: `preferredEngine: ${minimalist.preferredEngine}, determineEngine: ${engine}`,
    expected: 'gemini -> kling',
    actual: `${minimalist.preferredEngine} -> ${engine}`,
  };
});

// Test 7: Provocateur routes based on scores (random)
test('Routing: Provocateur -> Random (score-based)', () => {
  const provocateur = getDirectorById('provocateur');

  // High physics should route to Kling
  const engineHighPhysics = determineEngine(provocateur, { physics: 9, vibe: 3, logic: 5 });
  // High vibe should route to Luma
  const engineHighVibe = determineEngine(provocateur, { physics: 3, vibe: 9, logic: 5 });

  const passed =
    provocateur.preferredEngine === 'random' &&
    engineHighPhysics === 'kling' &&
    engineHighVibe === 'luma';

  return {
    passed,
    details: `preferredEngine: ${provocateur.preferredEngine}, highPhysics: ${engineHighPhysics}, highVibe: ${engineHighVibe}`,
    expected: 'random: kling/luma based on scores',
    actual: `${provocateur.preferredEngine}: ${engineHighPhysics}/${engineHighVibe}`,
  };
});

// =============================================================================
// TEST SUITE: BIAS APPLICATION
// =============================================================================

// Test 8: Newtonian applies 1.5x physics multiplier
test('Bias: Newtonian applies 1.5x physics multiplier', () => {
  const newtonian = getDirectorById('newtonian');
  const biased = applyDirectorBiases(newtonian, 6, 6, 6);

  const passed = biased.physics === 9 && biased.vibe === 6 && biased.logic === 6;
  return {
    passed,
    details: `Input: 6/6/6, Output: ${biased.physics}/${biased.vibe}/${biased.logic}`,
    expected: '9/6/6',
    actual: `${biased.physics}/${biased.vibe}/${biased.logic}`,
  };
});

// Test 9: Visionary applies 1.5x vibe multiplier
test('Bias: Visionary applies 1.5x vibe multiplier', () => {
  const visionary = getDirectorById('visionary');
  const biased = applyDirectorBiases(visionary, 6, 6, 6);

  const passed = biased.physics === 6 && biased.vibe === 9 && biased.logic === 6;
  return {
    passed,
    details: `Input: 6/6/6, Output: ${biased.physics}/${biased.vibe}/${biased.logic}`,
    expected: '6/9/6',
    actual: `${biased.physics}/${biased.vibe}/${biased.logic}`,
  };
});

// Test 10: Minimalist applies 2.0x logic multiplier (clamped to 10)
test('Bias: Minimalist applies 2.0x logic multiplier (clamped)', () => {
  const minimalist = getDirectorById('minimalist');
  const biased = applyDirectorBiases(minimalist, 6, 6, 6);

  // 6 * 2.0 = 12, clamped to 10
  const passed = biased.physics === 6 && biased.vibe === 6 && biased.logic === 10;
  return {
    passed,
    details: `Input: 6/6/6, Output: ${biased.physics}/${biased.vibe}/${biased.logic}`,
    expected: '6/6/10 (clamped)',
    actual: `${biased.physics}/${biased.vibe}/${biased.logic}`,
  };
});

// =============================================================================
// TEST SUITE: HELPER FUNCTIONS
// =============================================================================

// Test 11: getDirectorById returns correct Director
test('Helper: getDirectorById returns correct Director', () => {
  const newtonian = getDirectorById('newtonian');
  const visionary = getDirectorById('visionary');
  const minimalist = getDirectorById('minimalist');
  const provocateur = getDirectorById('provocateur');

  const passed =
    newtonian.id === 'newtonian' &&
    visionary.id === 'visionary' &&
    minimalist.id === 'minimalist' &&
    provocateur.id === 'provocateur';

  return {
    passed,
    details: `All 4 Directors retrieved correctly`,
  };
});

// Test 12: getDirectorById returns default for unknown ID
test('Helper: getDirectorById returns default for unknown ID', () => {
  const unknown = getDirectorById('unknown-director');
  const passed = unknown.id === 'newtonian'; // Falls back to Newtonian

  return {
    passed,
    details: `Unknown ID returned: ${unknown.id}`,
    expected: 'newtonian (default)',
    actual: unknown.id,
  };
});

// Test 13: getRecommendedDirector returns highest scorer
test('Helper: getRecommendedDirector returns highest scorer', () => {
  const highPhysics = getRecommendedDirector(9, 5, 3);
  const highVibe = getRecommendedDirector(3, 9, 5);
  const highLogic = getRecommendedDirector(3, 5, 9);

  const passed =
    highPhysics.id === 'newtonian' &&
    highVibe.id === 'visionary' &&
    highLogic.id === 'minimalist';

  return {
    passed,
    details: `Physics: ${highPhysics.id}, Vibe: ${highVibe.id}, Logic: ${highLogic.id}`,
    expected: 'newtonian/visionary/minimalist',
    actual: `${highPhysics.id}/${highVibe.id}/${highLogic.id}`,
  };
});

// Test 14: DEFAULT_DIRECTOR_ID is newtonian
test('Config: DEFAULT_DIRECTOR_ID is newtonian', () => {
  return {
    passed: DEFAULT_DIRECTOR_ID === 'newtonian',
    details: `Default Director ID: ${DEFAULT_DIRECTOR_ID}`,
    expected: 'newtonian',
    actual: DEFAULT_DIRECTOR_ID,
  };
});

// =============================================================================
// TEST SUITE: RISK PROFILE COMPLIANCE
// =============================================================================

// Test 15: Risk profiles match Grand Scheme
test('Risk: Profiles match Grand Scheme specification', () => {
  const newtonian = getDirectorById('newtonian');
  const visionary = getDirectorById('visionary');
  const minimalist = getDirectorById('minimalist');
  const provocateur = getDirectorById('provocateur');

  const passed =
    newtonian.riskProfile.label === 'Safe' && newtonian.riskProfile.hallucinationThreshold === 0.2 &&
    visionary.riskProfile.label === 'Experimental' && visionary.riskProfile.hallucinationThreshold === 0.8 &&
    minimalist.riskProfile.label === 'Safe' && minimalist.riskProfile.hallucinationThreshold === 0.1 &&
    provocateur.riskProfile.label === 'Experimental' && provocateur.riskProfile.hallucinationThreshold === 0.95;

  return {
    passed,
    details: `Newtonian: ${newtonian.riskProfile.label}/${newtonian.riskProfile.hallucinationThreshold}, ` +
             `Visionary: ${visionary.riskProfile.label}/${visionary.riskProfile.hallucinationThreshold}, ` +
             `Minimalist: ${minimalist.riskProfile.label}/${minimalist.riskProfile.hallucinationThreshold}, ` +
             `Provocateur: ${provocateur.riskProfile.label}/${provocateur.riskProfile.hallucinationThreshold}`,
  };
});

// =============================================================================
// GENERATE REPORT
// =============================================================================

console.log('TEST RESULTS');
console.log('─'.repeat(68));

let passCount = 0;
let failCount = 0;

for (const result of results) {
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} ${result.name}`);
  if (!result.passed) {
    console.log(`   Details: ${result.details}`);
    if (result.expected) console.log(`   Expected: ${result.expected}`);
    if (result.actual) console.log(`   Actual: ${result.actual}`);
  }
  result.passed ? passCount++ : failCount++;
}

console.log('\n');
console.log('═'.repeat(68));
console.log('');

// =============================================================================
// CTO REPORT
// =============================================================================

const timestamp = new Date().toISOString();
const totalTests = results.length;
const passRate = ((passCount / totalTests) * 100).toFixed(1);

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║                    CTO VERIFICATION REPORT                       ║');
console.log('║                    Gemini Flash Review                           ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log(`║  Feature: Director Routing (preferredEngine)                     ║`);
console.log(`║  Timestamp: ${timestamp}              ║`);
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log(`║  Total Tests:  ${String(totalTests).padEnd(3)} │ Pass Rate: ${passRate}%                       ║`);
console.log(`║  Passed:       ${String(passCount).padEnd(3)} │ Failed: ${String(failCount).padEnd(3)}                           ║`);
console.log('╠══════════════════════════════════════════════════════════════════╣');

if (failCount === 0) {
  console.log('║  VERDICT: ✅ APPROVED FOR MERGE                                  ║');
  console.log('║                                                                  ║');
  console.log('║  Grand Scheme Compliance:                                        ║');
  console.log('║  - Schema: DirectorProfile interface complete                    ║');
  console.log('║  - Routing: preferredEngine declarative field working            ║');
  console.log('║  - Biases: All multipliers correctly applied                     ║');
  console.log('║  - Risk: Hallucination thresholds match spec                     ║');
} else {
  console.log('║  VERDICT: ❌ REJECTED - FIX REQUIRED                             ║');
  console.log('║                                                                  ║');
  console.log('║  Failed Tests:                                                   ║');
  for (const result of results.filter(r => !r.passed)) {
    console.log(`║  - ${result.name.substring(0, 58).padEnd(58)} ║`);
  }
  console.log('║                                                                  ║');
  console.log('║  ACTION: The test failed. Fix the code.                          ║');
}

console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('');

// Exit with appropriate code
process.exit(failCount === 0 ? 0 : 1);
