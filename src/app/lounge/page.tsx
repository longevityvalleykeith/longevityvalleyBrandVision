/**
 * Phase 4 - The Director's Lounge Page
 *
 * Route: /lounge
 *
 * Main entry point for the Director selection UI.
 * Users upload brand assets and receive pitches from 4 Directors.
 *
 * @module app/lounge/page
 * @version 1.1.0
 */

'use client';

import React, { useCallback, useState } from 'react';
import { TheLounge } from '@/client/components/lounge';

export default function LoungePage(): JSX.Element {
  const [productionData, setProductionData] = useState<{
    directorId: string;
    imageUrl: string;
    timestamp: number;
  } | null>(null);

  /**
   * P0-1 FIX: Implement actual director selection handler
   * Stores selection data for video production handoff
   */
  const handleDirectorSelected = useCallback((directorId: string, imageUrl: string) => {
    console.log(`[LoungePage] Director finalized: ${directorId}`);
    console.log(`[LoungePage] Image URL: ${imageUrl}`);

    // Store production data for handoff
    const data = {
      directorId,
      imageUrl,
      timestamp: Date.now(),
    };
    setProductionData(data);

    // Store in sessionStorage for potential page refresh or navigation
    try {
      sessionStorage.setItem('productionHandoff', JSON.stringify(data));
      console.log('[LoungePage] Production data stored for handoff');
    } catch (err) {
      console.error('[LoungePage] Failed to store production data:', err);
    }

    // Future: Navigate to video production page
    // router.push(`/production?director=${directorId}`);
  }, []);

  return <TheLounge onDirectorSelected={handleDirectorSelected} />;
}
