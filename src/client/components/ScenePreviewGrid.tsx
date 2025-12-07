/**
 * Phase 3 - Scene Preview Grid Component
 *
 * Grid layout for displaying multiple scene preview cards.
 * Manages batch actions and provides summary statistics.
 *
 * @module client/components/ScenePreviewGrid
 * @version 1.0.0
 */

import { useMemo } from 'react';
import ScenePreviewCard, { type SceneData } from './ScenePreviewCard';
import type { TrafficLightStatus } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

interface ScenePreviewGridProps {
  scenes: SceneData[];
  onApprove: (sceneId: string) => void;
  onRefine: (sceneId: string, status: 'YELLOW' | 'RED', feedback?: string) => void;
  onApproveAll?: () => void;
  disabled?: boolean;
  showPreview?: boolean;
  title?: string;
  subtitle?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ScenePreviewGrid({
  scenes,
  onApprove,
  onRefine,
  onApproveAll,
  disabled = false,
  showPreview = true,
  title = 'Scene Storyboard',
  subtitle = 'Review and approve each scene for your video',
}: ScenePreviewGridProps) {
  // Calculate stats
  const stats = useMemo(() => {
    const counts: Record<TrafficLightStatus, number> = {
      PENDING: 0,
      GREEN: 0,
      YELLOW: 0,
      RED: 0,
    };
    scenes.forEach((scene) => {
      counts[scene.status]++;
    });
    return {
      total: scenes.length,
      approved: counts.GREEN,
      pending: counts.PENDING,
      needsChanges: counts.YELLOW + counts.RED,
      allApproved: counts.GREEN === scenes.length,
    };
  }, [scenes]);

  return (
    <div className="scene-preview-grid-container">
      {/* Header */}
      <div className="grid-header">
        <div className="header-info">
          <h2 className="grid-title">{title}</h2>
          <p className="grid-subtitle">{subtitle}</p>
        </div>

        {/* Stats Summary */}
        <div className="stats-summary">
          <div className="stat approved">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat pending">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat changes">
            <span className="stat-value">{stats.needsChanges}</span>
            <span className="stat-label">Changes</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(stats.approved / stats.total) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          {stats.approved} of {stats.total} scenes approved
        </span>
      </div>

      {/* Scene Grid */}
      <div className="scene-grid">
        {scenes.map((scene) => (
          <ScenePreviewCard
            key={scene.id}
            scene={scene}
            onApprove={onApprove}
            onRefine={onRefine}
            disabled={disabled}
            showPreview={showPreview}
          />
        ))}
      </div>

      {/* Empty State */}
      {scenes.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🎬</span>
          <h3>No Scenes Yet</h3>
          <p>Upload a brand asset to generate your storyboard</p>
        </div>
      )}

      {/* Batch Actions */}
      {scenes.length > 0 && (
        <div className="batch-actions">
          {onApproveAll && !stats.allApproved && (
            <button
              type="button"
              onClick={onApproveAll}
              disabled={disabled}
              className="approve-all-btn"
            >
              <span className="btn-icon">✓</span>
              Approve All Scenes
            </button>
          )}

          {stats.allApproved && (
            <div className="all-approved-badge">
              <span className="badge-icon">🎉</span>
              <span>All scenes approved! Ready for production.</span>
            </div>
          )}
        </div>
      )}

      <style>{gridStyles}</style>
    </div>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const gridStyles = `
  .scene-preview-grid-container {
    width: 100%;
  }

  /* Header */
  .grid-header {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  @media (min-width: 768px) {
    .grid-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
    }
  }

  .header-info {
    flex: 1;
  }

  .grid-title {
    margin: 0 0 4px;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
  }

  .grid-subtitle {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
  }

  /* Stats Summary */
  .stats-summary {
    display: flex;
    gap: 16px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 16px;
    background: #f9fafb;
    border-radius: 8px;
    min-width: 70px;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .stat-label {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
  }

  .stat.approved .stat-value {
    color: #10b981;
  }

  .stat.pending .stat-value {
    color: #6b7280;
  }

  .stat.changes .stat-value {
    color: #f59e0b;
  }

  /* Progress Bar */
  .progress-bar-container {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 0.75rem;
    color: #6b7280;
    white-space: nowrap;
  }

  /* Scene Grid */
  .scene-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }

  @media (min-width: 640px) {
    .scene-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .scene-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 64px 24px;
    background: #f9fafb;
    border-radius: 16px;
    border: 2px dashed #d1d5db;
  }

  .empty-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 16px;
  }

  .empty-state h3 {
    margin: 0 0 8px;
    font-size: 1.25rem;
    color: #1f2937;
  }

  .empty-state p {
    margin: 0;
    color: #6b7280;
  }

  /* Batch Actions */
  .batch-actions {
    display: flex;
    justify-content: center;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
  }

  .approve-all-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .approve-all-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  .approve-all-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .btn-icon {
    font-size: 1.25rem;
  }

  .all-approved-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    border-radius: 999px;
    font-weight: 600;
  }

  .badge-icon {
    font-size: 1.25rem;
  }
`;

export { ScenePreviewGrid };
