import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[Studio ErrorBoundary Captured Exception]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env ? import.meta.env.DEV : process.env.NODE_ENV === 'development';

      return (
        <div className="w-screen h-screen flex items-center justify-center bg-stone-900 text-stone-100 p-6 font-sans select-none">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700/80 rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-stone-100">Studio Render Error</h2>
              <p className="text-xs text-stone-400">
                An unexpected runtime error occurred in the editor interface.
              </p>
            </div>

            {/* Development-only Technical Log */}
            {isDev && this.state.error && (
              <div className="w-full text-left bg-stone-950/80 border border-stone-800 rounded-lg p-3 text-xs font-mono text-red-400 max-h-40 overflow-y-auto space-y-1">
                <div className="font-semibold text-red-300">{this.state.error.toString()}</div>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-stone-500 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#c25e40] hover:bg-[#a84e32] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleResetAndReload}
                className="py-2.5 px-4 bg-stone-700/80 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                title="Clear local session cache and reload"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
