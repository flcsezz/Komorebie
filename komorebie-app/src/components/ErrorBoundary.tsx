import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-8">
          <div className="max-w-2xl w-full glass rounded-3xl p-12 border border-white/10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 backdrop-blur-3xl" />
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8">
                <span className="text-3xl">🌿</span>
              </div>
              <h1 className="text-3xl font-display font-light text-white mb-4">Harmony Interrupted</h1>
              <p className="text-white/40 mb-8 max-w-md mx-auto leading-relaxed">
                An unexpected disruption occurred in your sanctuary. Please refresh the page to restore balance.
              </p>
              
              {this.state.error && (
                <div className="bg-black/40 rounded-2xl p-6 text-left border border-white/5 mb-8 overflow-auto max-h-64 custom-scrollbar">
                  <p className="text-red-400/80 font-mono text-sm mb-4">{this.state.error.toString()}</p>
                  <pre className="text-white/30 font-mono text-xs whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
              
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors"
              >
                Restore Sanctuary
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
