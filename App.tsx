import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/common/ErrorBoundary';

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ErrorBoundary>
                <SafeAreaProvider>
                    <ThemeProvider>
                        <AppNavigator />
                    </ThemeProvider>
                </SafeAreaProvider>
            </ErrorBoundary>
        </GestureHandlerRootView>
    );
}
