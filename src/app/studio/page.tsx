/**
 * The Director's Studio
 *
 * Route: /studio (renamed from /lounge)
 *
 * Full Director Experience - Complete brand content creation journey:
 * - Upload brand assets
 * - Receive pitches from 4 Rashomon Directors
 * - Select Director and approve scenes
 * - Route to video production
 *
 * @module app/studio/page
 * @version 2.0.0 - Renamed from Lounge to Studio
 */

'use client';

import React, { useCallback, useState } from 'react';
import { TheLounge } from '@/client/components/lounge';

export default function StudioPage(): JSX.Element {
  const [productionData, setProductionData] = useState<{
    directorId: string;
    imageUrl: string;
    timestamp: number;
  } | null>(null);

  /**
   * Director selection handler
   * Stores selection data for video production handoff to Launchpad
   */
  const handleDirectorSelected = useCallback((directorId: string, imageUrl: string) => {
    console.log(`[StudioPage] Director finalized: ${directorId}`);
    console.log(`[StudioPage] Image URL: ${imageUrl}`);

    // Store production data for handoff
    const data = {
      directorId,
      imageUrl,
      timestamp: Date.now(),
    };
    setProductionData(data);

    // Store in sessionStorage for Launchpad handoff
    try {
      sessionStorage.setItem('productionHandoff', JSON.stringify(data));
      console.log('[StudioPage] Production data stored for Launchpad handoff');
    } catch (err) {
      console.error('[StudioPage] Failed to store production data:', err);
    }

    // Future: Navigate to Launchpad for deployment
    // router.push(`/launchpad?director=${directorId}`);
  }, []);

  return <TheLounge onDirectorSelected={handleDirectorSelected} />;
}
