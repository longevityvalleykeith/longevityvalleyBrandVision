/**
 * Phase 3C - Director Mode Hooks
 * 
 * Custom React hooks for the Video Director Mode functionality.
 * 
 * @module client/hooks/useDirector
 * @version 3.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import { trpc, getErrorMessage } from '../lib/trpc';
import type { 
  DirectorState, 
  RefineAction, 
  StylePreset,
} from '@/types';

// =============================================================================
// TYPES
// =============================================================================

interface UseDirectorOptions {
  jobId: string;
  /** Callback when director state changes */
  onStateChange?: (state: DirectorState) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

interface UseDirectorReturn {
  /** Current director state */
  state: DirectorState | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Initialize director mode */
  initialize: (forceRemaster?: boolean) => Promise<void>;
  /** Approve a scene */
  approveScene: (sceneId: string) => Promise<void>;
  /** Refine scenes */
  refineScenes: (refinements: RefineAction[]) => Promise<void>;
  /** Start production */
  startProduction: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
  /** Refresh state from server */
  refresh: () => Promise<void>;
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useDirector(options: UseDirectorOptions): UseDirectorReturn {
  const { jobId, onStateChange, onError } = options;
  
  const [state, setState] = useState<DirectorState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // tRPC mutations
  const initMutation = trpc.director.initDirector.useMutation();
  const refineMutation = trpc.director.refineStoryboard.useMutation();
  const approveMutation = trpc.director.approveScene.useMutation();
  const productionMutation = trpc.director.approveProduction.useMutation();

  // tRPC query for refreshing state
  const stateQuery = trpc.director.getDirectorState.useQuery(
    { jobId },
    { enabled: false } // Manual fetch only
  );

  // Combined loading state
  const isLoading = 
    initMutation.isPending || 
    refineMutation.isPending || 
    approveMutation.isPending ||
    productionMutation.isPending ||
    stateQuery.isFetching;

  // Handle state updates
  const handleStateUpdate = useCallback((newState: DirectorState) => {
    setState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  // Handle errors
  const handleError = useCallback((err: unknown) => {
    const message = getErrorMessage(err);
    setError(message);
    onError?.(message);
  }, [onError]);

  // Initialize director mode
  const initialize = useCallback(async (forceRemaster = false) => {
    setError(null);
    try {
      const result = await initMutation.mutateAsync({
        jobId,
        forceRemaster,
      });
      handleStateUpdate(result);
    } catch (err) {
      handleError(err);
    }
  }, [jobId, initMutation, handleStateUpdate, handleError]);

  // Approve a scene
  const approveScene = useCallback(async (sceneId: string) => {
    setError(null);
    try {
      const result = await approveMutation.mutateAsync({
        jobId,
        sceneId,
      });
      handleStateUpdate(result);
    } catch (err) {
      handleError(err);
    }
  }, [jobId, approveMutation, handleStateUpdate, handleError]);

  // Refine scenes
  const refineScenes = useCallback(async (refinements: RefineAction[]) => {
    setError(null);
    try {
      const result = await refineMutation.mutateAsync({
        jobId,
        refinements,
      });
      handleStateUpdate(result);
    } catch (err) {
      handleError(err);
    }
  }, [jobId, refineMutation, handleStateUpdate, handleError]);

  // Start production
  const startProduction = useCallback(async () => {
    // Guard: Ensure director state is initialized
    if (!state) {
      const message = 'Director state not initialized. Please refresh and try again.';
      setError(message);
      onError?.(message);
      return;
    }

    setError(null);
    const greenScenes = state.scenes.filter(s => s.status === 'GREEN');

    if (greenScenes.length === 0) {
      setError('At least one scene must be approved before starting production');
      return;
    }

    try {
      const result = await productionMutation.mutateAsync({
        jobId,
        confirmedSceneIds: greenScenes.map(s => s.id),
      });
      handleStateUpdate(result);
    } catch (err) {
      handleError(err);
    }
  }, [jobId, state, productionMutation, handleStateUpdate, handleError]);

  // Refresh state from server
  const refresh = useCallback(async () => {
    setError(null);
    try {
      const result = await stateQuery.refetch();
      if (result.data) {
        handleStateUpdate(result.data);
      }
    } catch (err) {
      handleError(err);
    }
  }, [stateQuery, handleStateUpdate, handleError]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    state,
    isLoading,
    error,
    initialize,
    approveScene,
    refineScenes,
    startProduction,
    clearError,
    refresh,
  };
}

// =============================================================================
// STYLE PRESETS HOOK
// =============================================================================

interface UseStylePresetsReturn {
  presets: StylePreset[];
  isLoading: boolean;
  error: string | null;
}

export function useStylePresets(): UseStylePresetsReturn {
  const query = trpc.director.getStylePresets.useQuery();

  return {
    presets: query.data || [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}

// =============================================================================
// POLLING HOOK FOR RENDERING STATUS
// =============================================================================

interface UseRenderingPollingOptions {
  jobId: number;
  enabled: boolean;
  interval?: number;
  onComplete?: (state: DirectorState) => void;
}

export function useRenderingPolling(options: UseRenderingPollingOptions) {
  const { jobId, enabled, interval = 5000, onComplete } = options;

  const query = trpc.director.getDirectorState.useQuery(
    { jobId },
    {
      enabled,
      refetchInterval: (query) => {
        // Stop polling when completed or failed
        const state = query.state.data;
        if (state?.stage === 'COMPLETED' || state?.error_message) {
          return false;
        }
        return interval;
      },
    }
  );

  // Call onComplete when rendering finishes
  useEffect(() => {
    if (query.data?.stage === 'COMPLETED') {
      onComplete?.(query.data);
    }
  }, [query.data?.stage, onComplete]);

  return {
    state: query.data,
    isPolling: query.isFetching,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}

// =============================================================================
// OPTIMISTIC UPDATE HOOK
// =============================================================================

/**
 * Hook for managing optimistic updates in the director
 */
export function useOptimisticDirector(jobId: number) {
  const utils = trpc.useUtils();

  const optimisticApprove = useCallback((sceneId: string) => {
    // Cancel any in-flight queries
    utils.director.getDirectorState.cancel({ jobId });

    // Snapshot previous state
    const previousState = utils.director.getDirectorState.getData({ jobId });

    // Optimistically update
    utils.director.getDirectorState.setData({ jobId }, (old) => {
      if (!old) return old;
      return {
        ...old,
        scenes: old.scenes.map(scene =>
          scene.id === sceneId 
            ? { ...scene, status: 'GREEN' as const }
            : scene
        ),
      };
    });

    return { previousState };
  }, [jobId, utils]);

  const rollback = useCallback((previousState: DirectorState | undefined) => {
    if (previousState) {
      utils.director.getDirectorState.setData({ jobId }, previousState);
    }
  }, [jobId, utils]);

  return {
    optimisticApprove,
    rollback,
  };
}
