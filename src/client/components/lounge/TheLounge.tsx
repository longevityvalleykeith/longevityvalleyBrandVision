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
 * - STORYBOARD: Display scene preview cards with traffic lights
 * - SELECTED: User selected a Director -> transition to Video Generation
 *
 * Phase 3 Enhancement: Added ScenePreviewGrid with Traffic Light indicators
 * for user-in-the-loop decision making.
 *
 * @module client/components/lounge/TheLounge
 * @version 1.1.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { DirectorGrid, DirectorGridSkeleton } from './DirectorGrid';
import type { DirectorPitchData } from './DirectorCard';
import ScenePreviewGrid from '../ScenePreviewGrid';
import type { SceneData } from '../ScenePreviewCard';
import BrandContextForm, { type BrandContext } from '../BrandContextForm';

// =============================================================================
// TYPES
// =============================================================================

type LoungeState = 'IDLE' | 'UPLOADING' | 'ANALYZING' | 'PITCHING' | 'STORYBOARD' | 'SELECTED' | 'ERROR';

interface TheLoungeProps {
  /** Callback when a Director is selected */
  onDirectorSelected?: (directorId: string, imageUrl: string) => void;
  /** External analyze function (for tRPC integration) */
  onAnalyze?: (imageUrl: string, brandContext?: BrandContext) => Promise<DirectorPitchData[]>;
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
  const [scenes, setScenes] = useState<SceneData[]>([]);
  const [brandContext, setBrandContext] = useState<BrandContext | null>(null);
  const [showContextForm, setShowContextForm] = useState(true);
  const [currentDirectorIndex, setCurrentDirectorIndex] = useState(0);
  const [hasStudioData, setHasStudioData] = useState(false);

  // Check for data passed from /studio
  useEffect(() => {
    const studioTransition = sessionStorage.getItem('studioTransition');
    if (studioTransition) {
      try {
        const data = JSON.parse(studioTransition);
        // Set all the passed data
        setImageUrl(data.imageUrl);
        setImagePreview(data.imageUrl); // Use imageUrl directly (already on Supabase)
        setBrandContext(data.brandContext);
        setHasStudioData(true);

        // If analysis data was already passed, extract director pitches
        if (data.analysisData?.allDirectorPitches && data.analysisData.allDirectorPitches.length > 0) {
          console.log('[TheLounge] 🎬 Using Rashomon Effect - All director pitches from analysis');
          console.log(`[TheLounge] 📊 Received ${data.analysisData.allDirectorPitches.length} director pitches`);
          console.log(`[TheLounge] ⭐ Recommended Director: ${data.analysisData.recommendedDirectorId || 'none'}`);

          try {
            // Transform backend director pitches to frontend format with validation
            const directorPitches = data.analysisData.allDirectorPitches
              .map((pitch: any, index: number) => {
                // Validate required fields
                if (!pitch?.directorId) {
                  console.warn(`[TheLounge] ⚠️ Pitch ${index} missing directorId, skipping`);
                  return null;
                }

                if (!pitch?.directorName || !pitch?.avatar) {
                  console.warn(`[TheLounge] ⚠️ Pitch ${index} (${pitch.directorId}) missing name or avatar`);
                }

                if (!pitch?.biasedScores) {
                  console.warn(`[TheLounge] ⚠️ Pitch ${index} (${pitch.directorId}) missing biasedScores`);
                  return null;
                }

                // Safe transformation with fallbacks
                return {
                  id: pitch.directorId,
                  name: pitch.directorName || pitch.directorId,
                  avatar: pitch.avatar || '🎬',
                  archetype: pitch.directorName || 'Unknown',
                  quote: pitch.threeBeatPulse?.vision || 'No vision statement',
                  stats: {
                    physics: pitch.biasedScores?.physics ?? 0,
                    vibe: pitch.biasedScores?.vibe ?? 0,
                    logic: pitch.biasedScores?.logic ?? 0,
                  },
                  engine: pitch.recommendedEngine || 'kling',
                  riskLevel: pitch.riskLevel || 'Balanced',
                  pitch: pitch.commentary || 'No commentary available',
                  commentary: pitch.threeBeatPulse || {
                    vision: 'N/A',
                    safety: 'N/A',
                    magic: 'N/A',
                  },
                  isRecommended: pitch.directorId === data.analysisData.recommendedDirectorId,
                };
              })
              .filter((pitch): pitch is NonNullable<typeof pitch> => pitch !== null);

            if (directorPitches.length === 0) {
              console.error('[TheLounge] ❌ No valid director pitches after transformation, using fallback');
              throw new Error('No valid director pitches');
            }

            console.log(`[TheLounge] ✅ Successfully transformed ${directorPitches.length} director pitches`);
            setDirectors(directorPitches);
            setState('PITCHING');

            // Set carousel to recommended director if available
            const recommendedIndex = directorPitches.findIndex((d: any) => d.isRecommended);
            if (recommendedIndex >= 0) {
              console.log(`[TheLounge] 🎯 Starting carousel at recommended director (index ${recommendedIndex})`);
              setCurrentDirectorIndex(recommendedIndex);
            } else {
              console.log('[TheLounge] ℹ️ No recommended director found, starting at index 0');
            }
          } catch (transformError) {
            console.error('[TheLounge] ❌ Error transforming director pitches:', transformError);
            console.log('[TheLounge] 🔄 Falling back to PATH B (onAnalyze or mock data)');
            // Fall through to PATH B
            setState('ANALYZING');

            setTimeout(async () => {
              if (onAnalyze) {
                const pitches = await onAnalyze(data.imageUrl, data.brandContext);
                setDirectors(pitches);
              } else {
                setDirectors(getMockDirectorPitches());
              }
              setState('PITCHING');
            }, 1000);
          }
        } else {
          // No director pitches yet, trigger analysis
          setState('ANALYZING');

          setTimeout(async () => {
            if (onAnalyze) {
              const pitches = await onAnalyze(data.imageUrl, data.brandContext);
              setDirectors(pitches);
            } else {
              // Use mock data
              setDirectors(getMockDirectorPitches());
            }
            setState('PITCHING');
          }, 1000);
        }

        // Clear the sessionStorage after use
        sessionStorage.removeItem('studioTransition');
      } catch (error) {
        console.error('Failed to parse studio transition data:', error);
        setHasStudioData(false);
      }
    }
  }, [onAnalyze]);

