/**
 * Phase 3C - Director Mode Component
 * 
 * Main UI component for the Video Director Mode.
 * Implements the "Traffic Light" system for scene approval.
 * 
 * @module client/components/DirectorMode
 * @version 3.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import type {
  DirectorState,
  VideoScene,
  TrafficLightStatus,
  RefineAction,
} from '@/types';
import { DirectorErrorBoundary } from './ErrorBoundary';

// =============================================================================
// TYPES
// =============================================================================

interface DirectorModeProps {
  jobId: number;
  initialState?: DirectorState;
  onInitDirector: (jobId: number, forceRemaster: boolean) => Promise<DirectorState>;
  onRefineStoryboard: (jobId: number, refinements: RefineAction[]) => Promise<DirectorState>;
  onApproveProduction: (jobId: number, sceneIds: string[]) => Promise<DirectorState>;
  onApproveScene: (jobId: number, sceneId: string) => Promise<DirectorState>;
}

interface SceneCardProps {
  scene: VideoScene;
  onApprove: () => void;
  onRefine: (status: 'YELLOW' | 'RED', feedback?: string) => void;
  disabled?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DirectorMode({
  jobId,
  initialState,
  onInitDirector,
  onRefineStoryboard,
  onApproveProduction,
  onApproveScene,
}: DirectorModeProps): JSX.Element {
  const [state, setState] = useState<DirectorState | null>(initialState || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRefinements, setPendingRefinements] = useState<RefineAction[]>([]);

  // Initialize director mode
  const handleInit = useCallback(async (forceRemaster = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await onInitDirector(jobId, forceRemaster);
      setState(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize director');
    } finally {
      setLoading(false);
    }
  }, [jobId, onInitDirector]);

  // Handle scene approval
  const handleApproveScene = useCallback(async (sceneId: string) => {
    if (!state) return;
    setLoading(true);
    try {
      const result = await onApproveScene(jobId, sceneId);
      setState(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve scene');
    } finally {
      setLoading(false);
    }
  }, [jobId, state, onApproveScene]);

  // Queue refinement for a scene
  const handleQueueRefinement = useCallback((sceneId: string, status: 'YELLOW' | 'RED', feedback?: string) => {
    setPendingRefinements(prev => {
      // Remove existing refinement for this scene
      const filtered = prev.filter(r => r.sceneId !== sceneId);
      return [...filtered, { sceneId, status, feedback }];
    });
  }, []);

  // Submit all pending refinements
  const handleSubmitRefinements = useCallback(async () => {
    if (pendingRefinements.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await onRefineStoryboard(jobId, pendingRefinements);
      setState(result);
      setPendingRefinements([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine storyboard');
    } finally {
      setLoading(false);
    }
  }, [jobId, pendingRefinements, onRefineStoryboard]);

  // Approve all scenes for production
  const handleApproveProduction = useCallback(async () => {
    if (!state) return;
    const greenScenes = state.scenes.filter(s => s.status === 'GREEN');
    if (greenScenes.length === 0) {
      setError('At least one scene must be approved (GREEN) before production');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await onApproveProduction(jobId, greenScenes.map(s => s.id));
      setState(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start production');
    } finally {
      setLoading(false);
    }
  }, [jobId, state, onApproveProduction]);

  // Computed values
  const allScenesApproved = useMemo(() => 
    state?.scenes.every(s => s.status === 'GREEN') || false,
    [state?.scenes]
  );

  const hasPendingRefinements = pendingRefinements.length > 0;

  // Render based on state
  if (!state) {
    return (
      <InitializationView
        onInit={handleInit}
        loading={loading}
        error={error}
      />
    );
  }

  if (state.stage === 'QUALITY_FAILED') {
    return (
      <QualityFailedView
        qualityScore={state.quality_score}
        onRemaster={() => handleInit(true)}
        loading={loading}
        error={error}
      />
    );
  }

  if (state.stage === 'RENDERING') {
    return <RenderingView state={state} />;
  }

  if (state.stage === 'COMPLETED') {
    return <CompletedView state={state} />;
  }

  // STORYBOARD_REVIEW stage
  return (
    <DirectorErrorBoundary jobId={jobId}>
      <div className="director-mode">
        <DirectorHeader 
          state={state} 
          hasPendingRefinements={hasPendingRefinements}
        />

        {error && (
          <div className="director-error-banner">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className="scene-grid">
          {state.scenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              onApprove={() => handleApproveScene(scene.id)}
              onRefine={(status, feedback) => handleQueueRefinement(scene.id, status, feedback)}
              disabled={loading}
            />
          ))}
        </div>

        <DirectorActions
          allApproved={allScenesApproved}
          hasPendingRefinements={hasPendingRefinements}
          loading={loading}
          onSubmitRefinements={handleSubmitRefinements}
          onApproveProduction={handleApproveProduction}
          pendingCount={pendingRefinements.length}
        />

        <style>{directorStyles}</style>
      </div>
    </DirectorErrorBoundary>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function InitializationView({
  onInit,
  loading,
  error,
}: {
  onInit: (forceRemaster: boolean) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="director-init">
      <h2>🎬 Video Director Mode</h2>
      <p>Transform your brand analysis into a stunning video advertisement.</p>
      {error && <p className="error">{error}</p>}
      <button 
        onClick={() => onInit(false)} 
        disabled={loading}
        className="init-button"
      >
        {loading ? 'Initializing...' : 'Start Director Mode'}
      </button>
      <style>{`
        .director-init {
          text-align: center;
          padding: 48px;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          border-radius: 16px;
          color: white;
        }
        .director-init h2 {
          font-size: 2rem;
          margin: 0 0 12px;
        }
        .director-init p {
          opacity: 0.8;
          margin: 0 0 24px;
        }
        .director-init .error {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.2);
          padding: 8px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .init-button {
          padding: 14px 32px;
          font-size: 1.1rem;
          font-weight: 600;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .init-button:hover:not(:disabled) {
          background: #7c3aed;
          transform: translateY(-2px);
        }
        .init-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function QualityFailedView({
  qualityScore,
  onRemaster,
  loading,
  error,
}: {
  qualityScore: number;
  onRemaster: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="quality-failed">
      <div className="score-badge">
        <span className="score">{qualityScore.toFixed(1)}</span>
        <span className="label">Quality Score</span>
      </div>
      <h2>Image Quality Below Threshold</h2>
      <p>
        Your image scored {qualityScore.toFixed(1)}/10. For best video results, 
        we recommend remastering with AI enhancement.
      </p>
      {error && <p className="error">{error}</p>}
      <button 
        onClick={onRemaster} 
        disabled={loading}
        className="remaster-button"
      >
        {loading ? 'Remastering...' : '✨ Remaster with AI'}
      </button>
      <style>{`
        .quality-failed {
          text-align: center;
          padding: 48px;
          background: linear-gradient(135deg, #7c2d12 0%, #9a3412 100%);
          border-radius: 16px;
          color: white;
        }
        .score-badge {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          background: rgba(0,0,0,0.3);
          padding: 16px 32px;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .score-badge .score {
          font-size: 3rem;
          font-weight: 700;
          color: #fbbf24;
        }
        .score-badge .label {
          font-size: 0.875rem;
          opacity: 0.8;
        }
        .quality-failed h2 {
          margin: 0 0 12px;
        }
        .quality-failed p {
          opacity: 0.9;
          margin: 0 0 24px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        .remaster-button {
          padding: 14px 32px;
          font-size: 1.1rem;
          font-weight: 600;
          background: #f59e0b;
          color: #1f2937;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .remaster-button:hover:not(:disabled) {
          background: #fbbf24;
        }
      `}</style>
    </div>
  );
}

function RenderingView({ state }: { state: DirectorState }) {
  return (
    <div className="rendering-view">
      <div className="spinner" />
      <h2>Creating Your Video</h2>
      <p>This may take a few minutes...</p>
      <div className="progress-info">
        <span>{state.scenes.length} scenes</span>
        <span>•</span>
        <span>Est. {state.scenes.length * 15}s</span>
      </div>
      <style>{`
        .rendering-view {
          text-align: center;
          padding: 64px;
          background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
          border-radius: 16px;
          color: white;
        }
        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 24px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .progress-info {
          display: flex;
          gap: 12px;
          justify-content: center;
          opacity: 0.8;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}

function CompletedView({ state }: { state: DirectorState }) {
  return (
    <div className="completed-view">
      <div className="success-icon">✓</div>
      <h2>Video Complete!</h2>
      <div className="video-grid">
        {state.scenes.map((scene) => (
          <div key={scene.id} className="video-preview">
            {scene.video_url ? (
              <video src={scene.video_url} controls />
            ) : (
              <img src={scene.preview_url || ''} alt={`Scene ${scene.sequence_index}`} />
            )}
          </div>
        ))}
      </div>
      <style>{`
        .completed-view {
          text-align: center;
          padding: 48px;
          background: linear-gradient(135deg, #065f46 0%, #10b981 100%);
          border-radius: 16px;
          color: white;
        }
        .success-icon {
          width: 64px;
          height: 64px;
          background: white;
          color: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: bold;
          margin: 0 auto 24px;
        }
        .video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }
        .video-preview video,
        .video-preview img {
          width: 100%;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

function DirectorHeader({ 
  state, 
  hasPendingRefinements 
}: { 
  state: DirectorState;
  hasPendingRefinements: boolean;
}) {
  const greenCount = state.scenes.filter(s => s.status === 'GREEN').length;
  
  return (
    <div className="director-header">
      <div className="header-info">
        <h2>🎬 Storyboard Review</h2>
        <p>
          {state.is_remastered && '✨ Remastered • '}
          Style: {state.selected_style_id}
        </p>
      </div>
      <div className="header-stats">
        <div className="stat">
          <span className="stat-value">{greenCount}/{state.scenes.length}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat">
          <span className="stat-value">{state.cost_estimate}</span>
          <span className="stat-label">Credits</span>
        </div>
        {hasPendingRefinements && (
          <div className="stat pending">
            <span className="stat-value">●</span>
            <span className="stat-label">Pending</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SceneCard({ scene, onApprove, onRefine, disabled }: SceneCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleYellow = () => {
    setShowFeedback(true);
  };

  const handleSubmitFeedback = () => {
    if (feedback.trim()) {
      onRefine('YELLOW', feedback);
      setShowFeedback(false);
      setFeedback('');
    }
  };

  const handleRed = () => {
    onRefine('RED');
  };

  const statusColors: Record<TrafficLightStatus, string> = {
    PENDING: '#6b7280',
    GREEN: '#10b981',
    YELLOW: '#f59e0b',
    RED: '#ef4444',
  };

  return (
    <div className="scene-card" data-status={scene.status}>
      <div className="scene-header">
        <span className="scene-number">Scene {scene.sequence_index}</span>
        <span 
          className="status-badge" 
          style={{ background: statusColors[scene.status] }}
        >
          {scene.status}
        </span>
      </div>

      <div className="scene-preview">
        {scene.preview_url ? (
          <img src={scene.preview_url} alt={`Scene ${scene.sequence_index} preview`} />
        ) : (
          <div className="placeholder">Generating preview...</div>
        )}
      </div>

      <div className="scene-info">
        <p className="action-token">{scene.action_token}</p>
        {scene.user_feedback && (
          <p className="feedback">💬 {scene.user_feedback}</p>
        )}
      </div>

      {showFeedback ? (
        <div className="feedback-input">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe the changes you'd like..."
            maxLength={500}
          />
          <div className="feedback-actions">
            <button onClick={() => setShowFeedback(false)}>Cancel</button>
            <button onClick={handleSubmitFeedback} className="submit">
              Submit Feedback
            </button>
          </div>
        </div>
      ) : (
        <div className="traffic-lights">
          <button 
            className="light green" 
            onClick={onApprove}
            disabled={disabled || scene.status === 'GREEN'}
            title="Approve"
          >
            ✓
          </button>
          <button 
            className="light yellow" 
            onClick={handleYellow}
            disabled={disabled}
            title="Request changes"
          >
            ✎
          </button>
          <button 
            className="light red" 
            onClick={handleRed}
            disabled={disabled}
            title="Regenerate"
          >
            ↻
          </button>
        </div>
      )}
    </div>
  );
}

function DirectorActions({
  allApproved,
  hasPendingRefinements,
  loading,
  onSubmitRefinements,
  onApproveProduction,
  pendingCount,
}: {
  allApproved: boolean;
  hasPendingRefinements: boolean;
  loading: boolean;
  onSubmitRefinements: () => void;
  onApproveProduction: () => void;
  pendingCount: number;
}) {
  return (
    <div className="director-actions">
      {hasPendingRefinements && (
        <button 
          onClick={onSubmitRefinements}
          disabled={loading}
          className="action-button secondary"
        >
          Apply {pendingCount} Change{pendingCount > 1 ? 's' : ''}
        </button>
      )}
      <button
        onClick={onApproveProduction}
        disabled={loading || !allApproved}
        className="action-button primary"
      >
        {loading ? 'Processing...' : '🎬 Start Production'}
      </button>
    </div>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const directorStyles = `
  .director-mode {
    font-family: system-ui, -apple-system, sans-serif;
  }

  .director-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: #1f2937;
    color: white;
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .header-info h2 {
    margin: 0 0 4px;
    font-size: 1.5rem;
  }

  .header-info p {
    margin: 0;
    opacity: 0.7;
    font-size: 0.875rem;
  }

  .header-stats {
    display: flex;
    gap: 24px;
  }

  .stat {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .stat-label {
    font-size: 0.75rem;
    opacity: 0.7;
    text-transform: uppercase;
  }

  .stat.pending .stat-value {
    color: #f59e0b;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .director-error-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    border-radius: 8px;
    margin-bottom: 24px;
  }

  .director-error-banner button {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    opacity: 0.6;
  }

  .scene-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 24px;
  }

  .scene-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .scene-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 12px rgba(0,0,0,0.15);
  }

  .scene-card[data-status="GREEN"] {
    border: 2px solid #10b981;
  }

  .scene-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .scene-number {
    font-weight: 600;
    color: #374151;
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
  }

  .scene-preview {
    aspect-ratio: 16/9;
    background: #e5e7eb;
    position: relative;
  }

  .scene-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .scene-preview .placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
  }

  .scene-info {
    padding: 16px;
  }

  .action-token {
    margin: 0;
    font-size: 0.875rem;
    color: #4b5563;
    line-height: 1.5;
  }

  .feedback {
    margin: 8px 0 0;
    font-size: 0.75rem;
    color: #f59e0b;
    font-style: italic;
  }

  .traffic-lights {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 16px;
    border-top: 1px solid #e5e7eb;
  }

  .light {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .light:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .light.green {
    background: #10b981;
  }

  .light.green:hover:not(:disabled) {
    background: #059669;
    transform: scale(1.1);
  }

  .light.yellow {
    background: #f59e0b;
  }

  .light.yellow:hover:not(:disabled) {
    background: #d97706;
    transform: scale(1.1);
  }

  .light.red {
    background: #ef4444;
  }

  .light.red:hover:not(:disabled) {
    background: #dc2626;
    transform: scale(1.1);
  }

  .feedback-input {
    padding: 16px;
    border-top: 1px solid #e5e7eb;
  }

  .feedback-input textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    resize: none;
    min-height: 80px;
    font-family: inherit;
  }

  .feedback-input textarea:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  .feedback-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }

  .feedback-actions button {
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    border: none;
  }

  .feedback-actions button:first-child {
    background: #f3f4f6;
    color: #374151;
  }

  .feedback-actions button.submit {
    background: #f59e0b;
    color: white;
  }

  .director-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    padding: 24px;
    background: #f9fafb;
    border-radius: 12px;
  }

  .action-button {
    padding: 14px 32px;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .action-button.primary {
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    color: white;
  }

  .action-button.primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }

  .action-button.primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-button.secondary {
    background: white;
    color: #374151;
    border: 2px solid #d1d5db;
  }

  .action-button.secondary:hover:not(:disabled) {
    border-color: #8b5cf6;
    color: #8b5cf6;
  }
`;

export default DirectorMode;
