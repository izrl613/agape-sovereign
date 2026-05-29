import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060D1F] flex items-center justify-center p-4">
          <div className="neon-border p-8 max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold text-[#FF2E9F] mb-4 font-display">System Breach Detected</h2>
            <p className="text-slate-300 mb-6">
              A critical error occurred in the Architect AI matrix.
            </p>
            <div className="bg-black/50 p-4 rounded-lg text-left overflow-auto max-h-48 text-sm font-mono text-red-400 mb-6">
              {(() => {
                try {
                  if (this.state.error?.message) {
                    const parsed = JSON.parse(this.state.error.message);
                    return (
                      <div>
                        <strong>Operation:</strong> {parsed.operationType}<br/>
                        <strong>Path:</strong> {parsed.path}<br/>
                        <strong>Error:</strong> {parsed.error}
                      </div>
                    );
                  }
                } catch (e) {
                  // Not JSON
                }
                return this.state.error?.message || "An unexpected system error occurred";
              })()}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-transparent border border-[#00D4FF] text-[#00D4FF] rounded-lg hover:bg-[#00D4FF]/10 transition-colors"
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