  // Handle brand context changes
  const handleContextChange = useCallback((context: BrandContext) => {
    setBrandContext(context);
  }, []);

  // Check if minimum context is provided
  const hasRequiredContext = brandContext?.productInfo?.trim() && brandContext?.sellingPoints?.trim();

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
        // Use provided analyze function (tRPC) with brand context
        const pitches = await onAnalyze(mockImageUrl, brandContext || undefined);
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

  // Handle Director selection - now transitions to STORYBOARD
  const handleSelectDirector = useCallback(async (directorId: string) => {
    setLoadingDirectorId(directorId);
    setSelectedDirectorId(directorId);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate mock scenes based on the selected director
    const selectedDirector = directors.find(d => d.id === directorId);
    const mockScenes = generateMockScenes(selectedDirector);
    setScenes(mockScenes);

    setState('STORYBOARD');
    setLoadingDirectorId(null);
  }, [directors]);

  // Handle scene approval
  const handleApproveScene = useCallback((sceneId: string) => {
    setScenes(prev => prev.map(scene =>
      scene.id === sceneId ? { ...scene, status: 'GREEN' as const } : scene
    ));
  }, []);

  // Handle scene refinement
  const handleRefineScene = useCallback((sceneId: string, status: 'YELLOW' | 'RED', feedback?: string) => {
    setScenes(prev => prev.map(scene =>
      scene.id === sceneId ? { ...scene, status, userFeedback: feedback || null } : scene
    ));
  }, []);

  // Handle approve all scenes
  const handleApproveAll = useCallback(() => {
    setScenes(prev => prev.map(scene => ({ ...scene, status: 'GREEN' as const })));
  }, []);

  // Proceed to production
  const handleProceedToProduction = useCallback(() => {
    setState('SELECTED');
    if (onDirectorSelected && imageUrl && selectedDirectorId) {
      onDirectorSelected(selectedDirectorId, imageUrl);
    }
  }, [imageUrl, selectedDirectorId, onDirectorSelected]);

