/**
 * Phase 3 - Brand Context Form Component
 *
 * Collects user-provided brand context to enhance Brand DNA extraction.
 * Mirrors the Free version ContentGenerator form fields:
 * - Product Information* (required)
 * - Key Selling Points* (required)
 * - Target Audience
 * - User Pain Points
 * - Applicable Scenarios
 * - Promo Offer / Call to Action
 *
 * @module client/components/BrandContextForm
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';

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
  onChange: (context: BrandContext) => void;
  /** Initial values (for editing) */
  initialValues?: Partial<BrandContext>;
  /** Whether form is in loading state */
  isLoading?: boolean;
  /** Whether to show compact mode */
  compact?: boolean;
  /** Custom className */
  className?: string;
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
  initialValues,
  isLoading = false,
  compact = false,
  className = '',
}: BrandContextFormProps) {
  const [values, setValues] = useState<BrandContext>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    (field: keyof BrandContext) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValues = { ...values, [field]: e.target.value };
      setValues(newValues);
      onChange(newValues);
    },
    [values, onChange]
  );

  return (
    <div className={`brand-context-form ${compact ? 'compact' : ''} ${className}`}>
      <div className="form-header">
        <h3 className="form-title">Brand Context</h3>
        <p className="form-subtitle">
          Tell us about your product for more accurate brand analysis
        </p>
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
            placeholder="Describe your wellness product or service. What is it? What does it do?"
            rows={compact ? 3 : 4}
            disabled={isLoading}
            className="resize-none"
          />
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
            placeholder="What makes your product unique? Why should customers choose you?"
            rows={compact ? 3 : 4}
            disabled={isLoading}
            className="resize-none"
          />
        </div>

        {/* Two-column grid for optional fields */}
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="targetAudience">Target Audience</label>
            <textarea
              id="targetAudience"
              value={values.targetAudience}
              onChange={handleChange('targetAudience')}
              placeholder="Who is your ideal customer? Age, lifestyle, interests..."
              rows={compact ? 2 : 3}
              disabled={isLoading}
              className="resize-none"
            />
          </div>

          <div className="form-field">
            <label htmlFor="painPoints">User Pain Points</label>
            <textarea
              id="painPoints"
              value={values.painPoints}
              onChange={handleChange('painPoints')}
              placeholder="What problems does your product solve?"
              rows={compact ? 2 : 3}
              disabled={isLoading}
              className="resize-none"
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="scenarios">Applicable Scenarios</label>
            <textarea
              id="scenarios"
              value={values.scenarios}
              onChange={handleChange('scenarios')}
              placeholder="When and where would customers use your product?"
              rows={compact ? 2 : 3}
              disabled={isLoading}
              className="resize-none"
            />
          </div>

          <div className="form-field">
            <label htmlFor="ctaOffer">Promo Offer / Call to Action</label>
            <textarea
              id="ctaOffer"
              value={values.ctaOffer}
              onChange={handleChange('ctaOffer')}
              placeholder="Any special offers or promotions? What action should customers take?"
              rows={compact ? 2 : 3}
              disabled={isLoading}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      <div className="form-footer">
        <span className="required-note">
          <span className="required-marker">*</span> Required fields
        </span>
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
`;

export { BrandContextForm };
