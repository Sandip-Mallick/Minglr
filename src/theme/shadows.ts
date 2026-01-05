/**
 * MINGLR Design System - Shadows & Elevation
 * 
 * Consistent elevation system for depth and hierarchy.
 * Optimized for both iOS and Android.
 */

import { Platform, ViewStyle } from 'react-native';

// ============================================================================
// SHADOW DEFINITIONS
// ============================================================================

export type ShadowStyle = Pick<ViewStyle,
    'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

/**
 * Creates a consistent shadow that works on both iOS and Android
 */
const createShadow = (
    elevation: number,
    opacity: number = 0.15,
    offsetY: number = elevation * 0.5
): ShadowStyle => ({
    shadowColor: '#000000',
    shadowOffset: {
        width: 0,
        height: offsetY,
    },
    shadowOpacity: opacity,
    shadowRadius: elevation * 0.8,
    elevation: elevation,
});

// ============================================================================
// ELEVATION SCALE
// ============================================================================

export const shadows = {
    /** No shadow */
    none: createShadow(0, 0, 0),

    /** Subtle shadow - dividers, hover states */
    xs: createShadow(1, 0.05, 1),

    /** Small shadow - cards at rest */
    sm: createShadow(2, 0.08, 1),

    /** Base shadow - standard cards */
    md: createShadow(4, 0.1, 2),

    /** Medium shadow - floating elements */
    lg: createShadow(8, 0.12, 4),

    /** Large shadow - modals, dropdowns */
    xl: createShadow(12, 0.15, 6),

    /** Extra large shadow - dialogs */
    '2xl': createShadow(16, 0.18, 8),

    /** Maximum shadow - overlays, popovers */
    '3xl': createShadow(24, 0.2, 12),
} as const;

// ============================================================================
// SPECIAL SHADOWS
// ============================================================================

export const specialShadows = {
    /** Card shadow - subtle elevation for cards */
    card: {
        ...createShadow(4, 0.08, 2),
    } as ShadowStyle,

    /** Button shadow - pressed appearance */
    button: {
        ...createShadow(2, 0.15, 1),
    } as ShadowStyle,

    /** Button shadow (pressed) */
    buttonPressed: {
        ...createShadow(1, 0.1, 0.5),
    } as ShadowStyle,

    /** Swipe card shadow - more pronounced for depth effect */
    swipeCard: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    } as ShadowStyle,

    /** Modal/sheet shadow */
    modal: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 16,
    } as ShadowStyle,

    /** Header shadow - subtle bottom shadow */
    header: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    } as ShadowStyle,

    /** Tab bar shadow - top shadow */
    tabBar: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 4,
    } as ShadowStyle,

    /** Floating action button shadow */
    fab: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    } as ShadowStyle,

    /** Inner shadow effect (simulated with border) */
    innerLight: Platform.select({
        ios: {
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        android: {
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        default: {},
    }) as ViewStyle,
} as const;

// ============================================================================
// DARK MODE SHADOWS
// ============================================================================

// In dark mode, shadows are less visible, so we use subtle glows instead
export const darkShadows = {
    /** Subtle glow for cards in dark mode */
    cardGlow: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    } as ShadowStyle,

    /** Primary color glow */
    primaryGlow: {
        shadowColor: '#d03958',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 0,
    } as ShadowStyle,
} as const;

export type Shadows = typeof shadows;
export type ShadowKey = keyof typeof shadows;
