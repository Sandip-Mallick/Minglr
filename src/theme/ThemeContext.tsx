import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Colors,
    ThemeMode,
    ThemeColors,
    primaryPalette,
    secondaryPalette,
    semanticColors,
    lightTheme,
    darkTheme,
} from './colors';
import { typography, fontSize, fontWeight, letterSpacing, lineHeight } from './typography';
import { spacing, layout, borderRadius, touchTarget } from './spacing';
import { shadows, specialShadows, darkShadows, ShadowStyle } from './shadows';

// ============================================================================
// CONSTANTS
// ============================================================================

const THEME_STORAGE_KEY = '@minglr_theme_mode';

// ============================================================================
// THEME CONTEXT TYPE
// ============================================================================

interface ThemeContextType {
    // Color mode
    mode: ThemeMode;
    isDark: boolean;

    // Theme colors (current theme - light or dark)
    colors: ThemeColors;

    // Brand palette (always accessible)
    primary: typeof primaryPalette;
    secondary: typeof secondaryPalette;
    semantic: typeof semanticColors;

    // Legacy color access (backward compatibility)
    primaryColor: string;
    secondaryColor: string;

    // Typography
    typography: typeof typography;
    fontSize: typeof fontSize;
    fontWeight: typeof fontWeight;
    letterSpacing: typeof letterSpacing;
    lineHeight: typeof lineHeight;

    // Spacing
    spacing: typeof spacing;
    layout: typeof layout;
    borderRadius: typeof borderRadius;
    touchTarget: typeof touchTarget;

    // Shadows
    shadows: typeof shadows;
    specialShadows: typeof specialShadows;

    // Get shadow based on theme
    getShadow: (key: keyof typeof shadows) => ShadowStyle;

    // Theme controls
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

// ============================================================================
// PROVIDER
// ============================================================================

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [mode, setMode] = useState<ThemeMode>(systemColorScheme || 'light');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved theme preference on mount
    useEffect(() => {
        const loadSavedTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                    setMode(savedTheme as ThemeMode);
                }
            } catch (error) {
                console.error('Failed to load theme preference:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadSavedTheme();
    }, []);

    const isDark = mode === 'dark';
    const colors = isDark ? darkTheme : lightTheme;

    const toggleTheme = async () => {
        const newMode = mode === 'dark' ? 'light' : 'dark';
        setMode(newMode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    const setTheme = async (newMode: ThemeMode) => {
        setMode(newMode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    // Get appropriate shadow based on theme
    const getShadow = (key: keyof typeof shadows): ShadowStyle => {
        if (isDark) {
            // In dark mode, use subtle shadows or glows
            if (key === 'md' || key === 'lg') {
                return darkShadows.cardGlow;
            }
        }
        return shadows[key];
    };

    const value: ThemeContextType = {
        // Mode
        mode,
        isDark,

        // Colors
        colors,
        primary: primaryPalette,
        secondary: secondaryPalette,
        semantic: semanticColors,

        // Legacy (backward compatibility)
        primaryColor: primaryPalette.main,
        secondaryColor: secondaryPalette.main,

        // Typography
        typography,
        fontSize,
        fontWeight,
        letterSpacing,
        lineHeight,

        // Spacing
        spacing,
        layout,
        borderRadius,
        touchTarget,

        // Shadows
        shadows,
        specialShadows,
        getShadow,

        // Controls
        toggleTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// ============================================================================
// HOOK
// ============================================================================

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// ============================================================================
// EXPORTS
// ============================================================================

export { Colors };
