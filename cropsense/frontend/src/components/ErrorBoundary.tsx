/**
 * ErrorBoundary.tsx — Global React error boundary.
 *
 * Catches unhandled runtime errors in the component tree and shows
 * a graceful fallback UI instead of crashing the entire application.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CropSense ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-serif text-2xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-500 font-sans text-sm mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="h-[40px] px-6 bg-black text-white font-sans text-sm uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
