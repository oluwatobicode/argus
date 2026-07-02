import { Component, type ErrorInfo, type ReactNode } from "react";
interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}
interface State {
    hasError: boolean;
}
export declare class ArgusErrorBoundary extends Component<Props, State> {
    state: State;
    static getDerivedStateFromError(): State;
    componentDidCatch(error: Error, info: ErrorInfo): void;
    render(): ReactNode;
}
export {};
