/**
 * FileDropzone Component
 *
 * Accessible file upload component with drag-and-drop support.
 * Features keyboard navigation, ARIA attributes, and visual feedback.
 *
 * @module client/components/FileDropzone
 * @version 3.0.0
 */

import { useCallback, useState, useRef } from 'react';

interface FileDropzoneProps {
  /** Callback when file is selected */
  onFileSelect: (file: File) => void;
  /** Accepted file types (MIME types) */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Current preview URL if file is selected */
  preview?: string | null;
  /** Whether upload is in progress */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

export default function FileDropzone({
  onFileSelect,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 10 * 1024 * 1024, // 10MB default
  preview,
  disabled = false,
  className = '',
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate and process file
   */
  const processFile = useCallback(
    (file: File) => {
      setError(null);

      // Validate file type
      const acceptedTypes = accept.split(',').map((t) => t.trim());
      if (!acceptedTypes.includes(file.type)) {
        setError(`Invalid file type. Please upload: ${acceptedTypes.join(', ')}`);
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        setError(`File size must be less than ${maxSizeMB}MB`);
        return;
      }

      onFileSelect(file);
    },
    [accept, maxSize, onFileSelect]
  );

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [disabled, processFile]
  );

  /**
   * Handle keyboard activation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    []
  );

  /**
   * Handle click
   */
  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div className={className}>
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload file"
        aria-describedby="file-upload-description"
        className={`
          relative flex flex-col items-center justify-center
          w-full h-48 sm:h-56 md:h-64
          border-2 border-dashed rounded-xl
          transition-all duration-200 ease-in-out
          ${
            disabled
              ? 'cursor-not-allowed bg-gray-100 border-gray-300'
              : isDragging
              ? 'cursor-pointer bg-purple-50 border-purple-500 scale-[1.02]'
              : 'cursor-pointer bg-gray-50 border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
          }
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {preview ? (
          /* Preview Image */
          <div className="relative w-full h-full p-4">
            <img
              src={preview}
              alt="Selected file preview"
              className="max-h-full max-w-full object-contain mx-auto rounded-lg"
            />
            {!disabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors rounded-xl">
                <p className="text-white opacity-0 hover:opacity-100 font-medium">
                  Click to change
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Upload Prompt */
          <div className="flex flex-col items-center px-4 py-6">
            <svg
              className={`
                w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-3 sm:mb-4
                transition-colors
                ${isDragging ? 'text-purple-500' : 'text-gray-400'}
              `}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p
              className={`
                text-sm sm:text-base md:text-lg font-medium text-center
                ${isDragging ? 'text-purple-600' : 'text-gray-600'}
              `}
            >
              {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
            </p>
            <p
              id="file-upload-description"
              className="text-xs sm:text-sm text-gray-500 mt-2 text-center"
            >
              JPEG, PNG, or WebP (max {(maxSize / (1024 * 1024)).toFixed(0)}MB)
            </p>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          aria-label="File upload input"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
