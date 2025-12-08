# Testing Guide: Real Data Validation & Error Handling

## Overview
This guide provides comprehensive test cases for validating the Rashomon Effect data flow from backend to frontend, including error handling and data transformation.

---

## Complete Logic Path Summary

```
Entry Point → sessionStorage Check → JSON Parse
   │
   ├─ Parse Success → Extract Data → Check allDirectorPitches
   │                                    │
   │                                    ├─ PATH A: Real Data Exists
   │                                    │    │
   │                                    │    ├─ Transform & Validate
   │                                    │    │    ├─ Validation Pass → Display Carousel
   │                                    │    │    └─ Validation Fail → Fallback to PATH B
   │                                    │
   │                                    └─ PATH B: No Real Data
   │                                         │
   │                                         ├─ onAnalyze exists? → Call Backend
   │                                         └─ No onAnalyze → Mock Data
   │
   └─ Parse Fail → Error Handler → Stay in IDLE state
```

---

## Test Suite 1: Happy Path - Valid Real Data

### Test 1.1: Complete Rashomon Data (All 4 Directors)

**Setup:**
```javascript
const validRashomonData = {
  imageUrl: 'https://example.com/brand-image.png',
  brandContext: {
    productInfo: 'Spine therapy bed',
    sellingPoints: 'Place it anywhere, monetise anytime',
    targetAudience: 'elderly, seniors',
  },
  analysisData: {
    allDirectorPitches: [
      {
        directorId: 'newtonian',
        directorName: 'The Newtonian',
        avatar: '🔬',
        threeBeatPulse: {
          vision: 'Stable therapeutic mass',
          safety: 'Preserve engineered stability',
          magic: 'Calibrated force application',
        },
        commentary: 'Physics-based therapeutic approach...',
        biasedScores: { physics: 9.5, vibe: 6.0, logic: 7.5 },
        recommendedEngine: 'kling',
        recommendedStyleId: 'tech-modern',
        riskLevel: 'Safe',
      },
      {
        directorId: 'visionary',
        directorName: 'The Visionary',
        avatar: '🎨',
        threeBeatPulse: {
          vision: 'Ethereal healing experience',
          safety: 'Protect emotional resonance',
          magic: 'Morphing light creates transcendence',
        },
        commentary: 'Artistic interpretation of wellness...',
        biasedScores: { physics: 5.5, vibe: 9.8, logic: 6.5 },
        recommendedEngine: 'luma',
        recommendedStyleId: 'artistic-dream',
        riskLevel: 'Experimental',
      },
      {
        directorId: 'minimalist',
        directorName: 'The Minimalist',
        avatar: '⬜',
        threeBeatPulse: {
          vision: 'Clean therapeutic precision',
          safety: 'Typography must remain crisp',
          magic: 'Subtle motion amplifies clarity',
        },
        commentary: 'Minimalist design philosophy...',
        biasedScores: { physics: 6.0, vibe: 6.0, logic: 10.0 },
        recommendedEngine: 'kling',
        recommendedStyleId: 'minimal-clean',
        riskLevel: 'Safe',
      },
      {
        directorId: 'provocateur',
        directorName: 'The Provocateur',
        avatar: '🔥',
        threeBeatPulse: {
          vision: 'Chaos meets wellness',
          safety: 'Embrace the unexpected',
          magic: 'Radical motion shatters expectations',
        },
        commentary: 'Disruptive approach to health tech...',
        biasedScores: { physics: 8.0, vibe: 8.5, logic: 6.0 },
        recommendedEngine: 'luma',
        recommendedStyleId: 'experimental-glitch',
        riskLevel: 'Experimental',
      },
    ],
    recommendedDirectorId: 'visionary',
  },
};

sessionStorage.setItem('studioTransition', JSON.stringify(validRashomonData));
```

**Expected Console Output:**
```
[TheLounge] 🎬 Using Rashomon Effect - All director pitches from analysis
[TheLounge] 📊 Received 4 director pitches
[TheLounge] ⭐ Recommended Director: visionary
[TheLounge] ✅ Successfully transformed 4 director pitches
[TheLounge] 🎯 Starting carousel at recommended director (index 1)
```

**Expected UI Behavior:**
- ✅ Carousel displays 4 directors
- ✅ Starts at "The Visionary" (index 1)
- ✅ Golden "⭐ Recommended" badge visible on The Visionary's card
- ✅ All director stats, pitches, and commentary render correctly
- ✅ Navigation buttons work (Previous/Next)
- ✅ Dot indicators show 4 dots, 2nd one active

