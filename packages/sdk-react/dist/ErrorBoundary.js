import { Component } from "react";
import { captureException } from "@argusdev/sdk-browser";
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
export class ArgusErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        void captureException(error, {
            /* componentStack is the React tree path to the crash — goldmine for debugging */
            tags: info.componentStack
                ? { componentStack: info.componentStack.trim().split("\n")[0] ?? "" }
                : undefined,
        });
    }
    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}
//# sourceMappingURL=ErrorBoundary.js.map