  // Reset to initial state
  const handleReset = useCallback(() => {
    setState('IDLE');
    setImageUrl(null);
    setImagePreview(null);
    setDirectors([]);
    setSelectedDirectorId(null);
    setError(null);
    setHasStudioData(false);
  }, []);

  // Carousel navigation
  const handleNextDirector = useCallback(() => {
    setCurrentDirectorIndex(prev => (prev + 1) % directors.length);
  }, [directors.length]);

  const handlePrevDirector = useCallback(() => {
    setCurrentDirectorIndex(prev => (prev - 1 + directors.length) % directors.length);
  }, [directors.length]);

  const currentDirector = directors[currentDirectorIndex];

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
        {/* IDLE State - Brand Context + Upload Zone (only if no studio data) */}
        {state === 'IDLE' && !hasStudioData && (
          <div className="idle-state">
            {/* Brand Context Form - Collapsible */}
            <div className="context-form-section">
              <button
                onClick={() => setShowContextForm(!showContextForm)}
                className="context-toggle-btn"
              >
                <div className="toggle-left">
                  <span className="toggle-icon">📝</span>
                  <div className="toggle-info">
                    <span className="toggle-title">Brand Context</span>
                    <span className="toggle-subtitle">
                      {hasRequiredContext ? '✓ Context provided' : 'Add details for richer Director pitches'}
                    </span>
                  </div>
                </div>
                <span className={`toggle-arrow ${showContextForm ? 'open' : ''}`}>▼</span>
              </button>

              {showContextForm && (
                <div className="context-form-wrapper">
                  <BrandContextForm
                    onChange={handleContextChange}
                    initialValues={brandContext || undefined}
                    isLoading={false}
                    compact={false}
                  />
                </div>
              )}
            </div>

            {/* Upload Zone */}
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
                {hasRequiredContext && (
                  <span className="context-ready-badge">
                    ✓ Brand context will enhance Director pitches
                  </span>
                )}
              </label>
            </div>
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

        {/* PITCHING State - Director Carousel (1 at a time) */}
        {state === 'PITCHING' && currentDirector && (
          <>
            {imagePreview && (
              <div className="preview-section">
                <img src={imagePreview} alt="Uploaded asset" className="preview-image" />
                <button onClick={handleReset} className="reset-button">
                  ↻ Upload Different Asset
                </button>
              </div>
            )}

            {/* Director Carousel */}
            <div className="director-carousel">
              <div className="carousel-header">
                <h2 className="carousel-title">Director's Pitch</h2>
                <div className="carousel-counter">
                  {currentDirectorIndex + 1} of {directors.length}
                </div>
              </div>

              {/* Single Director Card */}
              <div className={`carousel-card ${(currentDirector as any).isRecommended ? 'recommended' : ''}`}>
                <div className="director-header">
                  <span className="director-avatar">{currentDirector.avatar}</span>
                  <div className="director-info">
                    <div className="name-with-badge">
                      <h3 className="director-name">{currentDirector.name}</h3>
                      {(currentDirector as any).isRecommended && (
                        <span className="recommended-badge">⭐ Recommended</span>
                      )}
                    </div>
                    <p className="director-archetype">{currentDirector.archetype}</p>
                    <p className="director-quote">"{currentDirector.quote}"</p>
                  </div>
                </div>

                <div className="director-pitch">
                  <h4>The Pitch:</h4>
                  <p>{currentDirector.pitch}</p>
                </div>

                <div className="director-stats">
                  <div className="stat">
                    <span className="stat-label">Engine</span>
                    <span className="stat-value">{currentDirector.engine}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Risk</span>
                    <span className="stat-value">{currentDirector.riskLevel}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectDirector(currentDirector.id)}
                  className="select-director-btn"
                >
                  Select {currentDirector.name}
                </button>
              </div>

              {/* Carousel Navigation */}
              <div className="carousel-nav">
                <button
                  onClick={handlePrevDirector}
                  className="nav-btn prev"
                  disabled={directors.length <= 1}
                >
                  ← Previous
                </button>
                <div className="carousel-dots">
                  {directors.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentDirectorIndex(index)}
                      className={`dot ${index === currentDirectorIndex ? 'active' : ''}`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleNextDirector}
                  className="nav-btn next"
                  disabled={directors.length <= 1}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}

        {/* STORYBOARD State - Scene Preview Cards with Traffic Lights */}
        {state === 'STORYBOARD' && selectedDirectorId && (
          <div className="storyboard-state">
            {/* Director Badge */}
            <div className="director-badge">
              <span className="badge-avatar">
                {directors.find(d => d.id === selectedDirectorId)?.avatar}
              </span>
              <div className="badge-info">
                <span className="badge-label">Directed by</span>
                <span className="badge-name">
                  {directors.find(d => d.id === selectedDirectorId)?.name}
                </span>
              </div>
              <button onClick={() => setState('PITCHING')} className="change-director-btn">
                Change Director
              </button>
            </div>

            {/* Scene Preview Grid */}
            <div className="scene-grid-wrapper">
              <ScenePreviewGrid
                scenes={scenes}
                onApprove={handleApproveScene}
                onRefine={handleRefineScene}
                onApproveAll={handleApproveAll}
                showPreview={true}
                title="Storyboard Preview"
                subtitle="Review each scene. Approve, request changes, or regenerate."
              />
            </div>

            {/* Proceed to Production Button */}
            {scenes.every(s => s.status === 'GREEN') && (
              <div className="proceed-section">
                <button onClick={handleProceedToProduction} className="proceed-button">
                  <span className="proceed-icon">🎬</span>
                  Proceed to Video Production
                </button>
              </div>
            )}
          </div>
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

function generateMockScenes(director?: DirectorPitchData): SceneData[] {
  const directorId = director?.id || 'newtonian';

  const sceneTemplates: Record<string, { title: string; description: string }[]> = {
    newtonian: [
      { title: 'Opening Shot', description: 'Product descends into frame with realistic gravitational motion, subtle bounce on landing' },
      { title: 'Feature Reveal', description: 'Camera orbits around product with physics-accurate depth blur and lighting' },
      { title: 'Dynamic Action', description: 'Product interaction showcasing weight and material properties' },
      { title: 'Call to Action', description: 'Logo emergence with particle effects following physical trajectories' },
    ],
    visionary: [
      { title: 'Dream Sequence', description: 'Product emerges from ethereal mist with color-shifting iridescent glow' },
      { title: 'Emotional Peak', description: 'Slow-motion transformation with morphing light trails' },
      { title: 'Abstract Beauty', description: 'Product dissolves into artistic color waves and reforms' },
      { title: 'Transcendent Close', description: 'Final frame blends product with cosmic imagery' },
    ],
    minimalist: [
      { title: 'Clean Introduction', description: 'Product appears on pure white background, crisp edges' },
      { title: 'Typography Focus', description: 'Key message animates with precise geometric timing' },
      { title: 'Subtle Motion', description: 'Minimal camera movement, emphasis on negative space' },
      { title: 'Brand Mark', description: 'Logo resolves with deliberate, confident simplicity' },
    ],
    provocateur: [
      { title: 'Explosive Entry', description: 'Product bursts through reality barrier with glitch effects' },
      { title: 'Rule Breaking', description: 'Unconventional angles and jarring cuts challenge expectations' },
      { title: 'Chaos Peak', description: 'Maximum visual intensity with overlapping motion layers' },
      { title: 'Defiant Close', description: 'Logo shatters and reassembles in unexpected formation' },
    ],
  };

  const templates = sceneTemplates[directorId] ?? sceneTemplates['newtonian'];

  return (templates ?? []).map((template, index) => ({
    id: `scene-${directorId}-${index + 1}`,
    sequenceIndex: index + 1,
    title: template.title,
    description: template.description,
    status: 'PENDING' as const,
    previewUrl: undefined,
    userFeedback: null,
  }));
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

  /* IDLE State Container */
  .idle-state {
    max-width: 800px;
    margin: 0 auto;
  }

  /* Brand Context Form Section */
  .context-form-section {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    margin-bottom: 24px;
    overflow: hidden;
  }

  .context-toggle-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
  }

  .context-toggle-btn:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .toggle-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .toggle-icon {
    font-size: 1.5rem;
  }

  .toggle-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .toggle-title {
    font-size: 1rem;
    font-weight: 600;
    color: white;
  }

  .toggle-subtitle {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .toggle-arrow {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    transition: transform 0.2s;
  }

  .toggle-arrow.open {
    transform: rotate(180deg);
  }

  .context-form-wrapper {
    padding: 0 20px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.02);
  }

  /* Override BrandContextForm styles for dark theme */
  .context-form-wrapper .brand-context-form {
    background: transparent;
    padding: 20px 0 0;
  }

  .context-form-wrapper .form-section label {
    color: rgba(255, 255, 255, 0.8);
  }

  .context-form-wrapper .form-section input,
  .context-form-wrapper .form-section textarea {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    color: white;
  }

  .context-form-wrapper .form-section input::placeholder,
  .context-form-wrapper .form-section textarea::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  .context-form-wrapper .form-section input:focus,
  .context-form-wrapper .form-section textarea:focus {
    border-color: rgba(139, 92, 246, 0.5);
    background: rgba(255, 255, 255, 0.1);
  }

  .context-form-wrapper .helper-text {
    color: rgba(255, 255, 255, 0.5);
  }

  .context-ready-badge {
    display: block;
    margin-top: 12px;
    padding: 6px 12px;
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
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

  /* Storyboard State */
  .storyboard-state {
    max-width: 1200px;
    margin: 0 auto;
  }

  .director-badge {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 12px;
    margin-bottom: 32px;
  }

  .badge-avatar {
    font-size: 2.5rem;
  }

  .badge-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .badge-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
  }

  .change-director-btn {
    padding: 8px 16px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.6);
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .change-director-btn:hover {
    border-color: rgba(139, 92, 246, 0.5);
    color: #a78bfa;
  }

  .scene-grid-wrapper {
    background: rgba(255, 255, 255, 0.02);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .proceed-section {
    display: flex;
    justify-content: center;
    margin-top: 32px;
  }

  .proceed-button {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 40px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.125rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
  }

  .proceed-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(16, 185, 129, 0.5);
  }

  .proceed-icon {
    font-size: 1.5rem;
  }

  /* Rashomon Effect - Director Carousel Enhancements */
  .carousel-card {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 32px;
    transition: all 0.3s ease;
  }

  .carousel-card.recommended {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 140, 0, 0.05) 100%);
    border-color: rgba(255, 215, 0, 0.4);
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.2);
  }

  .name-with-badge {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .recommended-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 140, 0, 0.2) 100%);
    border: 1px solid rgba(255, 215, 0, 0.5);
    color: #ffd700;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    animation: recommendedPulse 2s ease-in-out infinite;
  }

  @keyframes recommendedPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4);
    }
    50% {
      box-shadow: 0 0 10px 3px rgba(255, 215, 0, 0.2);
    }
  }

  .director-header {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    margin-bottom: 24px;
  }

  .director-avatar {
    font-size: 3.5rem;
    flex-shrink: 0;
  }

  .director-info {
    flex: 1;
  }

  .director-name {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 8px;
    color: white;
  }

  .director-archetype {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .director-quote {
    font-size: 1rem;
    font-style: italic;
    color: rgba(139, 92, 246, 0.9);
    margin: 0;
  }

  .director-pitch {
    margin-bottom: 24px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    border-left: 4px solid rgba(139, 92, 246, 0.5);
  }

  .director-pitch h4 {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0 0 12px;
  }

  .director-pitch p {
    font-size: 1rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
  }

  .director-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: white;
  }

  .select-director-btn {
    width: 100%;
    padding: 14px 24px;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .select-director-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }

  .carousel-card.recommended .select-director-btn {
    background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
    color: #1a1a2e;
  }

  .carousel-card.recommended .select-director-btn:hover {
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }

  .carousel-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 24px;
    gap: 16px;
  }

  .nav-btn {
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-btn:hover:not(:disabled) {
    background: rgba(139, 92, 246, 0.3);
    border-color: rgba(139, 92, 246, 0.5);
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .carousel-dots {
    display: flex;
    gap: 8px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0;
  }

  .dot.active {
    background: rgba(139, 92, 246, 0.9);
    transform: scale(1.3);
  }

  .dot:hover:not(.active) {
    background: rgba(255, 255, 255, 0.4);
  }

  .carousel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .carousel-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0;
  }

  .carousel-counter {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.5);
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 999px;
  }
`;

export default TheLounge;
