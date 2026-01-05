/**
 * MINGLR Design System - Spacing
 * 
 * An 8pt grid system for consistent spacing throughout the app.
 * All spacing values are multiples of 4 for pixel-perfect alignment.
 */

// ============================================================================
// SPACING SCALE
// ============================================================================

export const spacing = {
    /** 0px - No spacing */
    none: 0,

    /** 2px - Minimal spacing (icons, tight groups) */
    '2xs': 2,

    /** 4px - Extra small spacing */
    xs: 4,

    /** 8px - Small spacing (between related items) */
    sm: 8,

    /** 12px - Medium-small spacing */
    md: 12,

    /** 16px - Base spacing (standard padding) */
    base: 16,

    /** 20px - Medium-large spacing */
    lg: 20,

    /** 24px - Large spacing (section padding) */
    xl: 24,

    /** 32px - Extra large spacing */
    '2xl': 32,

    /** 40px - 2x Extra large spacing */
    '3xl': 40,

    /** 48px - 3x Extra large spacing */
    '4xl': 48,

    /** 64px - 4x Extra large spacing */
    '5xl': 64,

    /** 80px - 5x Extra large spacing */
    '6xl': 80,
} as const;

// ============================================================================
// LAYOUT SPACING
// ============================================================================

export const layout = {
    /** Horizontal padding for screens */
    screenPaddingHorizontal: spacing.base,

    /** Vertical padding for screens */
    screenPaddingVertical: spacing.xl,

    /** Standard card padding */
    cardPadding: spacing.base,

    /** Card padding (large) */
    cardPaddingLarge: spacing.lg,

    /** Gap between cards/items */
    cardGap: spacing.md,

    /** Section spacing (between major sections) */
    sectionGap: spacing['2xl'],

    /** List item vertical padding */
    listItemPadding: spacing.base,

    /** Button horizontal padding */
    buttonPaddingHorizontal: spacing.xl,

    /** Button vertical padding */
    buttonPaddingVertical: spacing.md,

    /** Input horizontal padding */
    inputPaddingHorizontal: spacing.base,

    /** Input vertical padding */
    inputPaddingVertical: spacing.md,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
    /** No radius */
    none: 0,

    /** 4px - Subtle rounding */
    xs: 4,

    /** 6px - Small rounding */
    sm: 6,

    /** 8px - Standard rounding */
    md: 8,

    /** 12px - Medium rounding */
    base: 12,

    /** 14px - Input fields */
    input: 14,

    /** 16px - Cards, modals */
    lg: 16,

    /** 20px - Large cards */
    xl: 20,

    /** 24px - Extra large */
    '2xl': 24,

    /** 28px - Buttons (pill shape) */
    button: 28,

    /** 9999px - Full circle */
    full: 9999,
} as const;

// ============================================================================
// TOUCH TARGET SIZES (Accessibility)
// ============================================================================

export const touchTarget = {
    /** Minimum touch target (44x44 per iOS guidelines) */
    min: 44,

    /** Standard touch target */
    standard: 48,

    /** Large touch target */
    large: 56,
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof typeof spacing;
