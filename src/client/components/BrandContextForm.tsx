/**
 * Phase 3 - Brand Context Form Component
 *
 * Collects user-provided brand context to enhance Brand DNA extraction.
 * Now includes SOFT Guardrails for input quality assessment (Phase 3A).
 *
 * Features:
 * - Product Information* (required)
 * - Key Selling Points* (required)
 * - Target Audience
 * - User Pain Points
 * - Applicable Scenarios
 * - Promo Offer / Call to Action
 * - Real-time input quality indicator
 *
 * @module client/components/BrandContextForm
 * @version 2.0.0
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { assessInputQuality } from '@/client/utils/inputValidation';
import InputQualityIndicator from './InputQualityIndicator';
import GuidedInputChips from './GuidedInputChips';
import LanguageSwitcher, { loadSavedLanguage, detectBrowserLanguage } from './LanguageSwitcher';
import { getPlaceholders, languageToRegion } from '@/config/cultural/placeholders';
import type { ChipField } from '@/config/cultural/guidedChips';
import type { InputQualityAssessment, CulturalContextInput, SupportedLanguage, CulturalRegion } from '@/types/cultural';

// ChipField used in handleChipClick typing

// =============================================================================
// TYPES
// =============================================================================

export interface BrandContext {
  /** Product name and brief description (required) */
  productInfo: string;
  /** Key selling points / USP (required) */
  sellingPoints: string;
  /** Target demographic/audience */
  targetAudience: string;
  /** Pain points the product addresses */
  painPoints: string;
  /** Usage scenario or context */
  scenarios: string;
  /** Call to action or promotional message */
  ctaOffer: string;
}

interface BrandContextFormProps {
  /** Callback when form values change */
  onChange: (context: BrandContext, quality?: InputQualityAssessment) => void;
  /** Callback when cultural context changes */
  onCulturalContextChange?: (culturalContext: CulturalContextInput) => void;
  /** Initial values (for editing) */
  initialValues?: Partial<BrandContext>;
  /** Whether form is in loading state */
  isLoading?: boolean;
  /** Whether to show compact mode */
  compact?: boolean;
  /** Custom className */
  className?: string;
  /** Cultural context for localized validation messages */
  culturalContext?: CulturalContextInput;
  /** Show quality indicator (default: true) */
  showQualityIndicator?: boolean;
  /** Show language switcher (default: true) */
  showLanguageSwitcher?: boolean;
  /** Show guided input chips (default: true) */
  showGuidedChips?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_VALUES: BrandContext = {
  productInfo: '',
  sellingPoints: '',
  targetAudience: '',
  painPoints: '',
  scenarios: '',
  ctaOffer: '',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function BrandContextForm({
  onChange,
  onCulturalContextChange,
  initialValues,
  isLoading = false,
  compact = false,
  className = '',
  culturalContext: externalCulturalContext,
  showQualityIndicator = true,
  showLanguageSwitcher = true,
  showGuidedChips = true,
}: BrandContextFormProps) {
  const [values, setValues] = useState<BrandContext>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  // Track if component has mounted (for SSR hydration safety)
  const [hasMounted, setHasMounted] = useState(false);

  // Internal cultural context state - START WITH DEFAULT to match server render
  const [internalCulturalContext, setInternalCulturalContext] = useState<CulturalContextInput>({
    language: 'en',
    region: 'western',
    source: 'default' as const,
    confidence: 0.5,
    outputLanguage: 'en',
    formality: 'professional' as const,
    warmth: 0.5,
  });

  // Detect language AFTER mount to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true);

    // Check localStorage first, then browser detection
    const saved = loadSavedLanguage();
    if (saved) {
      setInternalCulturalContext({
        language: saved.language,
        region: saved.region,
        source: 'user_explicit',
        confidence: 1.0,
        outputLanguage: saved.language,
        formality: 'professional',
        warmth: 0.5,
      });
    } else {
      const detected = detectBrowserLanguage();
      setInternalCulturalContext({
        language: detected.language,
        region: detected.region,
        source: 'auto_browser',
        confidence: 0.9,
        outputLanguage: detected.language,
        formality: 'professional',
        warmth: 0.5,
      });
    }
  }, []);

  // Use external if provided, otherwise internal
  const culturalContext = externalCulturalContext || internalCulturalContext;