**Test Steps:**
```bash
# 1. Clear sessionStorage
sessionStorage.clear();

# 2. Set valid data
sessionStorage.setItem('studioTransition', JSON.stringify(validRashomonData));

# 3. Navigate to /lounge
window.location.href = '/lounge';

# 4. Open browser console
# 5. Verify console logs match expected output
# 6. Verify UI matches expected behavior
```

---

## Test Suite 2: Error Handling - Malformed Data

### Test 2.1: Missing Critical Fields (directorId)

**Setup:**
```javascript
const missingDirectorId = {
  imageUrl: 'https://example.com/image.png',
  brandContext: { productInfo: 'Test' },
  analysisData: {
    allDirectorPitches: [
      {
        // ❌ Missing directorId
        directorName: 'The Newtonian',
        avatar: '🔬',
        biasedScores: { physics: 9, vibe: 6, logic: 7 },
      },
      {
        directorId: 'visionary', // ✅ Valid
        directorName: 'The Visionary',
        avatar: '🎨',
        biasedScores: { physics: 5, vibe: 9, logic: 6 },
      },
    ],
    recommendedDirectorId: 'visionary',
  },
};

sessionStorage.setItem('studioTransition', JSON.stringify(missingDirectorId));
```

**Expected Console Output:**
```
[TheLounge] 🎬 Using Rashomon Effect - All director pitches from analysis
[TheLounge] 📊 Received 2 director pitches
[TheLounge] ⚠️ Pitch 0 missing directorId, skipping
[TheLounge] ✅ Successfully transformed 1 director pitches
[TheLounge] 🎯 Starting carousel at recommended director (index 0)
```

**Expected Behavior:**
- ✅ Skips invalid pitch (missing directorId)
- ✅ Successfully transforms valid pitch
- ✅ Displays 1 director in carousel
- ✅ No errors thrown

---

### Test 2.2: Missing biasedScores

**Setup:**
```javascript
const missingScores = {
  imageUrl: 'https://example.com/image.png',
  brandContext: { productInfo: 'Test' },
  analysisData: {
    allDirectorPitches: [
      {
        directorId: 'newtonian',
        directorName: 'The Newtonian',
        avatar: '🔬',
        // ❌ Missing biasedScores
      },
    ],
    recommendedDirectorId: 'newtonian',
  },
};

sessionStorage.setItem('studioTransition', JSON.stringify(missingScores));
```

**Expected Console Output:**
```
[TheLounge] 🎬 Using Rashomon Effect - All director pitches from analysis
[TheLounge] 📊 Received 1 director pitches
[TheLounge] ⚠️ Pitch 0 (newtonian) missing biasedScores
[TheLounge] ❌ No valid director pitches after transformation, using fallback
[TheLounge] 🔄 Falling back to PATH B (onAnalyze or mock data)
```

**Expected Behavior:**
- ✅ Warning logged for missing scores
- ✅ Pitch filtered out (returns null)
- ✅ Falls back to PATH B
- ✅ Mock data displayed (4 directors)

---

### Test 2.3: All Pitches Invalid

**Setup:**
```javascript
const allInvalid = {
  imageUrl: 'https://example.com/image.png',
  brandContext: { productInfo: 'Test' },
  analysisData: {
    allDirectorPitches: [
      { /* missing directorId */ },
      { directorId: 'test' /* missing biasedScores */ },
      null, // Invalid entry
      undefined, // Invalid entry
    ],
    recommendedDirectorId: 'unknown',
  },
};

sessionStorage.setItem('studioTransition', JSON.stringify(allInvalid));
```

**Expected Console Output:**
```
[TheLounge] 🎬 Using Rashomon Effect - All director pitches from analysis
[TheLounge] 📊 Received 4 director pitches
[TheLounge] ⚠️ Pitch 0 missing directorId, skipping
[TheLounge] ⚠️ Pitch 1 (test) missing biasedScores
[TheLounge] ⚠️ Pitch 2 missing directorId, skipping
[TheLounge] ⚠️ Pitch 3 missing directorId, skipping
[TheLounge] ❌ No valid director pitches after transformation, using fallback
[TheLounge] 🔄 Falling back to PATH B (onAnalyze or mock data)
```

**Expected Behavior:**
- ✅ All pitches filtered out
- ✅ Graceful fallback to mock data
- ✅ No JavaScript errors
- ✅ UI displays 4 mock directors

---

### Test 2.4: Empty allDirectorPitches Array

