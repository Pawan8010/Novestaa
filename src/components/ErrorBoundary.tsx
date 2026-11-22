import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PDFIndia ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex min-h-screen items-center justify-center p-4"
          style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-navy)' }}
        >
          <div className="pdf-card max-w-md space-y-4 p-8 text-center">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px]"
              style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)' }}
            >
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-bold">Something went wrong</h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              An unexpected error occurred in your browser tab. Reload the page to reset the workspace safely—your files were never uploaded.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="pdf-btn-primary inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload PDFIndia
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
