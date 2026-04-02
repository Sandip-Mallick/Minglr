import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Global ErrorBoundary — catches unhandled React errors and shows
 * a friendly fallback UI instead of crashing.
 * Prep for Sentry integration: logs error info for later consumption.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });

        // TODO: Send to Sentry when integrated
        // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });

        if (__DEV__) {
            // Only log in development
            // eslint-disable-next-line no-console
            console.error('[ErrorBoundary] Caught error:', error.message);
        }
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default premium error UI
            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        {/* Error icon with glow */}
                        <View style={styles.iconContainer}>
                            <View style={styles.iconGlow}>
                                <Ionicons name="warning-outline" size={52} color="#FF6B6B" />
                            </View>
                        </View>

                        <Text style={styles.title}>Something Went Wrong</Text>
                        <Text style={styles.subtitle}>
                            An unexpected error occurred. Please try again.
                        </Text>

                        {/* Show error details in dev mode */}
                        {__DEV__ && this.state.error && (
                            <ScrollView style={styles.devErrorContainer} contentContainerStyle={styles.devErrorContent}>
                                <Text style={styles.devErrorTitle}>Dev Error Info:</Text>
                                <Text style={styles.devErrorText}>
                                    {this.state.error.message}
                                </Text>
                                {this.state.errorInfo?.componentStack && (
                                    <Text style={styles.devErrorStack}>
                                        {this.state.errorInfo.componentStack.substring(0, 500)}
                                    </Text>
                                )}
                            </ScrollView>
                        )}

                        {/* Retry button */}
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={this.handleRetry}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="refresh-outline" size={20} color="#FFFFFF" style={styles.retryIcon} />
                            <Text style={styles.retryText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        marginBottom: 28,
    },
    iconGlow: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 16,
        color: '#888888',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    devErrorContainer: {
        maxHeight: 160,
        width: '100%',
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        marginBottom: 24,
    },
    devErrorContent: {
        padding: 16,
    },
    devErrorTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FF6B6B',
        marginBottom: 8,
    },
    devErrorText: {
        fontSize: 12,
        color: '#CCCCCC',
        fontFamily: 'monospace',
    },
    devErrorStack: {
        fontSize: 10,
        color: '#888888',
        fontFamily: 'monospace',
        marginTop: 8,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B6B',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        minWidth: 180,
    },
    retryIcon: {
        marginRight: 8,
    },
    retryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default ErrorBoundary;
