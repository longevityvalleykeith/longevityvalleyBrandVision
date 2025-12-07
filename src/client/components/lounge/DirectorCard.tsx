/**
 * Phase 4 - Director Card Component
 *
 * Displays a Director's pitch with scores, commentary, and engine recommendation.
 * Part of "The Director's Lounge" UI where the Producer (user) hires talent.
 *
 * @module client/components/lounge/DirectorCard
 * @version 1.0.0
 */

import React, { useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface DirectorPitchData {
  id: string; // 'newtonian', 'visionary', 'minimalist', 'provocateur'
  name: string;
  avatar: string;
  archetype: string;
  quote: string;
  stats: {
    physics: number;
    vibe: number;
    logic: number;
  };
  engine: 'kling' | 'luma';
  riskLevel: 'Safe' | 'Balanced' | 'Experimental';
  commentary: {
    vision: string;
    safety: string;
    magic: string;
  };
}

interface DirectorCardProps {
  director: DirectorPitchData;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  isSelected?: boolean;
}

// =============================================================================
// THEME CONFIGURATION
// =============================================================================

const DIRECTOR_THEMES: Record<string, {
  gradient: string;
  border: string;
  glow: string;
  accent: string;
}> = {
  newtonian: {
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    border: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.3)',
    accent: '#60a5fa',
  },
  visionary: {
    gradient: 'linear-gradient(135deg, #581c87 0%, #a855f7 100%)',
    border: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.3)',
    accent: '#c084fc',
  },
  minimalist: {
    gradient: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)',
    border: '#6b7280',
    glow: 'rgba(107, 114, 128, 0.3)',
    accent: '#9ca3af',
  },
  provocateur: {
    gradient: 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)',
    border: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.3)',
    accent: '#f87171',
  },
};

