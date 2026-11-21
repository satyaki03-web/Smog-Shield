import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Catches unexpected React render errors and displays a calm recovery panel. */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <main className="max-w-[680px] mx-auto px-4 py-12">
          <section className="surface-card p-6" role="alert">
            <h1 className="text-2xl font-editorial font-medium">Smog Shield encountered a display issue</h1>
            <p className="mt-2 text-[15px]" style={{ color: 'var(--ink-secondary)' }}>
              Your local household profile is safe. Reset the view to continue checking today&apos;s air quality.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 min-h-[48px] px-5 py-2.5 rounded-[6px] text-sm font-bold cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-ink)',
              }}
            >
              Reload View
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
