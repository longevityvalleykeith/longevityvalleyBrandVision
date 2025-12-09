/**
 * The Launchpad - Brand Content to Market Pipeline
 *
 * Route: /launchpad
 *
 * Marketing deployment pipeline that:
 * - Displays approved scenes from /studio (preview gallery)
 * - Learns from Studio pipeline decisions (StudioHead LearningEvent)
 * - Provides brand strategy analysis (CulturalEvent Packaging)
 * - Deploys content to market (Deployment Agent)
 *
 * User Participation Modes:
 * 1. Preview-Only: View approved content gallery
 * 2. Full Pipeline: Strategy analysis + deployment
 *
 * @module app/launchpad/page
 * @version 1.0.0
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface ApprovedScene {
  id: string;
  previewUrl: string;
  actionToken: string;
  directorId: string;
  approvedAt: number;
}

interface ProductionHandoff {
  directorId: string;
  imageUrl: string;
  timestamp: number;
  scenes?: ApprovedScene[];
}

interface LaunchpadState {
  mode: 'EMPTY' | 'PREVIEW' | 'STRATEGY' | 'DEPLOYING' | 'LAUNCHED';
  productionData: ProductionHandoff | null;
  approvedScenes: ApprovedScene[];
}

// =============================================================================
// DIRECTOR METADATA
// =============================================================================

const DIRECTOR_INFO: Record<string, { name: string; avatar: string; archetype: string }> = {
  newtonian: { name: 'The Newtonian', avatar: 'N', archetype: 'Physics-First' },
  visionary: { name: 'The Visionary', avatar: 'V', archetype: 'Vibe-First' },
  minimalist: { name: 'The Minimalist', avatar: 'M', archetype: 'Logic-First' },
  provocateur: { name: 'The Provocateur', avatar: 'P', archetype: 'Chaos Agent' },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LaunchpadPage(): JSX.Element {
  const [state, setState] = useState<LaunchpadState>({
    mode: 'EMPTY',
    productionData: null,
    approvedScenes: [],
  });

  // Load production data from Studio on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('productionHandoff');
      if (stored) {
        const data = JSON.parse(stored) as ProductionHandoff;

        // Check staleness (30 minutes)
        const STALE_THRESHOLD_MS = 30 * 60 * 1000;
        if (data.timestamp && Date.now() - data.timestamp < STALE_THRESHOLD_MS) {
          setState(prev => ({
            ...prev,
            mode: 'PREVIEW',
            productionData: data,
            approvedScenes: data.scenes || [],
          }));
          console.log('[Launchpad] Loaded production data from Studio');
        } else {
          console.warn('[Launchpad] Production data is stale');
        }
      }
    } catch (err) {
      console.error('[Launchpad] Failed to load production data:', err);
    }
  }, []);

  const director = state.productionData?.directorId
    ? DIRECTOR_INFO[state.productionData.directorId]
    : null;

  // Future: Launch to market handler
  const handleLaunch = useCallback(() => {
    setState(prev => ({ ...prev, mode: 'DEPLOYING' }));
    // TODO: Implement deployment agent
    setTimeout(() => {
      setState(prev => ({ ...prev, mode: 'LAUNCHED' }));
    }, 2000);
  }, []);

  return (
    <div className="launchpad-container">
      {/* Navigation */}
      <nav className="launchpad-nav">
        <Link href="/" className="nav-home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </Link>
        <span className="nav-breadcrumb">/ Launchpad</span>
      </nav>

      <main className="launchpad-main">
        {/* EMPTY State - No content from Studio */}
        {state.mode === 'EMPTY' && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="rocket-icon">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
            </div>
            <h2 className="empty-title">Ready for Launch</h2>
            <p className="empty-message">
              Create brand content in the Studio first, then return here to launch it to market.
            </p>
            <Link href="/studio" className="cta-button">
              Go to Studio
            </Link>
          </div>
        )}

        {/* PREVIEW State - Show approved content gallery */}
        {state.mode === 'PREVIEW' && state.productionData && (
          <div className="preview-state">
            {/* Director Badge */}
            {director && (
              <div className="director-badge">
                <span className="badge-avatar">{director.avatar}</span>
                <div className="badge-info">
                  <span className="badge-label">Directed by</span>
                  <span className="badge-name">{director.name}</span>
                </div>
              </div>
            )}

            <h2 className="preview-title">Brand Content Gallery</h2>
            <p className="preview-subtitle">
              Approved scenes ready for market deployment
            </p>

            {/* Scene Gallery */}
            <div className="scene-gallery">
              {state.approvedScenes.length > 0 ? (
                state.approvedScenes.map((scene, index) => (
                  <div key={scene.id} className="scene-card">
                    <img
                      src={scene.previewUrl}
                      alt={`Scene ${index + 1}`}
                      className="scene-image"
                    />
                    <div className="scene-info">
                      <span className="scene-number">Scene {index + 1}</span>
                      <span className="scene-token">{scene.actionToken}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="placeholder-gallery">
                  <div className="placeholder-card">
                    <img
                      src={state.productionData.imageUrl}
                      alt="Brand asset"
                      className="placeholder-image"
                    />
                    <div className="placeholder-info">
                      <span className="placeholder-label">Source Asset</span>
                      <span className="placeholder-hint">Scenes will appear here after approval</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Strategy Section (Future) */}
            <div className="strategy-section">
              <h3 className="section-title">Brand Strategy Analysis</h3>
              <div className="strategy-placeholder">
                <p>StudioHead LearningEvent analysis coming soon...</p>
                <p className="strategy-hint">
                  This section will analyze Director selection patterns
                  and recommend cultural packaging strategies.
                </p>
              </div>
            </div>

            {/* Launch Actions */}
            <div className="launch-actions">
              <button
                onClick={handleLaunch}
                className="launch-button"
                disabled={state.approvedScenes.length === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                </svg>
                Launch to Market
              </button>
              <Link href="/studio" className="secondary-button">
                Back to Studio
              </Link>
            </div>
          </div>
        )}

        {/* DEPLOYING State */}
        {state.mode === 'DEPLOYING' && (
          <div className="deploying-state">
            <div className="deploying-spinner" />
            <h2 className="deploying-title">Deploying to Market...</h2>
            <p className="deploying-message">
              Packaging content for distribution channels
            </p>
          </div>
        )}

        {/* LAUNCHED State */}
        {state.mode === 'LAUNCHED' && (
          <div className="launched-state">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="launched-title">Successfully Launched!</h2>
            <p className="launched-message">
              Your brand content is now live across distribution channels.
            </p>
            <div className="launched-actions">
              <Link href="/studio" className="secondary-button">
                Create More Content
              </Link>
              <Link href="/" className="primary-button">
                Return Home
              </Link>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .launchpad-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
          color: #f8fafc;
        }

        .launchpad-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 24px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-home {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #a5b4fc;
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.2s;
        }

        .nav-home:hover {
          color: #c7d2fe;
        }

        .nav-icon {
          width: 16px;
          height: 16px;
        }

        .nav-breadcrumb {
          color: #64748b;
          font-size: 0.875rem;
        }

        .launchpad-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
        }

        .empty-icon {
          width: 120px;
          height: 120px;
          background: rgba(99, 102, 241, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .rocket-icon {
          width: 60px;
          height: 60px;
          color: #a5b4fc;
        }

        .empty-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .empty-message {
          color: #94a3b8;
          font-size: 1.125rem;
          max-width: 400px;
          margin-bottom: 32px;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        /* Preview State */
        .preview-state {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .director-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          width: fit-content;
        }

        .badge-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .badge-info {
          display: flex;
          flex-direction: column;
        }

        .badge-label {
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge-name {
          font-size: 1rem;
          font-weight: 600;
        }

        .preview-title {
          font-size: 2rem;
          font-weight: 700;
        }

        .preview-subtitle {
          color: #94a3b8;
          margin-top: -24px;
        }

        /* Scene Gallery */
        .scene-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .scene-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.2s, border-color 0.2s;
        }

        .scene-card:hover {
          transform: translateY(-4px);
          border-color: rgba(99, 102, 241, 0.5);
        }

        .scene-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .scene-info {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .scene-number {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .scene-token {
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .placeholder-gallery {
          width: 100%;
        }

        .placeholder-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 400px;
        }

        .placeholder-image {
          width: 100%;
          height: 250px;
          object-fit: cover;
        }

        .placeholder-info {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .placeholder-label {
          font-weight: 600;
        }

        .placeholder-hint {
          color: #64748b;
          font-size: 0.75rem;
        }

        /* Strategy Section */
        .strategy-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .strategy-placeholder {
          color: #94a3b8;
        }

        .strategy-hint {
          font-size: 0.875rem;
          margin-top: 8px;
          color: #64748b;
        }

        /* Launch Actions */
        .launch-actions {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }

        .launch-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .launch-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
        }

        .launch-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-icon {
          width: 20px;
          height: 20px;
        }

        .secondary-button {
          display: inline-flex;
          align-items: center;
          padding: 14px 24px;
          background: transparent;
          color: #a5b4fc;
          border: 1px solid rgba(165, 180, 252, 0.3);
          border-radius: 12px;
          font-size: 1rem;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s;
        }

        .secondary-button:hover {
          background: rgba(165, 180, 252, 0.1);
          border-color: rgba(165, 180, 252, 0.5);
        }

        /* Deploying State */
        .deploying-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
        }

        .deploying-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(99, 102, 241, 0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 24px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .deploying-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .deploying-message {
          color: #94a3b8;
        }

        /* Launched State */
        .launched-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: rgba(16, 185, 129, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: #10b981;
        }

        .success-icon svg {
          width: 40px;
          height: 40px;
        }

        .launched-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 12px;
          color: #10b981;
        }

        .launched-message {
          color: #94a3b8;
          font-size: 1.125rem;
          margin-bottom: 32px;
        }

        .launched-actions {
          display: flex;
          gap: 16px;
        }

        .primary-button {
          display: inline-flex;
          align-items: center;
          padding: 14px 32px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }
      `}</style>
    </div>
  );
}
