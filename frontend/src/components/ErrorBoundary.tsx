import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-semibold text-buildcycle-gray-800">Something went wrong</h2>
          <p className="text-sm text-buildcycle-gray-500 max-w-sm">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: "" })}
            className="mt-2 px-4 py-2 bg-buildcycle-orange-600 text-white text-sm rounded-lg hover:bg-buildcycle-orange-700 transition"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
