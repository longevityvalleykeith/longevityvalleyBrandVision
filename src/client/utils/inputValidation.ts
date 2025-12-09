/**
 * Phase 3A - Input Validation Utilities (SOFT Guardrails)
 *
 * Client-side input quality assessment for frictionless onboarding.
 * Implements Layer 2 of the INPUT_GATEKEEPING_SPEC:
 * - Gibberish detection (entropy analysis)
 * - Language consistency checking
 * - Quality scoring
 *
 * @module client/utils/inputValidation
 * @version 1.0.0
 * @see docs/INPUT_GATEKEEPING_SPEC.md
 */

import type {
  InputQualityAssessment,
  InputQualityGrade,
  InputIssue,
  CulturalContextInput,
  SupportedLanguage,
  CulturalRegion,
} from '@/types/cultural';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Minimum length requirements by region
 * Chinese characters are denser, so fewer characters are needed
 */
const MIN_LENGTHS: Record<CulturalRegion, { targetAudience: number; productInfo: number }> = {
  china: { targetAudience: 8, productInfo: 10 },
  taiwan: { targetAudience: 8, productInfo: 10 },
  western: { targetAudience: 20, productInfo: 25 },
  malaysia: { targetAudience: 15, productInfo: 20 },
};

/**
 * Common English words for gibberish detection
 */
const COMMON_ENGLISH_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'can', 'and', 'or', 'but', 'if', 'then', 'else',
  'when', 'where', 'why', 'how', 'what', 'who', 'which', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
  'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'for', 'to', 'from',
  'with', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'again', 'further', 'once', 'here', 'there', 'all', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'new',
  'people', 'product', 'customer', 'health', 'wellness', 'quality', 'premium',
  'professional', 'business', 'service', 'brand', 'market', 'target', 'audience',
  'young', 'old', 'age', 'years', 'lifestyle', 'organic', 'natural', 'modern',
]);

/**
 * Keyboard mash patterns (gibberish indicators)
 */
const KEYBOARD_PATTERNS = [
  /[qwerty]{4,}/i,
  /[asdfgh]{4,}/i,
  /[zxcvbn]{4,}/i,
  /[12345]{4,}/,
  /[67890]{4,}/,
  /(.)\1{3,}/, // Repeated character: "aaaa"
  /^[a-z]{1,3}$/i, // Too short alphabetic
  /^[\d]{1,5}$/, // Just numbers
];

// =============================================================================
// LOCALIZED MESSAGES
// =============================================================================

const VALIDATION_MESSAGES: Record<SupportedLanguage, Record<string, string>> = {
  'en': {
    too_short: 'Content is too brief, please add more details',
    gibberish: 'Input not recognized, please enter valid information',
    wrong_language: 'Language mismatch detected',
    repetitive: 'Repetitive content detected, please provide specific details',
    spam: 'Invalid input detected',
    suggestion_targetAudience: 'e.g., Health-conscious professionals aged 35-55',
    suggestion_productInfo: 'e.g., Premium wellness product with German engineering',
  },
  'zh-CN': {
    too_short: '内容太简短，请添加更多细节',
    gibberish: '输入内容无法识别，请输入有效信息',
    wrong_language: '检测到语言不匹配',
    repetitive: '检测到重复内容，请输入具体描述',
    spam: '检测到无效输入',
    suggestion_targetAudience: '例如：35-55岁注重健康的企业高管',
    suggestion_productInfo: '例如：高端脊椎理疗床，源自德国工艺',
  },
  'zh-TW': {
    too_short: '內容太簡短，請添加更多細節',
    gibberish: '輸入內容無法識別，請輸入有效資訊',
    wrong_language: '偵測到語言不符',
    repetitive: '偵測到重複內容，請輸入具體描述',
    spam: '偵測到無效輸入',
    suggestion_targetAudience: '例如：35-55歲注重健康的企業高管',
    suggestion_productInfo: '例如：高端脊椎理療床，源自德國工藝',
  },
  'ms': {
    too_short: 'Kandungan terlalu ringkas, sila tambah lebih banyak butiran',
    gibberish: 'Input tidak dikenali, sila masukkan maklumat yang sah',
    wrong_language: 'Ketidakpadanan bahasa dikesan',
    repetitive: 'Kandungan berulang dikesan, sila berikan butiran khusus',
    spam: 'Input tidak sah dikesan',
    suggestion_targetAudience: 'cth: Profesional berumur 35-55 yang mementingkan kesihatan',
    suggestion_productInfo: 'cth: Produk kesihatan premium dengan kejuruteraan Jerman',
  },
};

// =============================================================================
// CORE ALGORITHMS
// =============================================================================

/**
 * Calculate Shannon entropy of a string
 * High entropy (>4.5) often indicates random/gibberish text
 */
