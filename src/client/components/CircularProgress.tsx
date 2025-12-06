/**
 * CircularProgress Component
 *
 * A reusable loading spinner with responsive sizing and customizable colors.
 * Supports multiple size variants and status-based coloring.
 *
 * @module client/components/CircularProgress
 * @version 3.0.0
 */

interface CircularProgressProps {
  /** Size variant of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Status-based color variant */
  status?: 'default' | 'processing' | 'error' | 'success';
  /** Optional label text displayed below spinner */
  label?: string;
  /** Custom className for additional styling */
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 border-2',
  md: 'w-12 h-12 border-2',
  lg: 'w-16 h-16 border-3',
  xl: 'w-24 h-24 border-4',
};

const COLOR_CLASSES = {
  default: 'border-purple-600',
  processing: 'border-blue-600',
  error: 'border-red-600',
  success: 'border-green-600',
};

const LABEL_COLOR_CLASSES = {
  default: 'text-purple-600',
  processing: 'text-blue-600',
  error: 'text-red-600',
  success: 'text-green-600',
};

export default function CircularProgress({
  size = 'md',
  status = 'default',
  label,
  className = '',
}: CircularProgressProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Spinner */}
      <div
        className={`
          animate-spin rounded-full border-b-transparent
          ${SIZE_CLASSES[size]}
          ${COLOR_CLASSES[status]}
        `}
        role="status"
        aria-label={label || 'Loading'}
      >
        <span className="sr-only">{label || 'Loading...'}</span>
      </div>

      {/* Label */}
      {label && (
        <p
          className={`
            text-sm sm:text-base md:text-lg font-medium
            ${LABEL_COLOR_CLASSES[status]}
          `}
        >
          {label}
        </p>
      )}
    </div>
  );
}
