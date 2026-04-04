import { Component, ErrorInfo, PropsWithChildren } from "react";

type State = { hasError: boolean };

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Frontend error boundary caught an error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center p-6 text-center">
          <div className="max-w-md rounded-3xl border border-line bg-panel p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-orange-300">Order Hub</p>
            <h1 className="mt-3 text-3xl font-semibold">Screen needs a refresh</h1>
            <p className="mt-3 text-sm text-slate-400">The dashboard hit an unexpected error. Reload the page to recover safely.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
