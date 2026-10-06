import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('tenderpack_project_state');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-page text-primary">
          <div className="max-w-md w-full bg-surface border border-border rounded-xl p-6 shadow-sm text-center">
            <h2 className="text-lg font-semibold text-primary mb-2">
              Something went wrong / একটি সমস্যা দেখা দিয়েছে
            </h2>
            <p className="text-sm text-muted mb-4">
              {this.state.error?.message || 'An unexpected error occurred in TenderPack.'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-primary text-surface rounded-md font-medium text-sm hover:opacity-90"
            >
              Reset and Reload / পুনরায় লোড করুন
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
