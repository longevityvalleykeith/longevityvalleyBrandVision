/**
 * Phase 3A - Guided Input Chips Configuration (Simplified)
 *
 * Universal chip categories that expand on toggle.
 * Reduced friction, less clutter.
 *
 * @module config/cultural/guidedChips
 * @version 2.0.0 - Simplified universal categories
 */

import type { CulturalRegion } from '@/types/cultural';

// =============================================================================
// TYPES
// =============================================================================

export type ChipField = 'targetAudience' | 'painPoints' | 'scenarios' | 'ctaOffer';

export interface UniversalChips {
  /** Chips shown by default (collapsed) */
  primary: string[];
  /** Additional chips shown when expanded */
  expanded: string[];
}

// =============================================================================
// UNIVERSAL CHIPS - Same structure, localized content
// =============================================================================

export const UNIVERSAL_CHIPS: Record<CulturalRegion, Record<ChipField, UniversalChips>> = {
  // ─────────────────────────────────────────────────────────────
  // CHINA (Simplified Chinese)
  // ─────────────────────────────────────────────────────────────
  china: {
    targetAudience: {
      primary: ['25-45岁', '健康意识强', '中高收入'],
      expanded: ['家庭决策者', '职场人士', '银发族', '年轻父母'],
    },
    painPoints: {
      primary: ['时间不足', '压力大', '健康焦虑'],
      expanded: ['睡眠问题', '缺乏运动', '信息过载', '选择困难'],
    },
    scenarios: {
      primary: ['居家使用', '办公场景', '礼品赠送'],
      expanded: ['旅行携带', '养生会所', '节日送礼'],
    },
    ctaOffer: {
      primary: ['限时优惠', '免费体验', '无忧退换'],
      expanded: ['分期付款', '会员专享', '买赠活动'],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // TAIWAN (Traditional Chinese)
  // ─────────────────────────────────────────────────────────────
  taiwan: {
    targetAudience: {
      primary: ['25-45歲', '健康意識強', '中高收入'],
      expanded: ['家庭決策者', '職場人士', '銀髮族', '年輕父母'],
    },
    painPoints: {
      primary: ['時間不足', '壓力大', '健康焦慮'],
      expanded: ['睡眠問題', '缺乏運動', '資訊過載', '選擇困難'],
    },
    scenarios: {
      primary: ['居家使用', '辦公場景', '禮品贈送'],
      expanded: ['旅行攜帶', '養生會所', '節日送禮'],
    },
    ctaOffer: {
      primary: ['限時優惠', '免費體驗', '無憂退換'],
      expanded: ['分期付款', '會員專享', '買贈活動'],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // WESTERN (English)
  // ─────────────────────────────────────────────────────────────
  western: {
    targetAudience: {
      primary: ['25-45 years', 'Health-conscious', 'Mid-high income'],
      expanded: ['Decision makers', 'Professionals', 'Seniors', 'Young parents'],
    },
    painPoints: {
      primary: ['Time-poor', 'Stressed', 'Health concerns'],
      expanded: ['Sleep issues', 'Sedentary', 'Info overload', 'Choice fatigue'],
    },
    scenarios: {
      primary: ['Home use', 'Office', 'Gift giving'],
      expanded: ['Travel', 'Wellness center', 'Holiday gifts'],
    },
    ctaOffer: {
      primary: ['Limited time', 'Free trial', 'Easy returns'],
      expanded: ['Financing', 'VIP exclusive', 'Bundle deal'],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // MALAYSIA (Bahasa Malaysia)
  // ─────────────────────────────────────────────────────────────
  malaysia: {
    targetAudience: {
      primary: ['25-45 tahun', 'Peka kesihatan', 'Pendapatan sederhana-tinggi'],
      expanded: ['Pembuat keputusan', 'Profesional', 'Warga emas', 'Ibu bapa muda'],
    },
    painPoints: {
      primary: ['Kekurangan masa', 'Tekanan', 'Kebimbangan kesihatan'],
      expanded: ['Masalah tidur', 'Kurang aktif', 'Maklumat berlebihan', 'Sukar memilih'],
    },
    scenarios: {
      primary: ['Kegunaan rumah', 'Pejabat', 'Hadiah'],
      expanded: ['Perjalanan', 'Pusat kesihatan', 'Hadiah perayaan'],
    },
    ctaOffer: {
      primary: ['Masa terhad', 'Percubaan percuma', 'Pulangan mudah'],
      expanded: ['Pembiayaan', 'Eksklusif VIP', 'Tawaran pakej'],
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get chips for a specific field and region
 */
export function getFieldChips(field: ChipField, region: CulturalRegion): UniversalChips {
  return UNIVERSAL_CHIPS[region]?.[field] || UNIVERSAL_CHIPS.western[field];
}

/**
 * Get all chips (primary + expanded) for a field
 */
export function getAllChips(field: ChipField, region: CulturalRegion): string[] {
  const chips = getFieldChips(field, region);
  return [...chips.primary, ...chips.expanded];
}
