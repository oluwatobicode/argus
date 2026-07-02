import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureException } from "@argus/sdk-browser";

interface Props {
  children?: ReactNode;
  /* what to render after a crash — defaults to nothing */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/*
 * Usage:
 *   <ArgusErrorBoundary fallback={<p>Something went wrong</p>}>
 *     <App />
 *   </ArgusErrorBoundary>
 *
 * React render crashes don't reach window.onerror in production builds —
 * boundaries are the only reliable hook, and they must be class components
 * (React exposes componentDidCatch nowhere else).
 */
export class ArgusErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void captureException(error, {
      /* componentStack is the React tree path to the crash — goldmine for debugging */
      tags: info.componentStack
        ? { componentStack: info.componentStack.trim().split("\n")[0] ?? "" }
        : undefined,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
