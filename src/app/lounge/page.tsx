/**
 * Phase 4 - The Director's Lounge Page
 *
 * Route: /lounge
 *
 * Main entry point for the Director selection UI.
 * Users upload brand assets and receive pitches from 4 Directors.
 *
 * @module app/lounge/page
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { TheLounge } from '@/client/components/lounge';

export default function LoungePage(): JSX.Element {
  const handleDirectorSelected = (directorId: string, imageUrl: string) => {
    console.log(`Director selected: ${directorId}`);
    console.log(`Image URL: ${imageUrl}`);
    // TODO: Navigate to video production page or trigger production workflow
    // router.push(`/studio?director=${directorId}&image=${encodeURIComponent(imageUrl)}`);
  };

  return <TheLounge onDirectorSelected={handleDirectorSelected} />;
}