  // Get cultural-specific placeholders
  const placeholders = useMemo(() => {
    return getPlaceholders(culturalContext.region);
  }, [culturalContext.region]);

  /**
   * Handle language change from LanguageSwitcher
   */
  const handleLanguageChange = useCallback((language: SupportedLanguage, region: CulturalRegion) => {
    const newContext: CulturalContextInput = {
      language,
      region,
      source: 'user_explicit',
      confidence: 1.0,
      outputLanguage: language,
      formality: 'professional',
      warmth: 0.5,
    };
    setInternalCulturalContext(newContext);
    onCulturalContextChange?.(newContext);
  }, [onCulturalContextChange]);

  /**
   * Compute input quality assessment (memoized for performance)
   */
  const quality = useMemo(() => {
    return assessInputQuality(values, culturalContext);
  }, [values, culturalContext]);

  /**
   * Handle field change with quality assessment
   */
  const handleChange = useCallback(
    (field: keyof BrandContext) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValues = { ...values, [field]: e.target.value };
      setValues(newValues);
      // Pass quality assessment with the updated values
      const newQuality = assessInputQuality(newValues, culturalContext);
      onChange(newValues, newQuality);
    },
    [values, onChange, culturalContext]
  );

  /**
   * Handle chip click - append chip text to field value
   */
  const handleChipClick = useCallback(
    (field: ChipField) => (chipValue: string) => {
      const currentValue = values[field];
      // If field is empty, just add the chip value
      // Otherwise, append with a separator
      const separator = culturalContext.language.startsWith('zh') ? '，' : ', ';
      const newValue = currentValue
        ? `${currentValue}${separator}${chipValue}`
        : chipValue;

      const newValues = { ...values, [field]: newValue };
      setValues(newValues);
      const newQuality = assessInputQuality(newValues, culturalContext);
      onChange(newValues, newQuality);
    },
    [values, onChange, culturalContext]
  );

  return (
    <div className={`brand-context-form ${compact ? 'compact' : ''} ${className}`}>
      <div className="form-header">
        <div className="form-header-row">
          <div>
            <h3 className="form-title">Brand Context</h3>
            <p className="form-subtitle">
              Tell us about your product for more accurate brand analysis
            </p>
          </div>
          {showLanguageSwitcher && hasMounted && (
            <LanguageSwitcher
              language={culturalContext.language}
              onLanguageChange={handleLanguageChange}
              position="inline"
            />
          )}
        </div>
      </div>

      <div className="form-fields">
        {/* Product Information - Required */}
        <div className="form-field required">
          <label htmlFor="productInfo">
            Product Information <span className="required-marker">*</span>
          </label>
          <textarea
            id="productInfo"
            value={values.productInfo}
            onChange={handleChange('productInfo')}
            placeholder={placeholders.productInfo.placeholder}
            rows={compact ? 3 : 4}
            disabled={isLoading}
            className="resize-none"
          />
          <span className="field-hint">{placeholders.productInfo.qualityHint}</span>
        </div>

        {/* Key Selling Points - Required */}
        <div className="form-field required">
          <label htmlFor="sellingPoints">
            Key Selling Points <span className="required-marker">*</span>
          </label>
          <textarea
            id="sellingPoints"
            value={values.sellingPoints}
            onChange={handleChange('sellingPoints')}
            placeholder={placeholders.sellingPoints.placeholder}
            rows={compact ? 3 : 4}
            disabled={isLoading}
            className="resize-none"
          />
          <span className="field-hint">{placeholders.sellingPoints.qualityHint}</span>
        </div>

        {/* Two-column grid for optional fields */}
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="targetAudience">Target Audience</label>
            <textarea
              id="targetAudience"
              value={values.targetAudience}
              onChange={handleChange('targetAudience')}
              placeholder={placeholders.targetAudience.placeholder}
              rows={compact ? 2 : 3}
              disabled={isLoading}
              className="resize-none"
            />
            <span className="field-hint">{placeholders.targetAudience.qualityHint}</span>
            {showGuidedChips && !compact && hasMounted && (
              <GuidedInputChips
                field="targetAudience"
                region={culturalContext.region}
                onChipClick={handleChipClick('targetAudience')}
              />
            )}
          </div>

          <div className="form-field">
            <label htmlFor="painPoints">User Pain Points</label>
            <textarea
              id="painPoints"
              value={values.painPoints}
              onChange={handleChange('painPoints')}
              placeholder={placeholders.painPoints.placeholder}
              rows={compact ? 2 : 3}
              disabled={isLoading}
              className="resize-none"
            />
            <span className="field-hint">{placeholders.painPoints.qualityHint}</span>
            {showGuidedChips && !compact && hasMounted && (
              <GuidedInputChips
                field="painPoints"
                region={culturalContext.region}
                onChipClick={handleChipClick('painPoints')}
              />
            )}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="scenarios">Applicable Scenarios</label>
            <textarea
              id="scenarios"
              value={values.scenarios}
              onChange={handleChange('scenarios')}
              placeholder={placeholders.scenarios.placeholder}
              rows={compact ? 2 : 3}
              disabled={isLoading}
              className="resize-none"
            />
            <span className="field-hint">{placeholders.scenarios.qualityHint}</span>
            {showGuidedChips && !compact && hasMounted && (
              <GuidedInputChips
                field="scenarios"
                region={culturalContext.region}
                onChipClick={handleChipClick('scenarios')}
              />
            )}
          </div>

          <div className="form-field">
            <label htmlFor="ctaOffer">Promo Offer / Call to Action</label>
            <textarea
              id="ctaOffer"
              value={values.ctaOffer}
              onChange={handleChange('ctaOffer')}
              placeholder={placeholders.ctaOffer.placeholder}
              rows={compact ? 2 : 3}
              disabled={isLoading}
              className="resize-none"
            />
            <span className="field-hint">{placeholders.ctaOffer.qualityHint}</span>
            {showGuidedChips && !compact && hasMounted && (
              <GuidedInputChips
                field="ctaOffer"
                region={culturalContext.region}
                onChipClick={handleChipClick('ctaOffer')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quality Indicator - SOFT Guardrail */}
      {showQualityIndicator && (
        <div className="form-quality-section">
          <InputQualityIndicator
            quality={quality}
            language={culturalContext?.language || 'en'}
            mode={compact ? 'compact' : 'full'}
          />
        </div>
      )}

      <div className="form-footer">
        <span className="required-note">
          <span className="required-marker">*</span> Required fields
        </span>
        {!quality.canProceed && (
          <span className="quality-warning">
            Please improve input quality before proceeding
          </span>
        )}
      </div>

      <style>{formStyles}</style>
    </div>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const formStyles = `
  .brand-context-form {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .brand-context-form.compact {
    padding: 16px;
  }

  .form-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .form-title {
    margin: 0 0 4px;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
  }

  .form-subtitle {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .compact .form-header {
    margin-bottom: 12px;
    padding-bottom: 12px;
  }

  .compact .form-title {
    font-size: 1rem;
  }

  .field-hint {
    display: block;
    margin-top: 4px;
    font-size: 0.75rem;
    color: #9ca3af;
    font-style: italic;
  }

  .compact .field-hint {
    display: none;
  }

  .form-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .compact .form-fields {
    gap: 12px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (min-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-field label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .required-marker {
    color: #ef4444;
    font-weight: 600;
  }

  .form-field textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    font-family: inherit;
    resize: none;
    transition: all 0.2s;
    background: #f9fafb;
  }

  .form-field textarea:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    background: white;
  }

  .form-field textarea::placeholder {
    color: #9ca3af;
  }

  .form-field textarea:disabled {
    background: #e5e7eb;
    cursor: not-allowed;
  }

  .form-footer {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
  }

  .required-note {
    font-size: 0.75rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Compact adjustments */
  .compact .form-field textarea {
    padding: 8px 10px;
    font-size: 0.8rem;
  }

  .compact .form-field label {
    font-size: 0.8rem;
  }

  .compact .form-grid {
    gap: 12px;
  }

  /* Quality Indicator Section */
  .form-quality-section {
    margin-top: 16px;
    padding: 16px;
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
    border-radius: 12px;
    border: 1px solid #ddd6fe;
  }

  .compact .form-quality-section {
    margin-top: 12px;
    padding: 12px;
  }

  .quality-warning {
    display: block;
    margin-top: 8px;
    font-size: 0.75rem;
    color: #dc2626;
    font-weight: 500;
  }
`;

export { BrandContextForm };
