import { Component, type ErrorInfo, type ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
  /** Human-readable name of the subsystem (e.g. "Timer", "Analytics", "Flashcards") */
  subsystem: string;
  /** Optional compact mode for inline sections rather than full-page */
  compact?: boolean;
  /** Optional fallback to render instead of the default error UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Granular error boundary for individual app subsystems.
 * Prevents a crash in one area (timer, analytics, flashcards) from
 * taking down the entire application.
 * 
 * Usage:
 *   <SubsystemErrorBoundary subsystem="Timer">
 *     <ZenClock />
 *   </SubsystemErrorBoundary>
 */
class SubsystemErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.subsystem}] Subsystem crash:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.props.compact) {
        return (
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="text-white/30 text-sm mb-3">
              {this.props.subsystem} encountered an issue
            </div>
            <button
              onClick={this.handleRetry}
              className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-xs transition-colors"
            >
              Retry
            </button>
          </div>
        );
      }

      return (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-6"
        >
          <div className="max-w-md w-full rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
              <span className="text-lg">⚡</span>
            </div>
            <h3 className="text-white/80 font-medium mb-2">
              {this.props.subsystem} Disrupted
            </h3>
            <p className="text-white/30 text-sm mb-4 leading-relaxed">
              Something went wrong in the {this.props.subsystem.toLowerCase()} module.
              Your other tools are unaffected.
            </p>
            {this.state.error && (
              <div className="bg-black/30 rounded-lg p-3 text-left border border-white/5 mb-4">
                <p className="text-red-400/60 font-mono text-xs truncate">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={this.handleRetry}
              className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default SubsystemErrorBoundary;