**Setup:**
```javascript
const emptyPitches = {
  imageUrl: 'https://example.com/image.png',
  brandContext: { productInfo: 'Test' },
  analysisData: {
    allDirectorPitches: [], // ❌ Empty
    recommendedDirectorId: 'newtonian',
  },
};

sessionStorage.setItem('studioTransition', JSON.stringify(emptyPitches));
```

**Expected Console Output:**
```
(No Rashomon Effect logs - condition not met)
(Falls through to PATH B)
```

**Expected Behavior:**
- ✅ Skips PATH A (length check fails)
- ✅ Enters PATH B
- ✅ Mock data displayed

---

### Test 2.5: analysisData is null

**Setup:**
```javascript
const nullAnalysisData = {
  imageUrl: 'https://example.com/image.png',
  brandContext: { productInfo: 'Test' },
  analysisData: null, // ❌ Null
};

sessionStorage.setItem('studioTransition', JSON.stringify(nullAnalysisData));
```

**Expected Behavior:**
- ✅ Optional chaining prevents error (`?.allDirectorPitches`)
- ✅ Falls through to PATH B
- ✅ Mock data displayed

---

### Test 2.6: Corrupt JSON

**Setup:**
```javascript
sessionStorage.setItem('studioTransition', '{invalid json syntax}');
```

**Expected Console Output:**
```
Failed to parse studio transition data: SyntaxError: Unexpected token...
```

**Expected Behavior:**
- ✅ Catch block handles error
- ✅ `setHasStudioData(false)`
- ✅ Component stays in IDLE state
- ✅ User can manually upload image

---

### Test 2.7: Missing Fallback Fields (Safe Defaults)

**Setup:**
```javascript
const minimalFields = {
  imageUrl: 'https://example.com/image.png',
  brandContext: { productInfo: 'Test' },
  analysisData: {
    allDirectorPitches: [
      {
        directorId: 'newtonian',
        // ❌ Missing: directorName, avatar, threeBeatPulse, commentary
        biasedScores: { physics: 9, vibe: 6, logic: 7 },
        // ❌ Missing: recommendedEngine, riskLevel, recommendedStyleId
      },
    ],
    recommendedDirectorId: 'newtonian',
  },
};

sessionStorage.setItem('studioTransition', JSON.stringify(minimalFields));
```

**Expected Transformation:**
```javascript
{
  id: 'newtonian',
  name: 'newtonian',  // ✅ Fallback to directorId
  avatar: '🎬',       // ✅ Default emoji
  archetype: 'newtonian',  // ✅ Fallback
  quote: 'No vision statement',  // ✅ Default
  stats: { physics: 9, vibe: 6, logic: 7 },  // ✅ Preserved
  engine: 'kling',    // ✅ Default
  riskLevel: 'Balanced',  // ✅ Default
  pitch: 'No commentary available',  // ✅ Default
  commentary: {       // ✅ Default object
    vision: 'N/A',
    safety: 'N/A',
    magic: 'N/A',
  },
  isRecommended: true,
}
```

**Expected Behavior:**
- ✅ Warning logged for missing name/avatar
- ✅ Fallback values applied
- ✅ Director displays with defaults
- ✅ No JavaScript errors

---

## Test Suite 3: Recommended Director Logic

### Test 3.1: Recommended Director Exists (Index 0)

**Setup:**
```javascript
const recommendedFirst = {
  // ... valid data ...
  analysisData: {
    allDirectorPitches: [
      { directorId: 'newtonian', /* ... */ },  // ← Recommended
      { directorId: 'visionary', /* ... */ },
    ],
    recommendedDirectorId: 'newtonian',
  },
};
```

**Expected:**
- ✅ Carousel starts at index 0
- ✅ Log: "Starting carousel at recommended director (index 0)"

---

### Test 3.2: Recommended Director Exists (Index 2)

**Setup:**
```javascript
const recommendedMiddle = {
  // ... valid data ...
  analysisData: {
    allDirectorPitches: [
      { directorId: 'newtonian', /* ... */ },
      { directorId: 'visionary', /* ... */ },
      { directorId: 'minimalist', /* ... */ },  // ← Recommended
      { directorId: 'provocateur', /* ... */ },
    ],
    recommendedDirectorId: 'minimalist',
  },
};
```

**Expected:**
- ✅ Carousel starts at index 2
- ✅ "The Minimalist" displayed first

---

### Test 3.3: Recommended Director Not Found

**Setup:**
```javascript
const recommendedNotFound = {
  // ... valid data ...
  analysisData: {
    allDirectorPitches: [
      { directorId: 'newtonian', /* ... */ },
      { directorId: 'visionary', /* ... */ },
    ],
    recommendedDirectorId: 'unknown-director',  // ❌ Doesn't exist
  },
};
```

