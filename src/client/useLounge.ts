/**
 * Phase 4 - Director's Lounge Hooks
 *
 * Custom React hooks for The Director's Lounge UI.
 * Handles 4-Director analysis and selection recording.
 *
 * @module client/hooks/useLounge
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { trpc, getErrorMessage } from '../lib/trpc';
import type { DirectorPitchData } from './components/lounge/DirectorCard';

// =============================================================================
// TYPES
// =============================================================================

interface LoungeAnalysisResult {
  rawScores: {
    physics: number;
    vibe: number;
    logic: number;
  };
  directors: DirectorPitchData[];
  analyzedAt: string;
}

interface UseLoungeReturn {
  /** Analyze image with all 4 Directors */
  analyze: (imageUrl: string) => Promise<DirectorPitchData[]>;
  /** Record Director selection */
  selectDirector: (directorId: string, jobId: string, rawScores: { physics: number; vibe: number; logic: number }) => Promise<void>;
  /** Loading state */
  isAnalyzing: boolean;
  /** Error message */
  error: string | null;
  /** Raw scores from analysis */
  rawScores: { physics: number; vibe: number; logic: number } | null;
  /** Clear error */
  clearError: () => void;
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useLounge(): UseLoungeReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawScores, setRawScores] = useState<{ physics: number; vibe: number; logic: number } | null>(null);

  // tRPC mutations
  const analyze4DirectorsMutation = trpc.director.analyze4Directors.useMutation();
  const selectDirectorMutation = trpc.director.selectDirector.useMutation();

  // Analyze image with all 4 Directors
  const analyze = useCallback(async (imageUrl: string): Promise<DirectorPitchData[]> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyze4DirectorsMutation.mutateAsync({ imageUrl });

      setRawScores(result.rawScores);

      // Transform to DirectorPitchData format
      const directors: DirectorPitchData[] = result.directors.map((d) => ({
        id: d.id,
        name: d.name,
        avatar: d.avatar,
        archetype: d.archetype,
        quote: d.quote,
        stats: d.stats,
        engine: d.engine,
        riskLevel: d.riskLevel,
        commentary: d.commentary,
      }));

      return directors;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyze4DirectorsMutation]);

  // Record Director selection (learning event)
  const selectDirector = useCallback(async (
    directorId: string,
    jobId: string,
    scores: { physics: number; vibe: number; logic: number }
  ): Promise<void> => {
    try {
      await selectDirectorMutation.mutateAsync({
        jobId,
        directorId: directorId as 'newtonian' | 'visionary' | 'minimalist' | 'provocateur',
        rawScores: scores,
      });
      console.log('[useLounge] Director selection recorded:', directorId);
    } catch (err) {
      // Don't fail the selection if learning event fails
      console.error('[useLounge] Failed to record selection:', err);
    }
  }, [selectDirectorMutation]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    analyze,
    selectDirector,
    isAnalyzing,
    error,
    rawScores,
    clearError,
  };
}

export default useLounge;
