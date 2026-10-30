import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    console.error('CRITICAL VISION ERROR CAUGHT:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060509] text-[#EDE8E1] flex flex-col items-center justify-center p-8 text-center font-mono">
          <div className="max-w-xl w-full border border-red-500/30 bg-[#0d0b14] p-8 space-y-4 text-left">
            <div className="flex items-center gap-3 border-b border-red-500/20 pb-3">
              <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse"></span>
              <h2 className="text-xs tracking-[0.2em] uppercase text-white font-bold">
                DIAGNOSTIC EXCEPTION CAUGHT
              </h2>
            </div>
            <div className="p-3 bg-black/60 border border-white/10 text-red-300 text-[11px] font-mono whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
              <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
              {'\n\n'}
              <strong>Stack:</strong>
              {'\n'}
              {this.state.error?.stack || 'No stack trace available'}
            </div>
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-6 py-2 border border-purple-400 text-white text-[10px] tracking-[0.2em] uppercase hover:bg-purple-950/40 transition-all"
              >
                RELOAD INTERFACE
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
