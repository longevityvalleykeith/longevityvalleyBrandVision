/**
 * Phase 4 - The Director's Lounge
 *
 * Main UI component where the Producer (user) uploads a brand asset,
 * sees 4 distinct Director pitches, and greenlights one for production.
 *
 * State Machine:
 * - IDLE: Waiting for upload
 * - ANALYZING: "The Directors are reviewing your asset..."
 * - PITCHING: Display 4 cards with scores and commentary
 * - SELECTED: User selected a Director -> transition to Video Generation
 *
 * @module client/components/lounge/TheLounge
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { DirectorGrid, DirectorGridSkeleton } from './DirectorGrid';
import type { DirectorPitchData } from './DirectorCard';

// =============================================================================
// TYPES
// =============================================================================

type LoungeState = 'IDLE' | 'UPLOADING' | 'ANALYZING' | 'PITCHING' | 'SELECTED' | 'ERROR';

interface TheLoungeProps {
  /** Callback when a Director is selected */
  onDirectorSelected?: (directorId: string, imageUrl: string) => void;
  /** External analyze function (for tRPC integration) */
  onAnalyze?: (imageUrl: string) => Promise<DirectorPitchData[]>;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TheLounge({
  onDirectorSelected,
  onAnalyze,
}: TheLoungeProps): JSX.Element {
  const [state, setState] = useState<LoungeState>('IDLE');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [directors, setDirectors] = useState<DirectorPitchData[]>([]);
  const [selectedDirectorId, setSelectedDirectorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDirectorId, setLoadingDirectorId] = useState<string | null>(null);

  // Handle file upload
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB.');
      return;
    }

    setError(null);
    setState('UPLOADING');

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // For now, use a placeholder URL - in production this would upload to Supabase
      // and return the public URL
      const mockImageUrl = URL.createObjectURL(file);
      setImageUrl(mockImageUrl);

      // Start analysis
      setState('ANALYZING');

      if (onAnalyze) {
        // Use provided analyze function (tRPC)
        const pitches = await onAnalyze(mockImageUrl);
        setDirectors(pitches);
      } else {
        // Use mock data for development
        await simulateAnalysis();
        setDirectors(getMockDirectorPitches());
      }

      setState('PITCHING');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      setState('ERROR');
    }
  }, [onAnalyze]);

  // Handle Director selection
  const handleSelectDirector = useCallback(async (directorId: string) => {
    setLoadingDirectorId(directorId);
    setSelectedDirectorId(directorId);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));

    setState('SELECTED');
    setLoadingDirectorId(null);

    if (onDirectorSelected && imageUrl) {
      onDirectorSelected(directorId, imageUrl);
    }
  }, [imageUrl, onDirectorSelected]);

  // Reset to initial state
  const handleReset = useCallback(() => {
    setState('IDLE');
    setImageUrl(null);
    setImagePreview(null);
    setDirectors([]);
    setSelectedDirectorId(null);
    setError(null);
  }, []);

  return (
    <div className="lounge-container">
      {/* Header */}
      <header className="lounge-header">
        <h1 className="lounge-title">
          <span className="title-icon">🎬</span>
          The Director's Lounge
        </h1>
        <p className="lounge-tagline">
          Upload your brand asset. Let four elite directors pitch their vision.
        </p>
      </header>

      {/* Main Content */}
      <main className="lounge-content">
        {/* IDLE State - Upload Zone */}
        {state === 'IDLE' && (
          <div className="upload-zone">
            <input
              type="file"
              id="brand-asset"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="brand-asset" className="upload-label">
              <span className="upload-icon">📷</span>
              <span className="upload-text">Drop your brand asset here</span>
              <span className="upload-hint">JPEG, PNG, or WebP up to 10MB</span>
            </label>
          </div>
        )}

        {/* UPLOADING State */}
        {state === 'UPLOADING' && (
          <div className="status-card">
            <span className="spinner" />
            <span>Uploading your asset...</span>
          </div>
        )}

        {/* ANALYZING State - Skeleton Grid */}
        {state === 'ANALYZING' && (
          <>
            {imagePreview && (
              <div className="preview-section">
                <img src={imagePreview} alt="Uploaded asset" className="preview-image" />
              </div>
            )}
            <DirectorGridSkeleton />
          </>
        )}

        {/* PITCHING State - Director Cards */}
        {state === 'PITCHING' && (
          <>
            {imagePreview && (
              <div className="preview-section">
                <img src={imagePreview} alt="Uploaded asset" className="preview-image" />
                <button onClick={handleReset} className="reset-button">
                  ↻ Upload Different Asset
                </button>
              </div>
            )}
            <DirectorGrid
              directors={directors}
              onSelect={handleSelectDirector}
              selectedId={selectedDirectorId || undefined}
              loadingId={loadingDirectorId || undefined}
            />
          </>
        )}

        {/* SELECTED State - Confirmation */}
        {state === 'SELECTED' && selectedDirectorId && (
          <div className="selected-state">
            <div className="success-badge">
              <span className="success-icon">✓</span>
              <span>Director Selected</span>
            </div>
            <h2 className="selected-title">
              {directors.find(d => d.id === selectedDirectorId)?.name}
            </h2>
            <p className="selected-message">
              Your concept has been greenlit. Proceeding to video production...
            </p>
            <button onClick={handleReset} className="new-project-button">
              Start New Project
            </button>
          </div>
        )}

        {/* ERROR State */}
        {state === 'ERROR' && (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p className="error-message">{error}</p>
            <button onClick={handleReset} className="retry-button">
              Try Again
            </button>
          </div>
        )}
      </main>

      <style>{loungeStyles}</style>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

async function simulateAnalysis(): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000));
}

