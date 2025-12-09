/**
 * Phase 3A - Cultural Placeholders Configuration
 *
 * Culturally-relevant placeholder text and examples for form fields.
 * Each region has localized content that guides users to provide quality input.
 *
 * @module config/cultural/placeholders
 * @version 1.0.0
 * @see docs/INPUT_GATEKEEPING_SPEC.md
 */

import type { CulturalRegion, SupportedLanguage } from '@/types/cultural';

// =============================================================================
// TYPES
// =============================================================================

export interface FieldPlaceholder {
  /** Placeholder text shown in empty field */
  placeholder: string;
  /** Example inputs to show as hints */
  examples: string[];
  /** Minimum character length for this field */
  minLength: number;
  /** Hint shown below field to guide input */
  qualityHint: string;
}

export interface CulturalPlaceholders {
  productInfo: FieldPlaceholder;
  sellingPoints: FieldPlaceholder;
  targetAudience: FieldPlaceholder;
  painPoints: FieldPlaceholder;
  scenarios: FieldPlaceholder;
  ctaOffer: FieldPlaceholder;
}

// =============================================================================
// PLACEHOLDER REGISTRY
// =============================================================================

export const PLACEHOLDERS: Record<CulturalRegion, CulturalPlaceholders> = {
  // ─────────────────────────────────────────────────────────────
  // CHINA (Simplified Chinese)
  // ─────────────────────────────────────────────────────────────
  china: {
    productInfo: {
      placeholder: '介绍您的产品或服务...',
      examples: [
        '高端脊椎理疗床，源自德国工艺，专为久坐人群设计',
        '有机护肤品系列，零添加纯天然，适合敏感肌',
        '智能家居健康监测系统，全天候守护家人健康',
      ],
      minLength: 10,
      qualityHint: '包含产品名称、核心功能和主要特点',
    },
    sellingPoints: {
      placeholder: '您产品的独特卖点是什么？',
      examples: [
        '德国进口核心部件，10年质保',
        '30天无理由退款，专业团队上门安装',
        '获得国家专利认证，超过10万用户好评',
      ],
      minLength: 8,
      qualityHint: '突出与竞品的差异化优势',
    },
    targetAudience: {
      placeholder: '描述您的目标客户群体...',
      examples: [
        '35-55岁注重健康的企业高管，追求品质生活',
        '年轻妈妈群体，关注宝宝和家人的健康',
        '都市白领，工作压力大，需要放松身心',
      ],
      minLength: 8,
      qualityHint: '越详细，AI分析越精准',
    },
    painPoints: {
      placeholder: '您的产品解决什么问题？',
      examples: [
        '久坐导致的腰椎问题和颈椎疼痛',
        '化学护肤品引起的皮肤过敏',
        '无法实时了解家人健康状况的焦虑',
      ],
      minLength: 6,
      qualityHint: '描述用户的痛点和困扰',
    },
    scenarios: {
      placeholder: '产品的使用场景是什么？',
      examples: [
        '家庭卧室、办公室午休、养生馆',
        '早晚护肤日常、出差旅行携带',
        '居家日常监测、远程关爱父母',
      ],
      minLength: 4,
      qualityHint: '描述何时何地使用产品',
    },
    ctaOffer: {
      placeholder: '有什么促销活动或优惠？',
      examples: [
        '限时8折优惠，前100名送价值599元配件',
        '新用户首单立减200，支持12期免息',
        '预约体验送精美礼品，满意再购买',
      ],
      minLength: 4,
      qualityHint: '吸引用户立即行动的理由',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // TAIWAN (Traditional Chinese)
  // ─────────────────────────────────────────────────────────────
  taiwan: {
    productInfo: {
      placeholder: '介紹您的產品或服務...',
      examples: [
        '頂級脊椎理療床，源自德國工藝，專為久坐族設計',
        '有機護膚品系列，零添加純天然，適合敏感肌膚',
        '智慧家居健康監測系統，全天候守護家人健康',
      ],
      minLength: 10,
      qualityHint: '包含產品名稱、核心功能和主要特點',
    },
    sellingPoints: {
      placeholder: '您產品的獨特賣點是什麼？',
      examples: [
        '德國進口核心零件，10年保固',
        '30天無條件退款，專業團隊到府安裝',
        '獲得國家專利認證，超過10萬用戶好評',
      ],
      minLength: 8,
      qualityHint: '突出與競品的差異化優勢',
    },
    targetAudience: {
      placeholder: '描述您的目標客戶群體...',
      examples: [
        '35-55歲注重健康的企業主管，追求品質生活',
        '年輕媽媽群體，關注寶寶和家人的健康',
        '都會上班族，工作壓力大，需要放鬆身心',
      ],
      minLength: 8,
      qualityHint: '越詳細，AI分析越精準',
    },
    painPoints: {
      placeholder: '您的產品解決什麼問題？',
      examples: [
        '久坐導致的腰椎問題和頸椎疼痛',
        '化學護膚品引起的皮膚過敏',
        '無法即時了解家人健康狀況的焦慮',
      ],
      minLength: 6,
      qualityHint: '描述用戶的痛點和困擾',
    },
    scenarios: {
      placeholder: '產品的使用場景是什麼？',
      examples: [
        '家庭臥室、辦公室午休、養生館',
        '早晚護膚日常、出差旅行攜帶',
        '居家日常監測、遠距關懷父母',
      ],
      minLength: 4,
      qualityHint: '描述何時何地使用產品',
    },
    ctaOffer: {
      placeholder: '有什麼促銷活動或優惠？',
      examples: [
        '限時8折優惠，前100名送價值599元配件',
        '新用戶首單立減200，支持12期免息',
        '預約體驗送精美禮品，滿意再購買',
      ],
      minLength: 4,
      qualityHint: '吸引用戶立即行動的理由',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // WESTERN (English)
  // ─────────────────────────────────────────────────────────────
  western: {
    productInfo: {
      placeholder: 'Describe your product or service...',
      examples: [
        'Premium spine therapy bed with German engineering, designed for sedentary professionals',
        'Organic skincare line, 100% natural ingredients, perfect for sensitive skin',
        'Smart home wellness monitoring system for 24/7 family health tracking',
      ],
      minLength: 25,
      qualityHint: 'Include product name, core features, and key benefits',
    },
    sellingPoints: {
      placeholder: 'What makes your product unique?',
      examples: [
        'German-imported core components with 10-year warranty',
        '30-day money-back guarantee with professional installation included',
        'Patented technology trusted by over 100,000 satisfied customers',
      ],
      minLength: 20,
      qualityHint: 'Highlight what sets you apart from competitors',
    },
    targetAudience: {
      placeholder: 'Describe your target audience...',
      examples: [
        'Health-conscious executives aged 35-55 who value quality of life',
        'Young mothers prioritizing family health and organic products',
        'Urban professionals seeking stress relief and work-life balance',
      ],
      minLength: 20,
      qualityHint: 'More detail = better AI analysis',
    },
    painPoints: {
      placeholder: 'What problems does your product solve?',
      examples: [
        'Back pain and neck strain from prolonged sitting',
        'Skin irritation caused by chemical-laden skincare products',
        'Anxiety about not knowing family members\' health status',
      ],
      minLength: 15,
      qualityHint: 'Describe the frustrations and challenges your users face',
    },
    scenarios: {
      placeholder: 'When and where would customers use your product?',
      examples: [
        'Home bedroom, office nap room, wellness center',
        'Morning and evening skincare routine, travel-friendly',
        'Daily home monitoring, remote elderly parent care',
      ],
      minLength: 10,
      qualityHint: 'Describe usage context and situations',
    },
    ctaOffer: {
      placeholder: 'Any special offers or promotions?',
      examples: [
        'Limited time 20% off, first 100 customers get free accessories',
        'New customer discount $200 off, 12-month interest-free financing',
        'Book a free trial, buy only if satisfied',
      ],
      minLength: 10,
      qualityHint: 'Give users a reason to act now',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // MALAYSIA (Bahasa Malaysia)
  // ─────────────────────────────────────────────────────────────
  malaysia: {
    productInfo: {
      placeholder: 'Terangkan produk atau perkhidmatan anda...',
      examples: [
        'Katil terapi tulang belakang premium, kejuruteraan Jerman, direka untuk profesional',
        'Barisan penjagaan kulit organik, 100% bahan semula jadi, sesuai untuk kulit sensitif',
        'Sistem pemantauan kesihatan rumah pintar untuk penjagaan kesihatan keluarga 24/7',
      ],
      minLength: 20,
      qualityHint: 'Sertakan nama produk, ciri utama, dan faedah',
    },
    sellingPoints: {
      placeholder: 'Apa yang menjadikan produk anda unik?',
      examples: [
        'Komponen teras import Jerman dengan jaminan 10 tahun',
        'Jaminan wang dikembalikan 30 hari dengan pemasangan profesional',
        'Teknologi dipatenkan dipercayai oleh lebih 100,000 pelanggan',
      ],
      minLength: 15,
      qualityHint: 'Tonjolkan kelebihan berbanding pesaing',
    },
    targetAudience: {
      placeholder: 'Terangkan sasaran pelanggan anda...',
      examples: [
        'Eksekutif berumur 35-55 yang mementingkan kesihatan dan kualiti hidup',
        'Ibu muda yang mengutamakan kesihatan keluarga dan produk organik',
        'Profesional bandar yang mencari kelegaan tekanan dan keseimbangan hidup',
      ],
      minLength: 15,
      qualityHint: 'Lebih terperinci = analisis AI lebih tepat',
    },
    painPoints: {
      placeholder: 'Apakah masalah yang diselesaikan oleh produk anda?',
      examples: [
        'Sakit belakang dan leher akibat duduk berpanjangan',
        'Kerengsaan kulit disebabkan produk penjagaan kulit berkimia',
        'Kebimbangan tentang tidak mengetahui status kesihatan keluarga',
      ],
      minLength: 10,
      qualityHint: 'Terangkan kekecewaan dan cabaran pengguna',
    },
    scenarios: {
      placeholder: 'Bila dan di mana pelanggan menggunakan produk anda?',
      examples: [
        'Bilik tidur rumah, bilik rehat pejabat, pusat kesihatan',
        'Rutin penjagaan kulit pagi dan petang, mesra perjalanan',
        'Pemantauan harian di rumah, penjagaan ibu bapa warga emas',
      ],
      minLength: 10,
      qualityHint: 'Terangkan konteks dan situasi penggunaan',
    },
    ctaOffer: {
      placeholder: 'Ada tawaran istimewa atau promosi?',
      examples: [
        'Diskaun 20% masa terhad, 100 pelanggan pertama dapat aksesori percuma',
        'Diskaun pelanggan baru RM200, pembiayaan 12 bulan tanpa faedah',
        'Tempah percubaan percuma, beli hanya jika berpuas hati',
      ],
      minLength: 8,
      qualityHint: 'Beri pengguna sebab untuk bertindak sekarang',
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get placeholders for a specific region
 */
export function getPlaceholders(region: CulturalRegion): CulturalPlaceholders {
  return PLACEHOLDERS[region] || PLACEHOLDERS.western;
}

/**
 * Get placeholder for a specific field and region
 */
export function getFieldPlaceholder(
  field: keyof CulturalPlaceholders,
  region: CulturalRegion
): FieldPlaceholder {
  const placeholders = getPlaceholders(region);
  return placeholders[field];
}

/**
 * Get a random example for a field
 */
export function getRandomExample(
  field: keyof CulturalPlaceholders,
  region: CulturalRegion
): string {
  const placeholder = getFieldPlaceholder(field, region);
  const randomIndex = Math.floor(Math.random() * placeholder.examples.length);
  return placeholder.examples[randomIndex] || '';
}

/**
 * Map language to region
 */
export function languageToRegion(language: SupportedLanguage): CulturalRegion {
  const map: Record<SupportedLanguage, CulturalRegion> = {
    'en': 'western',
    'zh-CN': 'china',
    'zh-TW': 'taiwan',
    'ms': 'malaysia',
  };
  return map[language] || 'western';
}
