// Main exports
export { ThemeProvider, useTheme, Colors } from './ThemeContext';

// Color system
export {
    Colors as ColorPalette,
    primaryPalette,
    secondaryPalette,
    semanticColors,
    lightTheme,
    darkTheme,
    type ThemeMode,
    type ThemeColors
} from './colors';

// Typography
export {
    typography,
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
    fontFamily,
    type Typography,
    type TypographyKey,
} from './typography';

// Spacing
export {
    spacing,
    layout,
    borderRadius,
    touchTarget,
    type Spacing,
    type SpacingKey,
} from './spacing';

// Shadows
export {
    shadows,
    specialShadows,
    darkShadows,
    type ShadowStyle,
    type Shadows,
    type ShadowKey,
} from './shadows';
