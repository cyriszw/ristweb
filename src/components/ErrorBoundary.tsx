import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) { return { error }; }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-destructive mb-4">Something went wrong</h2>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap">{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
