/**
 * InputQualityIndicator Component
 *
 * Real-time visual feedback for input quality assessment.
 * Shows quality bar, grade label, and actionable suggestions.
 *
 * Part of Phase 3A SOFT Guardrails - frictionless onboarding.
 *
 * @module client/components/InputQualityIndicator
 * @version 1.1.0 - Fixed: Using inline styles for guaranteed color rendering
 * @see docs/INPUT_GATEKEEPING_SPEC.md
 */

import type {
  InputQualityAssessment,
  InputQualityGrade,
  SupportedLanguage,
} from '@/types/cultural';

// =============================================================================
// TYPES
// =============================================================================

interface InputQualityIndicatorProps {
  /** Current quality assessment */
  quality: InputQualityAssessment;
  /** Language for localized messages */
  language?: SupportedLanguage;
  /** Display mode: compact (bar only) or full (bar + suggestions) */
  mode?: 'compact' | 'full';
  /** Optional className */
  className?: string;
}

// =============================================================================
// COLOR CONFIG (Inline styles for guaranteed rendering)
// =============================================================================

const GRADE_STYLES: Record<InputQualityGrade, {
  barColor: string;
  textColor: string;
  bgColor: string;
  widthPercent: number;
}> = {
  excellent: {
    barColor: '#22c55e', // green-500
    textColor: '#15803d', // green-700
    bgColor: '#f0fdf4', // green-50
    widthPercent: 100,
  },
  good: {
    barColor: '#3b82f6', // blue-500
    textColor: '#1d4ed8', // blue-700
    bgColor: '#eff6ff', // blue-50
    widthPercent: 80,
  },
  basic: {
    barColor: '#eab308', // yellow-500
    textColor: '#a16207', // yellow-700
    bgColor: '#fefce8', // yellow-50
    widthPercent: 60,
  },
  insufficient: {
    barColor: '#f97316', // orange-500
    textColor: '#c2410c', // orange-700
    bgColor: '#fff7ed', // orange-50
    widthPercent: 40,
  },
  invalid: {
    barColor: '#ef4444', // red-500
    textColor: '#b91c1c', // red-700
    bgColor: '#fef2f2', // red-50
    widthPercent: 20,
  },
};

// =============================================================================
// LOCALIZED LABELS
// =============================================================================

const QUALITY_LABELS: Record<SupportedLanguage, Record<InputQualityGrade, string>> = {
  'en': {
    excellent: 'Excellent',
    good: 'Good',
    basic: 'Basic',
    insufficient: 'Insufficient',
    invalid: 'Invalid',
  },
  'zh-CN': {
    excellent: '优秀',
    good: '良好',
    basic: '基础',
    insufficient: '不足',
    invalid: '无效',
  },
  'zh-TW': {
    excellent: '優秀',
    good: '良好',
    basic: '基礎',
    insufficient: '不足',
    invalid: '無效',
  },
  'ms': {
    excellent: 'Cemerlang',
    good: 'Baik',
    basic: 'Asas',
    insufficient: 'Tidak mencukupi',
    invalid: 'Tidak sah',
  },
};

const QUALITY_HINTS: Record<SupportedLanguage, Record<InputQualityGrade, string>> = {
  'en': {
    excellent: 'AI analysis will be highly personalized',
    good: 'Good detail for accurate analysis',
    basic: 'Add more detail for better results',
    insufficient: 'More information needed',
    invalid: 'Please provide valid information',
  },
  'zh-CN': {
    excellent: 'AI分析将高度个性化',
    good: '细节充足，分析准确',
    basic: '添加更多细节可提升效果',
    insufficient: '需要更多信息',
    invalid: '请输入有效信息',
  },
  'zh-TW': {
    excellent: 'AI分析將高度個性化',
    good: '細節充足，分析準確',
    basic: '添加更多細節可提升效果',
    insufficient: '需要更多資訊',
    invalid: '請輸入有效資訊',
  },
  'ms': {
    excellent: 'Analisis AI akan sangat diperibadikan',
    good: 'Butiran yang baik untuk analisis tepat',
    basic: 'Tambah lebih banyak butiran untuk hasil lebih baik',
    insufficient: 'Maklumat lanjut diperlukan',
    invalid: 'Sila berikan maklumat yang sah',
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function InputQualityIndicator({
  quality,
  language = 'en',
  mode = 'full',
  className = '',
}: InputQualityIndicatorProps) {
  const styles = GRADE_STYLES[quality.grade];
  const label = QUALITY_LABELS[language]?.[quality.grade] || QUALITY_LABELS['en'][quality.grade];
  const hint = QUALITY_HINTS[language]?.[quality.grade] || QUALITY_HINTS['en'][quality.grade];
  const isPositive = quality.grade === 'excellent' || quality.grade === 'good';

  return (
    <div className={`input-quality-indicator ${className}`}>
      {/* Quality Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          flex: 1,
          height: '10px',
          backgroundColor: '#e5e7eb',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}>
          <div
            style={{
              height: '100%',
              width: `${styles.widthPercent}%`,
              backgroundColor: styles.barColor,
              transition: 'all 0.3s ease-out',
              borderRadius: '9999px',
            }}
          />
        </div>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: styles.textColor,
          minWidth: '90px',
          textAlign: 'right',
        }}>
          {label}
        </span>
      </div>

      {/* Hint Text (Full Mode) */}
      {mode === 'full' && (
        <div style={{
          marginTop: '8px',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: styles.bgColor,
          border: `1px solid ${styles.barColor}20`,
        }}>
          <p style={{
            fontSize: '14px',
            color: styles.textColor,
            margin: 0,
          }}>
            {isPositive ? '✓ ' : '💡 '}
            {hint}
          </p>
        </div>
      )}

      {/* Issues List (Full Mode + Has Issues) */}
      {mode === 'full' && quality.issues.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {quality.issues.slice(0, 3).map((issue, idx) => (
            <div
              key={idx}
              style={{
                fontSize: '12px',
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: issue.severity === 'error' ? '#fef2f2' : '#fefce8',
                color: issue.severity === 'error' ? '#dc2626' : '#a16207',
                border: `1px solid ${issue.severity === 'error' ? '#fecaca' : '#fef08a'}`,
              }}
            >
              <span style={{ fontWeight: 600 }}>
                {issue.severity === 'error' ? '⚠ ' : '○ '}
                {issue.field}:
              </span>{' '}
              {issue.message}
              {issue.suggestion && (
                <span style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontStyle: 'italic' }}>
                  {issue.suggestion}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Score Badge (Compact indicator) */}
      {mode === 'compact' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '4px',
        }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            Quality: {quality.score}%
          </span>
          {!quality.canProceed && (
            <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>
              Needs improvement
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export { InputQualityIndicator };
