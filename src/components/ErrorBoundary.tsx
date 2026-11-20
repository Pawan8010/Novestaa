import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Novesta ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-16 text-[var(--color-ink)]"
        >
          <div className="novesta-card max-w-md p-8 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 text-[var(--color-error)]">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-[20px] font-medium text-[var(--color-text-tertiary)]">
              Something went wrong
            </h1>
            <p className="mt-2 text-[14px] leading-6 text-[var(--color-ink-secondary)]">
              We hit an unexpected issue loading this view. Reload the page to continue.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="resend-btn-primary mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-medium"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
