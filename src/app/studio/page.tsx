'use client';

/**
 * Studio Page - BrandScanner Integration
 *
 * Upload images for brand analysis and view results.
 * Refactored to use production-ready BrandScanner component.
 *
 * @module app/studio
 * @version 3.1.0
 */

import BrandScanner from '@/client/components/BrandScanner';

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            BrandScanner Studio
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your brand visuals for AI-powered analysis
          </p>
        </header>

        {/* Main Content */}
        <BrandScanner />
      </div>
    </div>
  );
}
