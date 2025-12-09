/**
 * Director-Led Scene Approval Component
 *
 * Stage 3 of Progressive Brand Content: The selected Director guides users
 * through scene-by-scene approval while collecting brand context in their voice.
 *
 * UX Flow:
 * 1. Director introduces each scene with opinionated commentary
 * 2. If context would improve the scene, Director asks for it (in character)
 * 3. User provides input via guided chips or free text
 * 4. Director acknowledges and updates the BrandSemanticLock
 *
 * @module client/components/DirectorSceneApproval
 * @version 1.0.0
 */

import { useState, useCallback, useMemo } from 'react';
import type { VideoScene } from '@/types';
import type { DirectorProfile } from '@/config/directors';
import {
  generateDirectorSceneGuidance,
  type DirectorSceneGuidance,
  type ProgressiveBrandData,
  type DirectorEnrichmentPrompt,
  calculateQualityTier,
  calculateCompleteness,
} from '@/config/progressiveBrandContent';

// =============================================================================
// TYPES
// =============================================================================

interface DirectorSceneApprovalProps {
  /** Selected Director profile */
  director: DirectorProfile;
  /** Scenes to review */
  scenes: VideoScene[];
  /** Current brand data (may be partially filled) */
  brandData: Partial<ProgressiveBrandData>;
  /** Callback when brand data is enriched */
  onBrandDataUpdate: (data: Partial<ProgressiveBrandData>) => void;
  /** Callback when scene is approved (GREEN) */
  onSceneApprove: (sceneId: string) => void;
  /** Callback when scene needs refinement (YELLOW/RED) */
  onSceneRefine: (sceneId: string, status: 'YELLOW' | 'RED', feedback?: string) => void;
  /** Callback when all scenes are reviewed */
  onComplete: () => void;
  /** Source image URL for context */
  sourceImageUrl?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DirectorSceneApproval({
  director,
  scenes,
  brandData,
  onBrandDataUpdate,
  onSceneApprove,
  onSceneRefine,
  onComplete,
  sourceImageUrl,
}: DirectorSceneApprovalProps) {
  // Current scene index being reviewed
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  // Enrichment input state
  const [enrichmentInput, setEnrichmentInput] = useState('');
  const [showEnrichment, setShowEnrichment] = useState(false);

  // P3-5 FIX: Preserve feedback input per scene on navigation
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});

  // Get/set current scene's feedback
  const currentSceneId = scenes[currentSceneIndex]?.id;
  const feedbackInput = currentSceneId ? (feedbackInputs[currentSceneId] ?? '') : '';
  const setFeedbackInput = (value: string) => {
    if (currentSceneId) {
      setFeedbackInputs(prev => ({ ...prev, [currentSceneId]: value }));
    }
  };

  // Generate Director guidance for all scenes
  const sceneGuidance = useMemo(
    () => generateDirectorSceneGuidance(director, scenes.length, brandData),
    [director, scenes.length, brandData]
  );

  const currentScene = scenes[currentSceneIndex];
  const currentGuidance = sceneGuidance[currentSceneIndex];
  const qualityTier = calculateQualityTier(brandData);
  const completeness = calculateCompleteness(brandData);

  // Handle enrichment submission
  const handleEnrichmentSubmit = useCallback(() => {
    if (!enrichmentInput.trim() || !currentGuidance?.enrichmentNeeded) return;

    const updatedData = {
      ...brandData,
      [currentGuidance.enrichmentNeeded]: enrichmentInput.trim(),
    };

    onBrandDataUpdate(updatedData);
    setEnrichmentInput('');
    setShowEnrichment(false);
  }, [enrichmentInput, currentGuidance, brandData, onBrandDataUpdate]);

  // Handle chip click
  const handleChipClick = useCallback((chip: string) => {
    setEnrichmentInput(prev => {
      if (prev) return `${prev}, ${chip}`;
      return chip;
    });
  }, []);

  // Handle scene approval
  const handleApprove = useCallback(() => {
    if (!currentScene) return;
    onSceneApprove(currentScene.id);

    // Move to next scene or complete
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
      setShowEnrichment(false);
      // P3-5 FIX: Don't clear feedback - it's preserved per-scene now
    } else {
      onComplete();
    }
  }, [currentScene, currentSceneIndex, scenes.length, onSceneApprove, onComplete]);

  // Handle scene refinement
  const handleRefine = useCallback((status: 'YELLOW' | 'RED') => {
    if (!currentScene) return;
    onSceneRefine(currentScene.id, status, status === 'YELLOW' ? feedbackInput : undefined);
    // P3-5 FIX: Clear only current scene's feedback after submission
    setFeedbackInputs(prev => ({ ...prev, [currentScene.id]: '' }));
  }, [currentScene, feedbackInput, onSceneRefine]);

  if (!currentScene || !currentGuidance) {
    return null;
  }

  return (
    <div className="director-scene-approval">
      {/* Director Header */}
      <div className="director-header">
        <div className="director-avatar">{director.avatar}</div>
        <div className="director-info">
          <h3 className="director-name">{director.name}</h3>
          <p className="director-archetype">{director.archetype}</p>
        </div>
        <div className="quality-badge" data-tier={qualityTier}>
          {qualityTier.charAt(0).toUpperCase() + qualityTier.slice(1)} Quality
          <span className="completeness">({completeness}%)</span>
        </div>
      </div>

      {/* Scene Progress */}
      <div className="scene-progress">
        {scenes.map((scene, idx) => (
          <div
            key={scene.id}
            className={`progress-dot ${idx === currentSceneIndex ? 'current' : ''} ${
              idx < currentSceneIndex ? 'completed' : ''
            }`}
            data-status={scene.status}
          />
        ))}
      </div>

      {/* Director Commentary */}
      <div className="director-commentary">
        <p className="commentary-text">
          "{currentGuidance.commentary}"
        </p>
      </div>

      {/* Scene Preview */}
      <div className="scene-preview-container">
        <div className="scene-number">Scene {currentSceneIndex + 1} of {scenes.length}</div>
        {/* P3-1 FIX: Enhanced loading state with progress indicator */}
        {currentScene.preview_url ? (
          <img
            src={currentScene.preview_url}
            alt={`Scene ${currentSceneIndex + 1} preview`}
            className="scene-preview-image"
          />
        ) : (
          <div className="scene-preview-placeholder">
            <div className="preview-loading">
              <div className="preview-spinner" />
              <span className="preview-loading-text">Generating preview...</span>
              <span className="preview-loading-hint">This may take a moment</span>
            </div>
          </div>
        )}
        <p className="scene-action-token">{currentScene.action_token}</p>
      </div>

      {/* Enrichment Section (Director-led) */}
      {currentGuidance.enrichmentPrompt && !showEnrichment && (
        <button
          className="enrichment-trigger"
          onClick={() => setShowEnrichment(true)}
        >
          {director.avatar} {director.name} has a question...
        </button>
      )}

      {showEnrichment && currentGuidance.enrichmentPrompt && (
        <DirectorEnrichmentSection
          director={director}
          prompt={currentGuidance.enrichmentPrompt}
          value={enrichmentInput}
          onChange={setEnrichmentInput}
          onChipClick={handleChipClick}
          onSubmit={handleEnrichmentSubmit}
          onSkip={() => setShowEnrichment(false)}
        />
      )}

      {/* Scene Actions */}
      <div className="scene-actions">
        {/* GREEN - Approve */}
        <button
          type="button"
          className="action-button approve"
          onClick={handleApprove}
        >
          {currentSceneIndex < scenes.length - 1 ? 'Approve & Next' : 'Approve & Finish'}
        </button>

        {/* P2-3 FIX: Quick Approve All - visible on all scenes, not just first */}
        {scenes.length > 1 && (
          <button
            type="button"
            className="action-button approve-all"
            onClick={() => {
              scenes.forEach(scene => onSceneApprove(scene.id));
              onComplete();
            }}
          >
            Approve All ({scenes.length - currentSceneIndex} remaining)
          </button>
        )}

        {/* RED - Regenerate */}
        <button
          type="button"
          className="action-button regenerate"
          onClick={() => handleRefine('RED')}
        >
          Regenerate
        </button>
      </div>

      {/* Refinement Section (collapsible) */}
      <details className="refine-details">
        <summary className="refine-summary">Need changes? Add feedback</summary>
        <div className="refine-section">
          <input
            type="text"
            className="feedback-input"
            placeholder="What should be different?"
            value={feedbackInput}
            onChange={(e) => setFeedbackInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && feedbackInput.trim()) {
                handleRefine('YELLOW');
              }
            }}
          />
          <button
            type="button"
            className="action-button refine"
            onClick={() => handleRefine('YELLOW')}
            disabled={!feedbackInput.trim()}
          >
            Submit Feedback
          </button>
        </div>
      </details>

      <style>{styles}</style>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface DirectorEnrichmentSectionProps {
  director: DirectorProfile;
  prompt: DirectorEnrichmentPrompt;
  value: string;
  onChange: (value: string) => void;
  onChipClick: (chip: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}

function DirectorEnrichmentSection({
  director,
  prompt,
  value,
  onChange,
  onChipClick,
  onSubmit,
  onSkip,
}: DirectorEnrichmentSectionProps) {
  return (
    <div className="enrichment-section">
      {/* Director's opinionated commentary */}
      <div className="enrichment-commentary">
        <span className="director-avatar-small">{director.avatar}</span>
        <p>{prompt.commentary}</p>
      </div>

      {/* Director's question */}
      <div className="enrichment-question">
        <p>{prompt.question}</p>
      </div>

      {/* Suggested chips */}
      {prompt.suggestions && prompt.suggestions.length > 0 && (
        <div className="enrichment-chips">
          {prompt.suggestions.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              className="enrichment-chip"
              onClick={() => onChipClick(chip)}
            >
              + {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input field */}
      <textarea
        className="enrichment-input"
        placeholder="Your answer..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
      />

      {/* Actions */}
      <div className="enrichment-actions">
        <button
          className="enrichment-submit"
          onClick={onSubmit}
          disabled={!value.trim()}
        >
          Tell {director.name}
        </button>
        <button
          className="enrichment-skip"
          onClick={onSkip}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = `
  .director-scene-approval {
    background: white;
    border-radius: 16px;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
  }

  .director-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
  }

  .director-avatar {
    font-size: 48px;
    line-height: 1;
  }

  .director-info {
    flex: 1;
  }

  .director-name {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
  }

  .director-archetype {
    margin: 4px 0 0;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .quality-badge {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .quality-badge[data-tier="basic"] {
    background: #fef3c7;
    color: #92400e;
  }

  .quality-badge[data-tier="good"] {
    background: #d1fae5;
    color: #065f46;
  }

  .quality-badge[data-tier="better"] {
    background: #dbeafe;
    color: #1e40af;
  }

  .quality-badge[data-tier="excellent"] {
    background: #ede9fe;
    color: #5b21b6;
  }

  .completeness {
    margin-left: 4px;
    opacity: 0.7;
  }

  .scene-progress {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-bottom: 20px;
  }

  .progress-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #e5e7eb;
    transition: all 0.2s;
  }

  .progress-dot.current {
    background: #8b5cf6;
    transform: scale(1.3);
  }

  .progress-dot.completed {
    background: #10b981;
  }

  .progress-dot[data-status="GREEN"] {
    background: #10b981;
  }

  .progress-dot[data-status="YELLOW"] {
    background: #f59e0b;
  }

  .progress-dot[data-status="RED"] {
    background: #ef4444;
  }

  .director-commentary {
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 20px;
    border-left: 4px solid #8b5cf6;
  }

  .commentary-text {
    margin: 0;
    font-style: italic;
    color: #4c1d95;
    line-height: 1.5;
  }

  .scene-preview-container {
    text-align: center;
    margin-bottom: 20px;
  }

  .scene-number {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .scene-preview-image {
    width: 100%;
    max-height: 400px;
    object-fit: contain;
    border-radius: 12px;
    margin-bottom: 12px;
  }

  .scene-preview-placeholder {
    width: 100%;
    height: 300px;
    background: #f3f4f6;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    margin-bottom: 12px;
  }

  /* P3-1 FIX: Loading indicator styles */
  .preview-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .preview-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #8b5cf6;
    border-radius: 50%;
    animation: preview-spin 0.8s linear infinite;
  }

  @keyframes preview-spin {
    to { transform: rotate(360deg); }
  }

  .preview-loading-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
  }

  .preview-loading-hint {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .scene-action-token {
    font-size: 0.875rem;
    color: #374151;
    margin: 0;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
    text-align: left;
  }

  .enrichment-trigger {
    width: 100%;
    padding: 12px 16px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 1px solid #f59e0b;
    border-radius: 8px;
    font-size: 0.875rem;
    color: #92400e;
    cursor: pointer;
    margin-bottom: 16px;
    transition: all 0.2s;
  }

  .enrichment-trigger:hover {
    background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
  }

  .enrichment-section {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .enrichment-commentary {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .director-avatar-small {
    font-size: 24px;
  }

  .enrichment-commentary p {
    margin: 0;
    font-size: 0.875rem;
    color: #78350f;
    line-height: 1.5;
  }

  .enrichment-question {
    margin-bottom: 12px;
    padding: 12px;
    background: white;
    border-radius: 8px;
  }

  .enrichment-question p {
    margin: 0;
    font-weight: 600;
    color: #1f2937;
  }

  .enrichment-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .enrichment-chip {
    padding: 6px 12px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #92400e;
    background: white;
    border: 1px solid #fcd34d;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .enrichment-chip:hover {
    background: #fef3c7;
    border-color: #f59e0b;
  }

  .enrichment-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    font-size: 0.875rem;
    font-family: inherit;
    resize: none;
    margin-bottom: 12px;
  }

  .enrichment-input:focus {
    outline: none;
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  }

  .enrichment-actions {
    display: flex;
    gap: 8px;
  }

  .enrichment-submit {
    flex: 1;
    padding: 10px 16px;
    background: #f59e0b;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .enrichment-submit:hover:not(:disabled) {
    background: #d97706;
  }

  .enrichment-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .enrichment-skip {
    padding: 10px 16px;
    background: transparent;
    color: #92400e;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .enrichment-skip:hover {
    background: white;
  }

  .scene-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .action-button {
    padding: 14px 28px;
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    z-index: 10;
  }

  .action-button:active {
    transform: scale(0.98);
  }

  .action-button.approve {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
  }

  .action-button.approve:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
    transform: translateY(-2px);
  }

  .action-button.approve-all {
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);
  }

  .action-button.approve-all:hover {
    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
    transform: translateY(-2px);
  }

  .action-button.refine {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }

  .action-button.refine:hover:not(:disabled) {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    transform: translateY(-2px);
  }

  .action-button.refine:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-button.regenerate {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid #ef4444;
  }

  .action-button.regenerate:hover {
    background: #ef4444;
    color: white;
  }

  .refine-details {
    margin-top: 8px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
  }

  .refine-summary {
    padding: 12px 16px;
    background: #f9fafb;
    cursor: pointer;
    font-size: 0.875rem;
    color: #6b7280;
    user-select: none;
  }

  .refine-summary:hover {
    background: #f3f4f6;
  }

  .refine-section {
    display: flex;
    gap: 8px;
    padding: 16px;
    background: white;
  }

  .feedback-input {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .feedback-input:focus {
    outline: none;
    border-color: #f59e0b;
  }
`;

export { DirectorSceneApproval };