export function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0;

  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;
  for (const char in freq) {
    const p = freq[char]! / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Detect if input is likely gibberish
 */
export function isGibberish(input: string): boolean {
  if (!input || input.trim().length === 0) return false;

  const trimmed = input.trim();

  // Heuristic 1: High entropy (random characters)
  const entropy = calculateEntropy(trimmed);
  if (entropy > 4.5 && trimmed.length > 5) {
    return true;
  }

  // Heuristic 2: Keyboard mash patterns
  for (const pattern of KEYBOARD_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  // Heuristic 3: No real English words (for alphabetic input)
  const isAlphabetic = /^[a-zA-Z\s]+$/.test(trimmed);
  if (isAlphabetic && trimmed.length > 10) {
    const words = trimmed.toLowerCase().split(/\s+/);
    const realWordCount = words.filter(w => COMMON_ENGLISH_WORDS.has(w)).length;
    if (realWordCount === 0 && words.length > 2) {
      return true;
    }
  }

  // Heuristic 4: Check for valid Chinese character sequences
  const hasChinese = /[\u4e00-\u9fff]/.test(trimmed);
  if (hasChinese) {
    // Count ratio of valid CJK characters
    const cjkChars = trimmed.match(/[\u4e00-\u9fff]/g) || [];
    const totalChars = trimmed.replace(/\s/g, '').length;
    // If has Chinese but very low ratio, might be gibberish mixed
    if (cjkChars.length > 0 && cjkChars.length / totalChars < 0.3) {
      // Mixed gibberish
      const nonCjk = trimmed.replace(/[\u4e00-\u9fff\s]/g, '');
      if (isGibberish(nonCjk)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detect if input contains repetitive content
 */
export function isRepetitive(input: string): boolean {
  if (!input || input.length < 10) return false;

  // Check for repeated words
  const words = input.toLowerCase().split(/\s+/);
  if (words.length >= 3) {
    const uniqueWords = new Set(words);
    // If more than 70% are duplicates
    if (uniqueWords.size / words.length < 0.3) {
      return true;
    }
  }

  // Check for repeated substrings
  const halfLen = Math.floor(input.length / 2);
  for (let len = 3; len <= halfLen; len++) {
    const substr = input.substring(0, len);
    const regex = new RegExp(substr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = input.match(regex);
    if (matches && matches.length >= 3 && len * matches.length > input.length * 0.6) {
      return true;
    }
  }

  return false;
}

/**
 * Detect the primary language of input text
 */
export function detectLanguage(input: string): SupportedLanguage {
  if (!input) return 'en';

  const trimmed = input.trim();

  // Check for Chinese (Simplified vs Traditional is harder, default to Simplified)
  const chineseChars = trimmed.match(/[\u4e00-\u9fff]/g) || [];
  if (chineseChars.length > trimmed.length * 0.3) {
    // Could distinguish zh-CN vs zh-TW with more sophisticated analysis
    return 'zh-CN';
  }

  // Check for Malay indicators (common words)
  const malayWords = ['yang', 'dan', 'untuk', 'dengan', 'adalah', 'ini', 'itu', 'saya', 'anda'];
  const lowerInput = trimmed.toLowerCase();
  const malayMatches = malayWords.filter(w => lowerInput.includes(w));
  if (malayMatches.length >= 2) {
    return 'ms';
  }

  // Default to English
  return 'en';
}

// =============================================================================
// MAIN ASSESSMENT FUNCTION
// =============================================================================

/**
 * Assess input quality for brand context
 *
 * @param brandContext - The brand context fields to validate
 * @param culturalContext - Cultural context for localized messages
 * @returns Quality assessment with grade, score, and issues
 */
export function assessInputQuality(
  brandContext: {
    productInfo?: string;
    sellingPoints?: string;
    targetAudience?: string;
    painPoints?: string;
    scenarios?: string;
    ctaOffer?: string;
  },
  culturalContext?: CulturalContextInput
): InputQualityAssessment {
  const issues: InputIssue[] = [];
  let score = 100;

  const lang = culturalContext?.language || 'en';
  const region = culturalContext?.region || 'western';
  const minLengths = MIN_LENGTHS[region];
  const messages = VALIDATION_MESSAGES[lang];

  // ─────────────────────────────────────────────────────────────
  // CHECK REQUIRED FIELDS
  // ─────────────────────────────────────────────────────────────

  // Product Info (required)
  if (!brandContext.productInfo || brandContext.productInfo.trim().length === 0) {
    score -= 30;
    issues.push({
      field: 'productInfo',
      type: 'too_short',
      severity: 'error',
      message: messages['too_short'] || 'Content is too brief',
      suggestion: messages['suggestion_productInfo'],
    });
  } else if (brandContext.productInfo.trim().length < minLengths.productInfo) {
    score -= 15;
    issues.push({
      field: 'productInfo',
      type: 'too_short',
      severity: 'warning',
      message: messages['too_short'] || 'Content is too brief',
      suggestion: messages['suggestion_productInfo'],
    });
  } else if (isGibberish(brandContext.productInfo)) {
    score -= 40;
    issues.push({
      field: 'productInfo',
      type: 'gibberish',
      severity: 'error',
      message: messages['gibberish'] || 'Input not recognized',
    });
  } else if (isRepetitive(brandContext.productInfo)) {
    score -= 20;
    issues.push({
      field: 'productInfo',
      type: 'repetitive',
      severity: 'warning',
      message: messages['repetitive'] || 'Repetitive content detected',
    });
  }

  // Selling Points (required)
  if (!brandContext.sellingPoints || brandContext.sellingPoints.trim().length === 0) {
    score -= 25;
    issues.push({
      field: 'sellingPoints',
      type: 'too_short',
      severity: 'error',
      message: messages['too_short'] || 'Content is too brief',
    });
  } else if (isGibberish(brandContext.sellingPoints)) {
    score -= 35;
    issues.push({
      field: 'sellingPoints',
      type: 'gibberish',
      severity: 'error',
      message: messages['gibberish'] || 'Input not recognized',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // CHECK OPTIONAL FIELDS (bonus points for quality)
  // ─────────────────────────────────────────────────────────────

  // Target Audience (optional but valuable)
  if (brandContext.targetAudience && brandContext.targetAudience.trim().length > 0) {
    if (brandContext.targetAudience.trim().length < minLengths.targetAudience) {
      score -= 10;
      issues.push({
        field: 'targetAudience',
        type: 'too_short',
        severity: 'warning',
        message: messages['too_short'] || 'Content is too brief',
        suggestion: messages['suggestion_targetAudience'],
      });
    } else if (isGibberish(brandContext.targetAudience)) {
      score -= 25;
      issues.push({
        field: 'targetAudience',
        type: 'gibberish',
        severity: 'error',
        message: messages['gibberish'] || 'Input not recognized',
      });
    } else {
      // Bonus for good target audience
      score += 5;
    }

    // Language consistency check
    if (culturalContext) {
      const detectedLang = detectLanguage(brandContext.targetAudience);
      if (detectedLang !== culturalContext.language && culturalContext.language !== 'en') {
        score -= 10;
        issues.push({
          field: 'targetAudience',
          type: 'wrong_language',
          severity: 'warning',
          message: messages['wrong_language'] || 'Language mismatch detected',
        });
      }
    }
  }

  // Pain Points (optional)
  if (brandContext.painPoints && brandContext.painPoints.trim().length > 5) {
    if (!isGibberish(brandContext.painPoints)) {
      score += 3;
    }
  }

  // Scenarios (optional)
  if (brandContext.scenarios && brandContext.scenarios.trim().length > 5) {
    if (!isGibberish(brandContext.scenarios)) {
      score += 3;
    }
  }

  // CTA Offer (optional)
  if (brandContext.ctaOffer && brandContext.ctaOffer.trim().length > 3) {
    if (!isGibberish(brandContext.ctaOffer)) {
      score += 2;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // COMPUTE FINAL ASSESSMENT
  // ─────────────────────────────────────────────────────────────

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  const grade = scoreToGrade(score);
  const canProceed = score >= 30;
  const action = determineAction(grade);
  const toneConfidence = score / 100;

  return {
    grade,
    score,
    issues,
    canProceed,
    action,
    toneConfidence,
  };
}

/**
 * Convert numeric score to grade
 */
function scoreToGrade(score: number): InputQualityGrade {
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 45) return 'basic';
  if (score >= 25) return 'insufficient';
  return 'invalid';
}

/**
 * Determine recommended action based on grade
 */
function determineAction(grade: InputQualityGrade): InputQualityAssessment['action'] {
  switch (grade) {
    case 'excellent':
    case 'good':
      return 'proceed';
    case 'basic':
      return 'warn_and_proceed';
    case 'insufficient':
      return 'request_improvement';
    case 'invalid':
      return 'block';
  }
}

// =============================================================================
// QUICK VALIDATION HELPERS
// =============================================================================

/**
 * Quick check if input meets minimum requirements
 */
export function hasMinimumInput(brandContext: {
  productInfo?: string;
  sellingPoints?: string;
}): boolean {
  const hasProduct = !!brandContext.productInfo?.trim();
  const hasSelling = !!brandContext.sellingPoints?.trim();
  return hasProduct && hasSelling;
}

/**
 * Get quality grade color for UI
 */
export function getGradeColor(grade: InputQualityGrade): {
  bar: string;
  text: string;
  bg: string;
} {
  const colors: Record<InputQualityGrade, { bar: string; text: string; bg: string }> = {
    excellent: { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
    good: { bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
    basic: { bar: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' },
    insufficient: { bar: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
    invalid: { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  };
  return colors[grade];
}

/**
 * Get quality grade width for progress bar
 */
export function getGradeWidth(grade: InputQualityGrade): string {
  const widths: Record<InputQualityGrade, string> = {
    excellent: 'w-full',
    good: 'w-4/5',
    basic: 'w-3/5',
    insufficient: 'w-2/5',
    invalid: 'w-1/5',
  };
  return widths[grade];
}
