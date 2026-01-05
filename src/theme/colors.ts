/**
 * MINGLR Design System - Color Palette
 * 
 * A comprehensive color system derived from the primary brand color #d03958
 * with carefully crafted light/dark themes for a premium dating app experience.
 */

// ============================================================================
// PRIMARY BRAND COLORS
// ============================================================================

export const primaryPalette = {
    // Main brand color - romantic, premium pink
    main: '#d03958',

    // Lighter shades (hover, subtle highlights)
    light: '#E8657F',
    lighter: '#F2A3B3',
    lightest: '#FDE8EC',

    // Darker shades (pressed states, accents)
    dark: '#B22D4A',
    darker: '#8A223A',
    darkest: '#5C162A',
} as const;

// ============================================================================
// SECONDARY ACCENT COLORS
// ============================================================================

export const secondaryPalette = {
    // Warm gold - premium accent that complements the romantic primary
    main: '#D4A056',
    light: '#E5C088',
    lighter: '#F5E0BA',
    lightest: '#FDF6EB',
    dark: '#B88A42',
    darker: '#8A6831',
} as const;

// ============================================================================
// SEMANTIC COLORS
// ============================================================================

export const semanticColors = {
    success: {
        main: '#22C55E',
        light: '#4ADE80',
        lighter: '#BBF7D0',
        dark: '#16A34A',
    },
    error: {
        main: '#EF4444',
        light: '#F87171',
        lighter: '#FECACA',
        dark: '#DC2626',
    },
    warning: {
        main: '#F59E0B',
        light: '#FBBF24',
        lighter: '#FEF3C7',
        dark: '#D97706',
    },
    info: {
        main: '#3B82F6',
        light: '#60A5FA',
        lighter: '#DBEAFE',
        dark: '#2563EB',
    },
} as const;

// ============================================================================
// NEUTRAL PALETTE
// ============================================================================

export const neutrals = {
    white: '#FFFFFF',
    black: '#000000',

    // Light theme grays (warm tint for dating app feel)
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',

    // Dark theme specific (rich charcoal, not pure black)
    darkBg: '#0F1419',
    darkSurface: '#1A1F26',
    darkCard: '#242B33',
    darkElevated: '#2E3640',
    darkBorder: '#3A424D',
} as const;

// ============================================================================
// THEME DEFINITIONS
// ============================================================================

export const lightTheme = {
    // Backgrounds
    background: '#FAFAFA',        // Soft off-white, not harsh
    surface: '#FFFFFF',
    card: '#FFFFFF',
    elevated: '#FFFFFF',

    // Text hierarchy
    text: '#1A1A1A',              // Primary text - near black for readability
    textSecondary: '#52525B',     // Secondary text
    textMuted: '#A1A1AA',         // Muted/helper text
    textOnPrimary: '#FFFFFF',     // Text on primary color backgrounds

    // Borders & dividers
    border: '#E4E4E7',
    borderLight: '#F4F4F5',
    divider: '#E4E4E7',

    // Input states
    inputBackground: '#F4F4F5',
    inputBorder: '#D4D4D8',
    inputBorderFocus: primaryPalette.main,

    // Interactive states
    ripple: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    scrim: 'rgba(0, 0, 0, 0.32)',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarInactive: '#A1A1AA',

    // Status bar
    statusBar: 'dark-content' as const,

    // Semantic
    success: semanticColors.success.main,
    error: semanticColors.error.main,
    warning: semanticColors.warning.main,
    info: semanticColors.info.main,
};

export const darkTheme = {
    // Backgrounds - rich charcoal, NOT pure black
    background: neutrals.darkBg,       // #0F1419 - deep but soft
    surface: neutrals.darkSurface,     // #1A1F26
    card: neutrals.darkCard,           // #242B33
    elevated: neutrals.darkElevated,   // #2E3640

    // Text hierarchy - high contrast for accessibility
    text: '#F4F4F5',                   // Primary text - near white
    textSecondary: '#A1A1AA',          // Secondary text
    textMuted: '#71717A',              // Muted/helper text
    textOnPrimary: '#FFFFFF',          // Text on primary color backgrounds

    // Borders & dividers
    border: neutrals.darkBorder,       // #3A424D
    borderLight: '#2E3640',
    divider: '#3A424D',

    // Input states
    inputBackground: neutrals.darkCard,
    inputBorder: '#3A424D',
    inputBorderFocus: primaryPalette.light,

    // Interactive states
    ripple: 'rgba(255, 255, 255, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    scrim: 'rgba(0, 0, 0, 0.6)',

    // Tab bar
    tabBar: neutrals.darkSurface,
    tabBarInactive: '#71717A',

    // Status bar
    statusBar: 'light-content' as const,

    // Semantic - slightly adjusted for dark backgrounds
    success: semanticColors.success.light,
    error: semanticColors.error.light,
    warning: semanticColors.warning.light,
    info: semanticColors.info.light,
};

// ============================================================================
// LEGACY EXPORT (for backward compatibility)
// ============================================================================

export const Colors = {
    primary: primaryPalette.main,
    secondary: secondaryPalette.main,
    light: lightTheme,
    dark: darkTheme,
};

export type ThemeMode = 'light' | 'dark';

// Explicit interface to allow both lightTheme and darkTheme to be assignable
export interface ThemeColors {
    // Backgrounds
    background: string;
    surface: string;
    card: string;
    elevated: string;

    // Text hierarchy
    text: string;
    textSecondary: string;
    textMuted: string;
    textOnPrimary: string;

    // Borders & dividers
    border: string;
    borderLight: string;
    divider: string;

    // Input states
    inputBackground: string;
    inputBorder: string;
    inputBorderFocus: string;

    // Interactive states
    ripple: string;
    overlay: string;
    scrim: string;

    // Tab bar
    tabBar: string;
    tabBarInactive: string;

    // Status bar
    statusBar: 'dark-content' | 'light-content';

    // Semantic
    success: string;
    error: string;
    warning: string;
    info: string;
}
