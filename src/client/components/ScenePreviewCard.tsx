/**
 * Phase 3 - Scene Preview Card Component
 *
 * Card UI for displaying scene previews with Traffic Light indicators.
 * Enables user-in-the-loop decision making for scene approval/refinement.
 *
 * Traffic Light System:
 * - GREEN: Approve scene as-is
 * - YELLOW: Request changes with feedback
 * - RED: Regenerate scene completely
 *
 * @module client/components/ScenePreviewCard
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import type { TrafficLightStatus } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface SceneData {
  id: string;
  sequenceIndex: number;
  title?: string;
  description: string;
  previewUrl?: string;
  status: TrafficLightStatus;
  userFeedback?: string | null;
}

interface ScenePreviewCardProps {
  scene: SceneData;
  onApprove: (sceneId: string) => void;
  onRefine: (sceneId: string, status: 'YELLOW' | 'RED', feedback?: string) => void;
  disabled?: boolean;
  showPreview?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_CONFIG: Record<TrafficLightStatus, { color: string; bgColor: string; label: string }> = {
  PENDING: { color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)', label: 'Pending' },
  GREEN: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', label: 'Approved' },
  YELLOW: { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', label: 'Needs Changes' },
  RED: { color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', label: 'Regenerate' },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ScenePreviewCard({
  scene,
  onApprove,
  onRefine,
  disabled = false,
  showPreview = true,
}: ScenePreviewCardProps) {
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedback, setFeedback] = useState('');

  const statusConfig = STATUS_CONFIG[scene.status];

  /**
   * Handle GREEN (Approve) action
   */
  const handleApprove = useCallback(() => {
    if (disabled || scene.status === 'GREEN') return;
    onApprove(scene.id);
  }, [disabled, scene.id, scene.status, onApprove]);

  /**
   * Handle YELLOW (Refine with feedback) action
   */
  const handleYellow = useCallback(() => {
    if (disabled) return;
    setShowFeedbackInput(true);
  }, [disabled]);

  /**
   * Submit feedback for YELLOW refinement
   */
  const handleSubmitFeedback = useCallback(() => {
    if (feedback.trim()) {
      onRefine(scene.id, 'YELLOW', feedback.trim());
      setShowFeedbackInput(false);
      setFeedback('');
    }
  }, [scene.id, feedback, onRefine]);

  /**
   * Cancel feedback input
   */
  const handleCancelFeedback = useCallback(() => {
    setShowFeedbackInput(false);
    setFeedback('');
  }, []);

  /**
   * Handle RED (Regenerate) action
   */
  const handleRed = useCallback(() => {
    if (disabled) return;
    onRefine(scene.id, 'RED');
  }, [disabled, scene.id, onRefine]);

  return (
    <div className="scene-preview-card" data-status={scene.status}>
      {/* Card Header */}
      <div className="card-header">
        <div className="scene-info">
          <span className="scene-number">Scene {scene.sequenceIndex}</span>
          {scene.title && <span className="scene-title">{scene.title}</span>}
        </div>
        <span
          className="status-badge"
          style={{
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.color,
            borderColor: statusConfig.color,
          }}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Preview Image/Placeholder */}
      {showPreview && (
        <div className="preview-container">
          {scene.previewUrl ? (
            <img
              src={scene.previewUrl}
              alt={`Scene ${scene.sequenceIndex} preview`}
              className="preview-image"
            />
          ) : (
            <div className="preview-placeholder">
              <span className="placeholder-icon">🎬</span>
              <span className="placeholder-text">Preview generating...</span>
            </div>
          )}
        </div>
      )}

      {/* Scene Description */}
      <div className="description-section">
        <p className="scene-description">{scene.description}</p>
        {scene.userFeedback && (
          <div className="user-feedback">
            <span className="feedback-icon">💬</span>
            <span className="feedback-text">{scene.userFeedback}</span>
          </div>
        )}
      </div>

      {/* Traffic Light Controls or Feedback Input */}
      {showFeedbackInput ? (
        <div className="feedback-input-section">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe the changes you'd like to see..."
            maxLength={500}
            className="feedback-textarea"
            autoFocus
          />
          <div className="feedback-actions">
            <button
              type="button"
              onClick={handleCancelFeedback}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitFeedback}
              disabled={!feedback.trim()}
              className="submit-btn"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      ) : (
        <div className="traffic-lights">
          <button
            type="button"
            className="traffic-light green"
            onClick={handleApprove}
            disabled={disabled || scene.status === 'GREEN'}
            title="Approve scene"
            aria-label="Approve scene"
          >
            <span className="light-icon">✓</span>
            <span className="light-label">Approve</span>
          </button>

          <button
            type="button"
            className="traffic-light yellow"
            onClick={handleYellow}
            disabled={disabled}
            title="Request changes"
            aria-label="Request changes with feedback"
          >
            <span className="light-icon">✎</span>
            <span className="light-label">Refine</span>
          </button>

          <button
            type="button"
            className="traffic-light red"
            onClick={handleRed}
            disabled={disabled}
            title="Regenerate scene"
            aria-label="Regenerate scene completely"
          >
            <span className="light-icon">↻</span>
            <span className="light-label">Redo</span>
          </button>
        </div>
      )}

      <style>{cardStyles}</style>
    </div>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const cardStyles = `
  .scene-preview-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    transition: transform 0.2s, box-shadow 0.2s;
    border: 2px solid transparent;
  }

  .scene-preview-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  .scene-preview-card[data-status="GREEN"] {
    border-color: #10b981;
  }

  .scene-preview-card[data-status="YELLOW"] {
    border-color: #f59e0b;
  }

  .scene-preview-card[data-status="RED"] {
    border-color: #ef4444;
  }

  /* Header */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .scene-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .scene-number {
    font-weight: 700;
    font-size: 0.875rem;
    color: #1f2937;
  }

  .scene-title {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid;
  }

  /* Preview */
  .preview-container {
    aspect-ratio: 16/9;
    background: #e5e7eb;
    position: relative;
    overflow: hidden;
  }

  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .preview-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #6b7280;
  }

  .placeholder-icon {
    font-size: 2rem;
  }

  .placeholder-text {
    font-size: 0.875rem;
  }

  /* Description */
  .description-section {
    padding: 16px;
  }

  .scene-description {
    margin: 0;
    font-size: 0.875rem;
    color: #374151;
    line-height: 1.5;
  }

  .user-feedback {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 12px;
    padding: 8px 12px;
    background: rgba(245, 158, 11, 0.1);
    border-radius: 8px;
    border-left: 3px solid #f59e0b;
  }

  .feedback-icon {
    font-size: 0.875rem;
  }

  .feedback-text {
    font-size: 0.75rem;
    color: #92400e;
    font-style: italic;
    line-height: 1.4;
  }

  /* Traffic Lights */
  .traffic-lights {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 16px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .traffic-light {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .traffic-light:hover:not(:disabled) {
    transform: scale(1.05);
  }

  .traffic-light:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .light-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    color: white;
    transition: all 0.2s;
  }

  .light-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Green Light */
  .traffic-light.green .light-icon {
    background: #10b981;
  }

  .traffic-light.green .light-label {
    color: #10b981;
  }

  .traffic-light.green:hover:not(:disabled) .light-icon {
    background: #059669;
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
  }

  /* Yellow Light */
  .traffic-light.yellow .light-icon {
    background: #f59e0b;
  }

  .traffic-light.yellow .light-label {
    color: #f59e0b;
  }

  .traffic-light.yellow:hover:not(:disabled) .light-icon {
    background: #d97706;
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
  }

  /* Red Light */
  .traffic-light.red .light-icon {
    background: #ef4444;
  }

  .traffic-light.red .light-label {
    color: #ef4444;
  }

  .traffic-light.red:hover:not(:disabled) .light-icon {
    background: #dc2626;
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
  }

  /* Feedback Input */
  .feedback-input-section {
    padding: 16px;
    border-top: 1px solid #e5e7eb;
    background: #fffbeb;
  }

  .feedback-textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.875rem;
    font-family: inherit;
    resize: none;
    min-height: 80px;
    margin-bottom: 12px;
  }

  .feedback-textarea:focus {
    outline: none;
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  }

  .feedback-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .cancel-btn,
  .submit-btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .cancel-btn {
    background: #f3f4f6;
    color: #374151;
  }

  .cancel-btn:hover {
    background: #e5e7eb;
  }

  .submit-btn {
    background: #f59e0b;
    color: white;
  }

  .submit-btn:hover:not(:disabled) {
    background: #d97706;
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export { ScenePreviewCard };