const ENGINE_CONFIG: Record<string, { label: string; color: string }> = {
  kling: { label: 'KLING AI', color: '#10b981' },
  luma: { label: 'LUMA', color: '#8b5cf6' },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DirectorCard({
  director,
  onSelect,
  isLoading = false,
  isSelected = false,
}: DirectorCardProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const theme = DIRECTOR_THEMES[director.id] ?? DIRECTOR_THEMES['newtonian']!;
  const engine = ENGINE_CONFIG[director.engine] ?? ENGINE_CONFIG['kling']!

  const maxScore = Math.max(director.stats.physics, director.stats.vibe, director.stats.logic);
  const dominantTrait =
    director.stats.physics === maxScore ? 'Physics' :
    director.stats.vibe === maxScore ? 'Vibe' : 'Logic';

  return (
    <div
      className={`director-card ${isSelected ? 'selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        '--theme-gradient': theme.gradient,
        '--theme-border': theme.border,
        '--theme-glow': theme.glow,
        '--theme-accent': theme.accent,
        '--engine-color': engine.color,
      } as React.CSSProperties}
    >
      {/* Header with Avatar and Name */}
      <div className="card-header">
        <div className="director-identity">
          <span className="avatar">{director.avatar}</span>
          <div className="name-block">
            <h3 className="director-name">{director.name}</h3>
            <span className="archetype">{director.archetype}</span>
          </div>
        </div>
        <div className="badges">
          <span className="engine-badge">{engine.label}</span>
          <span className={`risk-badge ${director.riskLevel.toLowerCase()}`}>
            {director.riskLevel}
          </span>
        </div>
      </div>

      {/* Quote */}
      <div className="quote-section">
        <span className="quote-mark">"</span>
        <p className="quote-text">{director.quote}</p>
      </div>

      {/* The Pitch (3-Beat Pulse) */}
      <div className="pitch-section">
        <div className="pitch-item">
          <span className="pitch-icon">👀</span>
          <div className="pitch-content">
            <span className="pitch-label">Vision</span>
            <p className="pitch-text">{director.commentary.vision}</p>
          </div>
        </div>
        <div className="pitch-item">
          <span className="pitch-icon">🛡️</span>
          <div className="pitch-content">
            <span className="pitch-label">Safety</span>
            <p className="pitch-text">{director.commentary.safety}</p>
          </div>
        </div>
        <div className="pitch-item">
          <span className="pitch-icon">✨</span>
          <div className="pitch-content">
            <span className="pitch-label">Magic</span>
            <p className="pitch-text">{director.commentary.magic}</p>
          </div>
        </div>
      </div>

      {/* Stats Bars */}
      <div className="stats-section">
        <StatBar label="Physics" value={director.stats.physics} icon="⚡" />
        <StatBar label="Vibe" value={director.stats.vibe} icon="🎨" />
        <StatBar label="Logic" value={director.stats.logic} icon="🧠" />
      </div>

      {/* Dominant Trait Badge */}
      <div className="dominant-trait">
        <span>Specializes in</span>
        <strong>{dominantTrait}</strong>
      </div>

      {/* CTA Button */}
      <button
        className="greenlight-button"
        onClick={() => onSelect(director.id)}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="loading-spinner" />
        ) : (
          <>
            <span className="button-icon">🎬</span>
            <span>GREENLIGHT THIS DIRECTOR</span>
          </>
        )}
      </button>

      <style>{cardStyles}</style>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatBar({ label, value, icon }: { label: string; value: number; icon: string }) {
  const percentage = (value / 10) * 100;

  return (
    <div className="stat-bar">
      <div className="stat-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value.toFixed(1)}</span>
      </div>
      <div className="stat-track">
        <div
          className="stat-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const cardStyles = `
  .director-card {
    position: relative;
    background: #0f0f0f;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .director-card:hover {
    transform: translateY(-8px);
    border-color: var(--theme-border);
    box-shadow: 0 20px 40px var(--theme-glow);
  }

  .director-card.selected {
    border-color: var(--theme-border);
    box-shadow: 0 0 0 4px var(--theme-glow);
  }

  /* Header */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 20px 16px;
    background: var(--theme-gradient);
  }

  .director-identity {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar {
    font-size: 2.5rem;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  }

  .name-block {
    display: flex;
    flex-direction: column;
  }

  .director-name {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
  }

  .archetype {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.7);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badges {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-end;
  }

  .engine-badge {
    padding: 4px 10px;
    background: var(--engine-color);
    color: white;
    font-size: 0.65rem;
    font-weight: 700;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }

  .risk-badge {
    padding: 3px 8px;
    font-size: 0.6rem;
    font-weight: 600;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .risk-badge.safe {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }

  .risk-badge.balanced {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }

  .risk-badge.experimental {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }

  /* Quote */
  .quote-section {
    position: relative;
    padding: 16px 20px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .quote-mark {
    position: absolute;
    top: 8px;
    left: 12px;
    font-size: 2rem;
    color: var(--theme-accent);
    opacity: 0.3;
    font-family: Georgia, serif;
  }

  .quote-text {
    margin: 0;
    padding-left: 24px;
    font-style: italic;
    color: rgba(255,255,255,0.8);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  /* Pitch Section */
  .pitch-section {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pitch-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .pitch-icon {
    font-size: 1rem;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .pitch-content {
    flex: 1;
    min-width: 0;
  }

  .pitch-label {
    display: block;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--theme-accent);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  .pitch-text {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.85);
    line-height: 1.4;
  }

  /* Stats */
  .stats-section {
    padding: 16px 20px;
    background: rgba(255,255,255,0.02);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .stat-bar {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7rem;
  }

  .stat-icon {
    font-size: 0.8rem;
  }

  .stat-label {
    color: rgba(255,255,255,0.6);
    flex: 1;
  }

  .stat-value {
    color: white;
    font-weight: 600;
    font-family: 'SF Mono', Monaco, monospace;
  }

  .stat-track {
    height: 4px;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .stat-fill {
    height: 100%;
    background: var(--theme-accent);
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  /* Dominant Trait */
  .dominant-trait {
    padding: 10px 20px;
    text-align: center;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .dominant-trait strong {
    color: var(--theme-accent);
    margin-left: 4px;
  }

  /* CTA Button */
  .greenlight-button {
    width: 100%;
    padding: 16px 20px;
    background: var(--theme-gradient);
    border: none;
    color: white;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .greenlight-button:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .greenlight-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .button-icon {
    font-size: 1rem;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default DirectorCard;