function getMockDirectorPitches(): DirectorPitchData[] {
  return [
    {
      id: 'newtonian',
      name: 'The Newtonian',
      avatar: '🔬',
      archetype: 'The Simulationist',
      quote: 'Respect the gravity.',
      stats: { physics: 9.5, vibe: 6.0, logic: 7.0 },
      engine: 'kling',
      riskLevel: 'Safe',
      commentary: {
        vision: 'High-mass object with significant velocity potential.',
        safety: 'Preserve structural integrity and realistic motion.',
        magic: 'Physics-accurate animation creates visceral impact.',
      },
    },
    {
      id: 'visionary',
      name: 'The Visionary',
      avatar: '🎨',
      archetype: 'The Auteur',
      quote: 'Let the colors bleed.',
      stats: { physics: 5.5, vibe: 9.5, logic: 6.0 },
      engine: 'luma',
      riskLevel: 'Experimental',
      commentary: {
        vision: 'A luminous dream waiting to unfold.',
        safety: 'Protect the ethereal mood and emotional resonance.',
        magic: 'Morphing light creates transcendent experience.',
      },
    },
    {
      id: 'minimalist',
      name: 'The Minimalist',
      avatar: '⬜',
      archetype: 'The Designer',
      quote: 'Less, but better.',
      stats: { physics: 6.0, vibe: 6.0, logic: 10.0 },
      engine: 'kling',
      riskLevel: 'Safe',
      commentary: {
        vision: 'Clean composition with clear hierarchy.',
        safety: 'Typography and brand marks must remain crisp.',
        magic: 'Subtle motion amplifies message clarity.',
      },
    },
    {
      id: 'provocateur',
      name: 'The Provocateur',
      avatar: '🔥',
      archetype: 'The Disruptor',
      quote: 'Break the rules.',
      stats: { physics: 8.0, vibe: 8.5, logic: 6.0 },
      engine: 'luma',
      riskLevel: 'Experimental',
      commentary: {
        vision: 'Chaos waiting to be unleashed.',
        safety: 'Embrace the unexpected, reject the safe.',
        magic: 'Radical motion shatters expectations.',
      },
    },
  ];
}

// =============================================================================
// STYLES
// =============================================================================

const loungeStyles = `
  .lounge-container {
    min-height: 100vh;
    background: linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%);
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .lounge-header {
    text-align: center;
    padding: 48px 24px 32px;
  }

  .lounge-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .title-icon {
    font-size: 2rem;
  }

  .lounge-tagline {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }

  .lounge-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px 48px;
  }

  /* Upload Zone */
  .upload-zone {
    max-width: 600px;
    margin: 40px auto;
  }

  .file-input {
    display: none;
  }

  .upload-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 32px;
    background: rgba(255, 255, 255, 0.02);
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .upload-label:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(139, 92, 246, 0.5);
  }

  .upload-icon {
    font-size: 3rem;
    margin-bottom: 16px;
  }

  .upload-text {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .upload-hint {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.5);
  }

  /* Preview Section */
  .preview-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 40px;
  }

  .preview-image {
    max-width: 300px;
    max-height: 200px;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .reset-button {
    margin-top: 16px;
    padding: 8px 16px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.6);
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reset-button:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: white;
  }

  /* Status Card */
  .status-card {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
    background: rgba(139, 92, 246, 0.1);
    border-radius: 12px;
    max-width: 400px;
    margin: 40px auto;
    color: #a78bfa;
    font-weight: 500;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(139, 92, 246, 0.3);
    border-top-color: #a78bfa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Selected State */
  .selected-state {
    text-align: center;
    padding: 64px 24px;
    max-width: 500px;
    margin: 0 auto;
  }

  .success-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border-radius: 999px;
    font-weight: 600;
    margin-bottom: 24px;
  }

  .success-icon {
    font-size: 1.25rem;
  }

  .selected-title {
    font-size: 2rem;
    margin: 0 0 12px;
  }

  .selected-message {
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 32px;
  }

  .new-project-button {
    padding: 14px 32px;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .new-project-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }

  /* Error State */
  .error-state {
    text-align: center;
    padding: 48px 24px;
    max-width: 400px;
    margin: 40px auto;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 16px;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .error-icon {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 16px;
  }

  .error-message {
    color: #fca5a5;
    margin: 0 0 24px;
  }

  .retry-button {
    padding: 12px 24px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .retry-button:hover {
    background: #dc2626;
  }
`;

export default TheLounge;