**Expected Console Output:**
```
[TheLounge] ℹ️ No recommended director found, starting at index 0
```

**Expected:**
- ✅ Carousel starts at index 0
- ✅ No recommended badge displayed

---

### Test 3.4: No recommendedDirectorId Provided

**Setup:**
```javascript
const noRecommendation = {
  // ... valid data ...
  analysisData: {
    allDirectorPitches: [
      { directorId: 'newtonian', /* ... */ },
      { directorId: 'visionary', /* ... */ },
    ],
    // ❌ recommendedDirectorId missing
  },
};
```

**Expected:**
- ✅ All directors have `isRecommended: false`
- ✅ Carousel starts at index 0
- ✅ No recommended badge

---

## Test Suite 4: Integration Testing

### Test 4.1: Full End-to-End Flow

**Steps:**
```bash
# 1. Navigate to /studio
# 2. Upload brand image with context
# 3. Wait for backend analysis (~30s)
# 4. Click "Meet Your AI Directors"
# 5. Verify /lounge displays Rashomon Effect data
# 6. Check browser console for logs
# 7. Test carousel navigation
# 8. Verify recommended badge
```

**Expected Logs:**
```
[Vision Service] RASHOMON EFFECT ACTIVATED
[Vision Service] Generated 4 director perspectives
[Vision Service] Recommended Director: visionary
[TheLounge] 🎬 Using Rashomon Effect - All director pitches from analysis
[TheLounge] 📊 Received 4 director pitches
[TheLounge] ✅ Successfully transformed 4 director pitches
[TheLounge] 🎯 Starting carousel at recommended director (index 1)
```

---

### Test 4.2: Backend Returns Partial Data

**Scenario**: Backend only generates 2 directors due to timeout

**Expected:**
- ✅ Frontend displays 2 directors
- ✅ No errors
- ✅ Carousel navigation works

---

### Test 4.3: Network Error During Backend Call

**Setup:**
```javascript
// Mock onAnalyze to throw error
const onAnalyze = async () => {
  throw new Error('Network request failed');
};
```

**Expected:**
- ✅ Error caught (if wrapped in try/catch)
- ✅ Or fallback to mock data

---

## Test Execution Checklist

### Manual Testing
- [ ] Test 1.1: Valid Rashomon data (all 4 directors)
- [ ] Test 2.1: Missing directorId
- [ ] Test 2.2: Missing biasedScores
- [ ] Test 2.3: All pitches invalid
- [ ] Test 2.4: Empty array
- [ ] Test 2.5: Null analysisData
- [ ] Test 2.6: Corrupt JSON
- [ ] Test 2.7: Minimal fields (fallbacks)
- [ ] Test 3.1: Recommended at index 0
- [ ] Test 3.2: Recommended at index 2
- [ ] Test 3.3: Recommended not found
- [ ] Test 3.4: No recommendation
- [ ] Test 4.1: Full E2E flow
- [ ] Test 4.2: Partial data
- [ ] Test 4.3: Network error

### Automated Testing (Future)
```typescript
// Example Jest test
describe('TheLounge - Rashomon Effect', () => {
  it('should transform valid director pitches', () => {
    // Test implementation
  });

  it('should handle missing directorId gracefully', () => {
    // Test implementation
  });
});
```

---

## Debugging Tips

### View sessionStorage Data
```javascript
// In browser console
const data = sessionStorage.getItem('studioTransition');
console.log(JSON.parse(data));
```

### Inspect Transformed Data
```javascript
// Add breakpoint at line 130 in TheLounge.tsx
// Inspect directorPitches variable
```

### Force PATH B (Mock Data)
```javascript
// Temporarily comment out PATH A condition
// if (false && data.analysisData?.allDirectorPitches...) {
```

### Enable Verbose Logging
```javascript
// Add at top of useEffect
console.log('[TheLounge] 🔍 Full sessionStorage data:', data);
```

---

## Success Criteria

✅ **All test cases pass without errors**
✅ **Console logs match expected output**
✅ **UI displays correctly for all scenarios**
✅ **Fallbacks work as intended**
✅ **No JavaScript errors in console**
✅ **User experience remains smooth even with bad data**

---

## Next Steps

After completing manual testing:
1. Document any edge cases discovered
2. Add automated tests for critical paths
3. Monitor production logs for real-world errors
4. Track conversion rate (recommended director selection)
