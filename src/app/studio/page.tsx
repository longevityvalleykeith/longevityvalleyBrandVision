'use client';

/**
 * Studio Page - BrandScanner Integration
 *
 * Upload images for brand analysis and view results.
 *
 * @module app/studio
 * @version 3.0.0
 */

import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import type { BrandAnalysisData } from '@/server/utils/visionAdapter';

export default function StudioPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<BrandAnalysisData | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // tRPC mutations
  const uploadMutation = trpc.vision.uploadImage.useMutation({
    onSuccess: (data) => {
      setAnalysisData(data);
      setIsUploading(false);
      // Start polling for completion
      pollForCompletion(data.jobId);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setIsUploading(false);
      alert(`Upload failed: ${error.message}`);
    },
  });

  const getJobQuery = trpc.vision.getJob.useQuery(
    { jobId: analysisData?.jobId || '' },
    {
      enabled: !!analysisData?.jobId && (analysisData?.status === 'processing' || analysisData?.status === 'pending'),
      refetchInterval: 3000, // Poll every 3 seconds
    }
  );

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  /**
   * Handle file upload
   */
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = (e.target?.result as string).split(',')[1];

      if (!base64Data) {
        alert('Failed to read file data');
        setIsUploading(false);
        return;
      }

      uploadMutation.mutate({
        filename: selectedFile.name,
        mimeType: selectedFile.type,
        data: base64Data,
      });
    };
    reader.readAsDataURL(selectedFile);
  }, [selectedFile, uploadMutation]);

  /**
   * Poll for job completion
   */
  const pollForCompletion = useCallback((jobId: string) => {
    const interval = setInterval(async () => {
      // Query will auto-update via tRPC
      if (getJobQuery.data && getJobQuery.data.status === 'completed') {
        setAnalysisData(getJobQuery.data);
        clearInterval(interval);
      }
    }, 3000);

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  }, [getJobQuery.data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            BrandScanner Studio
          </h1>
          <p className="text-xl text-gray-600">
            Upload your brand visuals for AI-powered analysis
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Upload Image
            </h2>

            {/* File Input */}
            <div className="mb-6">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition-colors bg-gray-50"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-16 h-16 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-gray-600 font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      JPEG, PNG, or WebP (max 10MB)
                    </p>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all ${
                !selectedFile || isUploading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 active:scale-95'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Analyze Brand'}
            </button>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Analysis Results
            </h2>

            {!analysisData ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg
                  className="w-20 h-20 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-lg">Upload an image to see analysis</p>
              </div>
            ) : analysisData.status === 'pending' || analysisData.status === 'processing' ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-lg text-gray-600">Analyzing your brand...</p>
              </div>
            ) : analysisData.status === 'failed' ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <p className="text-red-600 font-medium">
                  {analysisData.errorMessage || 'Analysis failed'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quality Score */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Quality Score
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-purple-600">
                      {analysisData.quality.score.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">/ 10</div>
                  </div>
                </div>

                {/* Brand Colors */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Brand Colors
                  </h3>
                  <div className="flex gap-2">
                    {analysisData.brandIdentity.colors.slice(0, 5).map((color, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-lg shadow-md"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Mood */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Mood
                  </h3>
                  <p className="text-lg text-gray-900">
                    {analysisData.brandIdentity.mood}
                  </p>
                </div>

                {/* Style Keywords */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Style Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.composition.styleKeywords.map((keyword, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
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
      </div>
    </div>
  );
}
