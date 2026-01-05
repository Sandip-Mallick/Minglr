import React, { useCallback } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    Pressable,
    View,
} from 'react-native';
import { useTheme } from '../../theme';

// ============================================================================
// TYPES
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,
    iconPosition = 'left',
    style,
    textStyle,
}) => {
    const { colors, primary, secondary, borderRadius, spacing, typography, touchTarget } = useTheme();

    // ========================================================================
    // STYLES
    // ========================================================================

    const getBackgroundColor = useCallback((pressed: boolean): string => {
        if (disabled) return colors.border;

        switch (variant) {
            case 'primary':
                return pressed ? primary.dark : primary.main;
            case 'secondary':
                return pressed ? secondary.dark : secondary.main;
            case 'outline':
            case 'ghost':
                return pressed ? `${primary.main}15` : 'transparent';
            case 'danger':
                return pressed ? '#DC2626' : '#EF4444';
            default:
                return primary.main;
        }
    }, [variant, disabled, colors, primary, secondary]);

    const getTextColor = useCallback((): string => {
        if (disabled) return colors.textMuted;

        switch (variant) {
            case 'outline':
            case 'ghost':
                return primary.main;
            case 'primary':
            case 'secondary':
            case 'danger':
            default:
                return '#FFFFFF';
        }
    }, [variant, disabled, colors, primary]);

    const getBorderColor = useCallback((pressed: boolean): string => {
        if (disabled) return colors.border;

        switch (variant) {
            case 'outline':
                return pressed ? primary.dark : primary.main;
            default:
                return 'transparent';
        }
    }, [variant, disabled, colors, primary]);

    const getSizeStyles = useCallback((): {
        height: number;
        paddingHorizontal: number;
        textStyle: TextStyle;
    } => {
        switch (size) {
            case 'small':
                return {
                    height: touchTarget.min,
                    paddingHorizontal: spacing.base,
                    textStyle: typography.buttonSmall,
                };
            case 'large':
                return {
                    height: touchTarget.large,
                    paddingHorizontal: spacing['2xl'],
                    textStyle: typography.buttonLarge,
                };
            default: // medium
                return {
                    height: touchTarget.standard,
                    paddingHorizontal: spacing.xl,
                    textStyle: typography.button,
                };
        }
    }, [size, touchTarget, spacing, typography]);

    const sizeStyles = getSizeStyles();

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.button,
                {
                    height: sizeStyles.height,
                    paddingHorizontal: sizeStyles.paddingHorizontal,
                    backgroundColor: getBackgroundColor(pressed),
                    borderColor: getBorderColor(pressed),
                    borderWidth: variant === 'outline' ? 2 : 0,
                    borderRadius: borderRadius.button,
                    opacity: disabled ? 0.5 : 1,
                },
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            {({ pressed }) => (
                <View style={styles.content}>
                    {loading ? (
                        <ActivityIndicator
                            color={getTextColor()}
                            size={size === 'small' ? 'small' : 'small'}
                        />
                    ) : (
                        <>
                            {icon && iconPosition === 'left' && (
                                <View style={styles.iconLeft}>{icon}</View>
                            )}
                            <Text
                                style={[
                                    styles.text,
                                    sizeStyles.textStyle,
                                    { color: getTextColor() },
                                    textStyle,
                                ]}
                                numberOfLines={1}
                            >
                                {title}
                            </Text>
                            {icon && iconPosition === 'right' && (
                                <View style={styles.iconRight}>{icon}</View>
                            )}
                        </>
                    )}
                </View>
            )}
        </Pressable>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    fullWidth: {
        width: '100%',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        textAlign: 'center',
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
});

export default Button;
