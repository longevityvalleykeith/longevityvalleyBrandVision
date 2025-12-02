/**
 * Phase 3 - Error Boundary Components
 * 
 * Implements P0 Critical: Add error boundaries to React components
 * 
 * @module client/components/ErrorBoundary
 * @version 3.0.0
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback UI to render when an error occurs */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Key to reset the error boundary */
  resetKey?: string | number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// =============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// =============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, send to error tracking service
    // Example: Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error, { extra: errorInfo });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state when resetKey changes
    if (
      this.state.hasError &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props;
      const { error } = this.state;

      // Custom fallback renderer
      if (typeof fallback === 'function') {
        return fallback(error!, this.reset);
      }

      // Static fallback
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return <DefaultErrorFallback error={error!} onReset={this.reset} />;
    }

    return this.props.children;
  }
}

// =============================================================================
// DEFAULT ERROR FALLBACK UI
// =============================================================================

interface DefaultErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps): JSX.Element {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="error-boundary-fallback" role="alert">
      <div className="error-boundary-content">
        <div className="error-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        
        <h2 className="error-title">Something went wrong</h2>
        
        <p className="error-message">
          {isDev ? error.message : 'An unexpected error occurred. Please try again.'}
        </p>

        {isDev && (
          <pre className="error-stack">
            {error.stack}
          </pre>
        )}

        <div className="error-actions">
          <button onClick={onReset} className="error-button primary">
            Try Again
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="error-button secondary"
          >
            Reload Page
          </button>
        </div>
      </div>

      <style>{`
        .error-boundary-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          padding: 24px;
          background: #fef2f2;
          border-radius: 8px;
          margin: 16px;
        }

        .error-boundary-content {
          text-align: center;
          max-width: 500px;
        }

        .error-icon {
          color: #dc2626;
          margin-bottom: 16px;
        }

        .error-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #991b1b;
          margin: 0 0 8px;
        }

        .error-message {
          color: #7f1d1d;
          margin: 0 0 16px;
        }

        .error-stack {
          text-align: left;
          font-size: 0.75rem;
          background: #1f2937;
          color: #f9fafb;
          padding: 12px;
          border-radius: 4px;
          overflow-x: auto;
          max-height: 200px;
          margin-bottom: 16px;
        }

        .error-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .error-button {
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .error-button.primary {
          background: #dc2626;
          color: white;
        }

        .error-button.primary:hover {
          background: #b91c1c;
        }

        .error-button.secondary {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .error-button.secondary:hover {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// SPECIALIZED ERROR BOUNDARIES
// =============================================================================

/**
 * Error boundary specifically for async operations
 */
export function AsyncErrorBoundary({ 
  children,
  onError,
}: {
  children: ReactNode;
  onError?: (error: Error) => void;
}): JSX.Element {
  return (
    <ErrorBoundary
      onError={(error) => onError?.(error)}
      fallback={(error, reset) => (
        <AsyncErrorFallback error={error} onRetry={reset} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

function AsyncErrorFallback({ 
  error, 
  onRetry 
}: { 
  error: Error; 
  onRetry: () => void; 
}): JSX.Element {
  return (
    <div className="async-error">
      <p>Failed to load: {error.message}</p>
      <button onClick={onRetry}>Retry</button>
      <style>{`
        .async-error {
          padding: 16px;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          text-align: center;
        }
        .async-error button {
          margin-top: 8px;
          padding: 6px 12px;
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

/**
 * Error boundary for Director Mode components
 */
export function DirectorErrorBoundary({ 
  children,
  jobId,
}: {
  children: ReactNode;
  jobId?: number;
}): JSX.Element {
  return (
    <ErrorBoundary
      resetKey={jobId}
      onError={(error, info) => {
        console.error(`Director error for job ${jobId}:`, error, info);
      }}
      fallback={(error, reset) => (
        <div className="director-error">
          <h3>Director Mode Error</h3>
          <p>There was a problem with the video director. Your progress has been saved.</p>
          <button onClick={reset}>Return to Storyboard</button>
          <style>{`
            .director-error {
              padding: 24px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-radius: 12px;
              text-align: center;
            }
            .director-error h3 {
              margin: 0 0 8px;
            }
            .director-error p {
              opacity: 0.9;
              margin: 0 0 16px;
            }
            .director-error button {
              padding: 10px 20px;
              background: white;
              color: #667eea;
              border: none;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
            }
          `}</style>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// =============================================================================
// HOOK FOR FUNCTIONAL COMPONENTS
// =============================================================================

/**
 * Hook to manually trigger error boundary
 */
export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error | null>(null);

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ErrorBoundary;
