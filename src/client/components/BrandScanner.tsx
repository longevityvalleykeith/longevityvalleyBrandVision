/**
 * BrandScanner Component
 *
 * Production-ready brand image analysis interface.
 * Features accessible file upload, brand context form, real-time status updates,
 * and comprehensive error handling.
 *
 * Phase 3 Enhancement: Added BrandContextForm for user-provided context
 * to enhance Brand DNA extraction accuracy.
 *
 * @module client/components/BrandScanner
 * @version 3.1.0
 */

import { useState, useCallback, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import type { BrandAnalysisData } from '@/server/utils/visionAdapter';
import type { CulturalContextInput, InputQualityAssessment } from '@/types/cultural';
import FileDropzone from './FileDropzone';
import CircularProgress from './CircularProgress';
import BrandContextForm, { type BrandContext } from './BrandContextForm';
import { useAuth } from '@/client/useAuth';

export default function BrandScanner() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<BrandAnalysisData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [brandContext, setBrandContext] = useState<BrandContext | null>(null);
  const [culturalContext, setCulturalContext] = useState<CulturalContextInput | null>(null);
  const [inputQuality, setInputQuality] = useState<InputQualityAssessment | null>(null);
  const [showContextForm, setShowContextForm] = useState(true);

  const { isAuthenticated, ensureSystemUser, getAccessToken } = useAuth();

  // Auto-authenticate on mount (demo mode)
  useEffect(() => {
    async function initAuth() {
      if (!isAuthenticated) {
        console.log('[BrandScanner] No auth, fetching system user...');
        try {
          const userId = await ensureSystemUser();
          console.log('[BrandScanner] Got system user:', userId);
        } catch (error) {
          console.error('[BrandScanner] Failed to get system user:', error);
        }
      }
      setIsAuthReady(true);
    }
    initAuth();
  }, [isAuthenticated, ensureSystemUser]);

  // tRPC mutations
  const uploadMutation = trpc.vision.uploadImage.useMutation({
    onSuccess: (data) => {
      setAnalysisData(data);
      setIsUploading(false);
    },
    onError: (error) => {
      console.error('[BrandScanner] Upload failed:', error.message);
      setIsUploading(false);
      setAnalysisData({
        jobId: '',
        imageUrl: '',
        status: 'failed',
        errorMessage: error.message || 'Upload failed',
        quality: { score: 0, integrity: 0 },
        brandIdentity: { colors: [], mood: '', typography: '', industry: '' },
        composition: { layout: '', focalPoints: [], styleKeywords: [] },
        createdAt: new Date(),
      });
    },
  });

  const getJobQuery = trpc.vision.getJob.useQuery(
    { jobId: analysisData?.jobId || '' },
    {
      enabled: !!analysisData?.jobId && (analysisData?.status === 'processing' || analysisData?.status === 'pending'),
      refetchInterval: 3000, // Poll every 3 seconds
    }
  );

  // Update analysis data when query returns new data
  useEffect(() => {
    if (getJobQuery.data) {
      setAnalysisData(getJobQuery.data);
    }
  }, [getJobQuery.data]);

  /**
   * Handle file upload with optional file override
   * Accepts fileOverride to bypass state latency
   */
  const handleUpload = useCallback(async (fileOverride?: File | React.MouseEvent) => {
    // Guard against Event objects being passed (e.g., from onClick handlers)
    const validFile = fileOverride instanceof Blob ? fileOverride : undefined;

    // Use override if provided, otherwise fall back to state
    const activeFile = validFile || selectedFile;

    if (!activeFile) {
      return;
    }

    // Runtime validation before FileReader
    if (!(activeFile instanceof Blob)) {
      return;
    }

    setIsUploading(true);

    // Convert file to base64
    const reader = new FileReader();

    reader.onload = async (e) => {
      const base64Data = (e.target?.result as string).split(',')[1];

      if (!base64Data) {
        setIsUploading(false);
        setAnalysisData({
          jobId: '',
          imageUrl: '',
          status: 'failed',
          errorMessage: 'Failed to read file data',
          quality: { score: 0, integrity: 0 },
          brandIdentity: { colors: [], mood: '', typography: '', industry: '' },
          composition: { layout: '', focalPoints: [], styleKeywords: [] },
          createdAt: new Date(),
        });
        return;
      }

      uploadMutation.mutate({
        filename: activeFile.name,
        mimeType: activeFile.type,
        data: base64Data,
        brandContext: brandContext || undefined,
        culturalContext: culturalContext || undefined,
      });
    };

    reader.onerror = () => {
      console.error('[BrandScanner] Failed to read file');
      setIsUploading(false);
    };

    reader.readAsDataURL(activeFile);
  }, [selectedFile, uploadMutation]);

  /**
   * Handle file selection from dropzone
   * Passes file directly to handleUpload to bypass state latency
   */
  const handleFileSelect = useCallback((file: File) => {
    // Update UI state
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear previous analysis
    setAnalysisData(null);

    // PASS DIRECTLY - Do not wait for state
    handleUpload(file);
  }, [handleUpload]);

  /**
   * Handle brand context form changes (with quality assessment)
   */
  const handleContextChange = useCallback((context: BrandContext, quality?: InputQualityAssessment) => {
    setBrandContext(context);
    if (quality) {
      setInputQuality(quality);
    }
  }, []);

  /**
   * Handle cultural context changes from LanguageSwitcher
   */
  const handleCulturalContextChange = useCallback((context: CulturalContextInput) => {
    setCulturalContext(context);
  }, []);

  /**
   * Check if minimum required context is provided
   */
  const hasRequiredContext = brandContext?.productInfo?.trim() && brandContext?.sellingPoints?.trim();

  /**
   * Retry failed analysis
   */
  const handleRetry = useCallback(() => {
    setAnalysisData(null);
    handleUpload();
  }, [handleUpload]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Brand Context Form - Collapsible */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <button
          onClick={() => setShowContextForm(!showContextForm)}
          className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div className="text-left">
              <h2 className="text-lg font-bold text-gray-900">Brand Context</h2>
              <p className="text-sm text-gray-600">
                {hasRequiredContext ? 'Context provided' : 'Add details for better analysis'}
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${showContextForm ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showContextForm && (
          <div className="p-6 sm:p-8 border-t border-gray-100">
            <BrandContextForm
              onChange={handleContextChange}
              onCulturalContextChange={handleCulturalContextChange}
              initialValues={brandContext || undefined}
              isLoading={isUploading}
              compact={false}
            />
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            Upload Brand Asset
          </h2>

          {/* File Dropzone */}
          <FileDropzone
            onFileSelect={handleFileSelect}
            preview={preview}
            disabled={isUploading}
            className="mb-4 sm:mb-6"
          />

          <button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className={`
              w-full py-3 sm:py-4 px-6 rounded-xl font-semibold text-white
              transition-all duration-200 ease-in-out
              ${
                isUploading || !selectedFile
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
              }
            `}
            aria-label={isUploading ? 'Analyzing...' : 'Analyze Brand'}
          >
            {isUploading ? 'Analyzing...' : 'Analyze Brand'}
          </button>

          {/* Context Status Indicator */}
          {selectedFile && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${hasRequiredContext ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              {hasRequiredContext ? (
                <span className="flex items-center gap-2">
                  <span>✓</span> Brand context will enhance analysis
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>💡</span> Add brand context above for better results
                </span>
              )}
            </div>
          )}
        </div>

      {/* Results Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          Analysis Results
        </h2>

        {/* State: No Analysis */}
        {!analysisData ? (
          <div className="flex flex-col items-center justify-center h-48 sm:h-56 md:h-64 text-gray-400">
            <svg
              className="w-16 h-16 sm:w-20 sm:h-20 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-base sm:text-lg text-center px-4">Upload an image to see analysis</p>
          </div>
        ) : analysisData.status === 'pending' || analysisData.status === 'processing' ? (
          /* State: Processing */
          <div className="flex items-center justify-center h-48 sm:h-56 md:h-64">
            <CircularProgress
              size="lg"
              status="processing"
              label="Analyzing your brand..."
            />
          </div>
        ) : analysisData.status === 'failed' ? (
          /* State: Error (Red) */
          <div className="flex flex-col items-center justify-center h-48 sm:h-56 md:h-64">
            <div className="relative mb-6">
              {/* Red error circle with icon */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-100 border-4 border-red-600 flex items-center justify-center">
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              {/* Pulse animation */}
              <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-600 animate-ping opacity-20"></div>
            </div>

            {/* Error message */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 max-w-md">
              <h3 className="text-base sm:text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                Analysis Failed
              </h3>
              <p className="text-sm sm:text-base text-red-700 mb-4">
                {analysisData.errorMessage || 'An error occurred during analysis'}
              </p>
              <button
                onClick={handleRetry}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Retry Analysis
              </button>
            </div>
          </div>
        ) : (
          /* State: Success */
          <div className="space-y-4 sm:space-y-6">
            {/* Quality Score */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mb-2">
                Quality Score
              </h3>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl font-bold text-purple-600">
                  {analysisData.quality.score.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">/ 10</div>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${(analysisData.quality.score / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Brand Colors */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mb-2">
                Brand Colors
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysisData.brandIdentity.colors.slice(0, 5).map((color, i) => (
                  <div
                    key={i}
                    className="group relative"
                  >
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg shadow-md hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-mono bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap">
                        {color}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mood & Industry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mb-2">
                  Mood
                </h3>
                <p className="text-base sm:text-lg text-gray-900 font-medium">
                  {analysisData.brandIdentity.mood}
                </p>
              </div>
              {analysisData.brandIdentity.industry && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mb-2">
                    Industry
                  </h3>
                  <p className="text-base sm:text-lg text-gray-900 font-medium">
                    {analysisData.brandIdentity.industry}
                  </p>
                </div>
              )}
            </div>

            {/* Style Keywords */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mb-2">
                Style Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysisData.composition.styleKeywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm font-medium hover:bg-purple-200 transition-colors"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Brand Integrity Health Check */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mb-4">
                Brand Integrity Check
              </h3>
              <div className="flex items-center gap-4">
                {/* Integrity Score Circle */}
                <div className={`relative w-20 h-20 rounded-full flex items-center justify-center ${
                  analysisData.quality.integrity >= 0.8
                    ? 'bg-green-100 border-4 border-green-500'
                    : analysisData.quality.integrity >= 0.6
                      ? 'bg-yellow-100 border-4 border-yellow-500'
                      : 'bg-red-100 border-4 border-red-500'
                }`}>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${
                      analysisData.quality.integrity >= 0.8
                        ? 'text-green-700'
                        : analysisData.quality.integrity >= 0.6
                          ? 'text-yellow-700'
                          : 'text-red-700'
                    }`}>
                      {Math.round(analysisData.quality.integrity * 100)}%
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                <div className="flex-1">
                  <div className={`text-lg font-bold ${
                    analysisData.quality.integrity >= 0.8
                      ? 'text-green-700'
                      : analysisData.quality.integrity >= 0.6
                        ? 'text-yellow-700'
                        : 'text-red-700'
                  }`}>
                    {analysisData.quality.integrity >= 0.8
                      ? '✓ Brand Ready for Production'
                      : analysisData.quality.integrity >= 0.6
                        ? '⚠ Minor Adjustments Recommended'
                        : '✗ Needs Brand Refinement'}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {analysisData.quality.integrity >= 0.8
                      ? 'Your brand assets meet quality standards for video production.'
                      : analysisData.quality.integrity >= 0.6
                        ? 'Consider enhancing image quality or brand clarity.'
                        : 'Upload higher quality brand assets for best results.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Essence Summary */}
            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
              <h3 className="text-xs sm:text-sm font-semibold text-indigo-700 uppercase mb-3">
                Brand Essence Analysis
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Industry:</strong> {analysisData.brandIdentity.industry || 'Detected automatically'}</p>
                <p><strong>Mood:</strong> {analysisData.brandIdentity.mood}</p>
                <p><strong>Visual Style:</strong> {analysisData.composition.styleKeywords.slice(0, 3).join(', ')}</p>
              </div>
            </div>

            {/* CTA - Proceed to Director's Studio */}
            {analysisData.quality.integrity >= 0.6 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    // Pass analysis data and brand context to /studio
                    // Note: Don't store preview (base64) - use imageUrl instead to avoid quota errors
                    sessionStorage.setItem('studioTransition', JSON.stringify({
                      analysisData,
                      brandContext,
                      culturalContext,
                      inputQuality,
                      imageUrl: analysisData.imageUrl,
                      timestamp: Date.now(),
                    }));
                    // Navigate to studio with carousel view
                    window.location.href = '/studio';
                  }}
                  className="block w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-center rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 cursor-pointer"
                >
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-xl">🎬</span>
                    <span>Meet Your AI Directors</span>
                    <span className="text-xl">→</span>
                  </span>
                  <span className="block text-sm font-normal opacity-80 mt-1">
                    Carousel of 4 Personalized Pitches
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
