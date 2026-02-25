'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
                    <h2 className="text-xl font-semibold text-[var(--text)] mb-2">Something went wrong</h2>
                    <p className="text-[var(--text-secondary)] mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
