/**
 * BrandScanner Component
 *
 * Production-ready brand image analysis interface.
 * Features accessible file upload, real-time status updates, and comprehensive error handling.
 *
 * @module client/components/BrandScanner
 * @version 3.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import type { BrandAnalysisData } from '@/server/utils/visionAdapter';
import FileDropzone from './FileDropzone';
import CircularProgress from './CircularProgress';
import { useAuth } from '@/client/useAuth';

export default function BrandScanner() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<BrandAnalysisData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

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
   * Retry failed analysis
   */
  const handleRetry = useCallback(() => {
    setAnalysisData(null);
    handleUpload();
  }, [handleUpload]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          Upload Image
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
          disabled={isUploading}
          className={`
            w-full py-3 sm:py-4 px-6 rounded-xl font-semibold text-white
            transition-all duration-200 ease-in-out
            ${
              isUploading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
            }
          `}
          aria-label={isUploading ? 'Analyzing...' : 'Analyze Brand'}
        >
          {isUploading ? 'Analyzing...' : 'Analyze Brand'}
        </button>
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
          </div>
        )}
      </div>
    </div>
  );
}
