/**
 * Micro-Enrichment Toast Component
 *
 * Stage 2 of Progressive Brand Content: A slide-up toast that appears
 * after Director selection, asking for a single piece of context.
 *
 * UX Design:
 * - Non-blocking: User can skip without penalty
 * - Contextually relevant: Appears at moment of engagement
 * - Low friction: Single field, optional chips
 *
 * @module client/components/MicroEnrichmentToast
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import type { DirectorProfile } from '@/config/directors';

// =============================================================================
// TYPES
// =============================================================================

interface MicroEnrichmentToastProps {
  /** Whether toast should be visible */
  isVisible: boolean;
  /** Selected Director (for personalized messaging) */
  director: DirectorProfile;
  /** Callback when user provides input */
  onSubmit: (productInfo: string) => void;
  /** Callback when user dismisses */
  onDismiss: () => void;
}

// =============================================================================
// DIRECTOR-SPECIFIC PROMPTS
// =============================================================================

const DIRECTOR_PROMPTS: Record<string, {
  question: string;
  placeholder: string;
  skipText: string;
}> = {
  newtonian: {
    question: "One data point to optimize your scenes:",
    placeholder: "What product are we simulating?",
    skipText: "Calculate without context",
  },
  visionary: {
    question: "A whisper of context for the dream:",
    placeholder: "What story are we painting?",
    skipText: "Let the vision guide itself",
  },
  minimalist: {
    question: "The essential context:",
    placeholder: "What are we distilling?",
    skipText: "Proceed with visual purity",
  },
  provocateur: {
    question: "What are we disrupting?",
    placeholder: "Tell me what needs shaking up",
    skipText: "Chaos doesn't need context",
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MicroEnrichmentToast({
  isVisible,
  director,
  onSubmit,
  onDismiss,
}: MicroEnrichmentToastProps) {
  const [input, setInput] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle visibility animation
  useEffect(() => {
    if (isVisible) {
      // Small delay before showing for smooth animation
      const timer = setTimeout(() => setIsAnimating(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible]);

  const handleSubmit = useCallback(() => {
    if (input.trim()) {
      onSubmit(input.trim());
      setInput('');
    }
  }, [input, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onDismiss();
    }
  }, [handleSubmit, onDismiss]);

  const prompt = DIRECTOR_PROMPTS[director.id] || DIRECTOR_PROMPTS['newtonian'];

  if (!isVisible || !prompt) return null;

  return (
    <div className={`micro-enrichment-toast ${isAnimating ? 'visible' : ''}`}>
      <div className="toast-content">
        {/* Director avatar and question */}
        <div className="toast-header">
          <span className="toast-avatar">{director.avatar}</span>
          <p className="toast-question">{prompt.question}</p>
        </div>

        {/* Input field */}
        <input
          type="text"
          className="toast-input"
          placeholder={prompt.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        {/* Actions */}
        <div className="toast-actions">
          <button
            className="toast-submit"
            onClick={handleSubmit}
            disabled={!input.trim()}
          >
            Continue
          </button>
          <button
            className="toast-skip"
            onClick={onDismiss}
          >
            {prompt.skipText}
          </button>
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = `
  .micro-enrichment-toast {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    transform: translateY(100%);
    transition: transform 0.3s ease-out;
  }

  .micro-enrichment-toast.visible {
    transform: translateY(0);
  }

  .toast-content {
    background: white;
    border-radius: 20px 20px 0 0;
    padding: 24px;
    max-width: 500px;
    margin: 0 auto;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  }

  .toast-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .toast-avatar {
    font-size: 32px;
    line-height: 1;
  }

  .toast-question {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .toast-input {
    width: 100%;
    padding: 14px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 1rem;
    font-family: inherit;
    margin-bottom: 16px;
    transition: border-color 0.2s;
  }

  .toast-input:focus {
    outline: none;
    border-color: #8b5cf6;
  }

  .toast-input::placeholder {
    color: #9ca3af;
  }

  .toast-actions {
    display: flex;
    gap: 12px;
  }

  .toast-submit {
    flex: 1;
    padding: 14px 24px;
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.2s;
  }

  .toast-submit:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .toast-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toast-skip {
    padding: 14px 20px;
    background: transparent;
    color: #6b7280;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .toast-skip:hover {
    background: #f9fafb;
  }

  /* Backdrop */
  .micro-enrichment-toast::before {
    content: '';
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }

  .micro-enrichment-toast.visible::before {
    opacity: 1;
    pointer-events: auto;
  }
`;

export { MicroEnrichmentToast };
