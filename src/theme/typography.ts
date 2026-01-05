/**
 * MINGLR Design System - Typography
 * 
 * A comprehensive type scale with proper line heights, letter spacing,
 * and font weights for a premium dating app experience.
 */

import { Platform, TextStyle } from 'react-native';

// ============================================================================
// FONT FAMILY
// ============================================================================

// Use system fonts for best performance and native feel
// Can be replaced with custom fonts like Inter, SF Pro, etc.
export const fontFamily = {
    regular: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System',
    }),
    medium: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium',
        default: 'System',
    }),
    semibold: Platform.select({
        ios: 'System',
        android: 'Roboto-Medium', // Android doesn't have semibold
        default: 'System',
    }),
    bold: Platform.select({
        ios: 'System',
        android: 'Roboto-Bold',
        default: 'System',
    }),
} as const;

// ============================================================================
// FONT SIZES
// ============================================================================

export const fontSize = {
    xs: 11,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
} as const;

// ============================================================================
// LINE HEIGHTS
// ============================================================================

export const lineHeight = {
    tight: 1.2,    // Headings
    snug: 1.35,    // Compact text
    normal: 1.5,   // Body text
    relaxed: 1.6,  // Long-form reading
    loose: 1.75,   // Extra spacing
} as const;

// ============================================================================
// LETTER SPACING
// ============================================================================

export const letterSpacing = {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
} as const;

// ============================================================================
// FONT WEIGHTS
// ============================================================================

export const fontWeight = {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    extrabold: '800' as TextStyle['fontWeight'],
} as const;

// ============================================================================
// TYPE SCALE - Pre-composed text styles
// ============================================================================

export const typography = {
    // Display - Hero text, splash screens
    displayLarge: {
        fontSize: fontSize['5xl'],
        fontWeight: fontWeight.bold,
        lineHeight: fontSize['5xl'] * lineHeight.tight,
        letterSpacing: letterSpacing.tighter,
    } as TextStyle,

    displayMedium: {
        fontSize: fontSize['4xl'],
        fontWeight: fontWeight.bold,
        lineHeight: fontSize['4xl'] * lineHeight.tight,
        letterSpacing: letterSpacing.tight,
    } as TextStyle,

    // Headings - Section titles, profile names
    h1: {
        fontSize: fontSize['3xl'],
        fontWeight: fontWeight.bold,
        lineHeight: fontSize['3xl'] * lineHeight.tight,
        letterSpacing: letterSpacing.tight,
    } as TextStyle,

    h2: {
        fontSize: fontSize['2xl'],
        fontWeight: fontWeight.bold,
        lineHeight: fontSize['2xl'] * lineHeight.tight,
        letterSpacing: letterSpacing.tight,
    } as TextStyle,

    h3: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.semibold,
        lineHeight: fontSize.xl * lineHeight.snug,
        letterSpacing: letterSpacing.normal,
    } as TextStyle,

    h4: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        lineHeight: fontSize.lg * lineHeight.snug,
        letterSpacing: letterSpacing.normal,
    } as TextStyle,

    // Body text - Main content
    bodyLarge: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.regular,
        lineHeight: fontSize.md * lineHeight.normal,
        letterSpacing: letterSpacing.normal,
    } as TextStyle,

    body: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.regular,
        lineHeight: fontSize.base * lineHeight.normal,
        letterSpacing: letterSpacing.normal,
    } as TextStyle,

    bodySmall: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.regular,
        lineHeight: fontSize.sm * lineHeight.normal,
        letterSpacing: letterSpacing.normal,
    } as TextStyle,

    // Labels - Input labels, button text
    labelLarge: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        lineHeight: fontSize.md * lineHeight.snug,
        letterSpacing: letterSpacing.wide,
    } as TextStyle,

    label: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.medium,
        lineHeight: fontSize.base * lineHeight.snug,
        letterSpacing: letterSpacing.wide,
    } as TextStyle,

    labelSmall: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        lineHeight: fontSize.sm * lineHeight.snug,
        letterSpacing: letterSpacing.wide,
    } as TextStyle,

    // Captions - Helper text, timestamps
    caption: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.regular,
        lineHeight: fontSize.sm * lineHeight.normal,
        letterSpacing: letterSpacing.normal,
    } as TextStyle,

    captionSmall: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.regular,
        lineHeight: fontSize.xs * lineHeight.normal,
        letterSpacing: letterSpacing.wide,
    } as TextStyle,

    // Button text
    buttonLarge: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        lineHeight: fontSize.lg * lineHeight.tight,
        letterSpacing: letterSpacing.wide,
    } as TextStyle,

    button: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        lineHeight: fontSize.md * lineHeight.tight,
        letterSpacing: letterSpacing.wide,
    } as TextStyle,

    buttonSmall: {
        fontSize: fontSize.base,
        fontWeight: fontWeight.semibold,
        lineHeight: fontSize.base * lineHeight.tight,
        letterSpacing: letterSpacing.wide,
    } as TextStyle,
} as const;

export type Typography = typeof typography;
export type TypographyKey = keyof typeof typography;
