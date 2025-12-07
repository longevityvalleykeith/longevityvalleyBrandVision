/**
 * Phase 4 - Director Grid Component
 *
 * Displays all 4 Director pitches in a responsive grid layout.
 * Handles selection state and loading states.
 *
 * @module client/components/lounge/DirectorGrid
 * @version 1.0.0
 */

import React from 'react';
import { DirectorCard, type DirectorPitchData } from './DirectorCard';

// =============================================================================
// TYPES
// =============================================================================

interface DirectorGridProps {
  directors: DirectorPitchData[];
  onSelect: (directorId: string) => void;
  selectedId?: string;
  isLoading?: boolean;
  loadingId?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DirectorGrid({
  directors,
  onSelect,
  selectedId,
  isLoading = false,
  loadingId,
}: DirectorGridProps): JSX.Element {
  return (
    <div className="director-grid-container">
      <div className="grid-header">
        <h2 className="grid-title">Choose Your Director</h2>
        <p className="grid-subtitle">
          Each director interprets your brand through a unique lens.
          Select the vision that resonates with your goals.
        </p>
      </div>

      <div className="director-grid">
        {directors.map((director) => (
          <DirectorCard
            key={director.id}
            director={director}
            onSelect={onSelect}
            isSelected={selectedId === director.id}
            isLoading={loadingId === director.id}
          />
        ))}
      </div>

      {directors.length === 0 && !isLoading && (
        <div className="empty-state">
          <span className="empty-icon">🎬</span>
          <h3>No Pitches Yet</h3>
          <p>Upload a brand asset to receive Director interpretations.</p>
        </div>
      )}

      <style>{gridStyles}</style>
    </div>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

export function DirectorGridSkeleton(): JSX.Element {
  return (
    <div className="director-grid-container">
      <div className="grid-header">
        <div className="skeleton-title" />
        <div className="skeleton-subtitle" />
      </div>

      <div className="director-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-header" />
            <div className="skeleton-quote" />
            <div className="skeleton-pitch" />
            <div className="skeleton-stats" />
            <div className="skeleton-button" />
          </div>
        ))}
      </div>

      <div className="analyzing-message">
        <span className="analyzing-spinner" />
        <span>The Directors are reviewing your asset...</span>
      </div>

      <style>{gridStyles}</style>
      <style>{skeletonStyles}</style>
    </div>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const gridStyles = `
  .director-grid-container {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
  }

  .grid-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .grid-title {
    font-size: 2rem;
    font-weight: 700;
    color: white;
    margin: 0 0 12px;
  }

  .grid-subtitle {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.6);
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.5;
  }

  .director-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 24px;
  }

  @media (min-width: 640px) {
    .director-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .director-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .empty-state {
    text-align: center;
    padding: 64px 24px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 16px;
    border: 2px dashed rgba(255, 255, 255, 0.1);
  }

  .empty-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 16px;
  }

  .empty-state h3 {
    margin: 0 0 8px;
    color: white;
    font-size: 1.25rem;
  }

  .empty-state p {
    margin: 0;
    color: rgba(255, 255, 255, 0.5);
  }

  .analyzing-message {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 32px;
    padding: 16px;
    background: rgba(139, 92, 246, 0.1);
    border-radius: 8px;
    color: #a78bfa;
    font-weight: 500;
  }

  .analyzing-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(139, 92, 246, 0.3);
    border-top-color: #a78bfa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const skeletonStyles = `
  .skeleton-card {
    background: #0f0f0f;
    border-radius: 16px;
    overflow: hidden;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .skeleton-header {
    height: 80px;
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  }

  .skeleton-quote {
    height: 60px;
    margin: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .skeleton-pitch {
    height: 120px;
    margin: 0 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
  }

  .skeleton-stats {
    height: 80px;
    margin: 16px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
  }

  .skeleton-button {
    height: 52px;
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  }

  .skeleton-title {
    height: 40px;
    width: 300px;
    margin: 0 auto 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }

  .skeleton-subtitle {
    height: 24px;
    width: 400px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
`;

export default DirectorGrid;
