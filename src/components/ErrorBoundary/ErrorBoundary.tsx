import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Oops! Something went wrong
                </h2>
                {this.props.context && (
                  <p className="text-foreground-dim">
                    Error in: {this.props.context}
                  </p>
                )}
                <p className="text-foreground-dim">
                  Apologies, we'll get it fixed soon.
                </p>
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <details className="mt-4 text-left text-sm text-foreground-dim">
                    <summary className="cursor-pointer font-medium">
                      Error details
                    </summary>
                    <div className="mt-2 p-3 bg-card rounded-md overflow-auto max-h-60">
                      <p className="font-mono text-sm">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo?.componentStack && (
                        <pre className="mt-2 text-xs opacity-75 overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}
              </div>
              <button
                onClick={this.handleRefresh}
                className="mt-4 px-4 py-2 bg-transparent border border-foreground/20 rounded-md text-foreground hover:bg-foreground/10 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  context?: string
) => {
  return (props: P) => (
    <ErrorBoundary context={context}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
