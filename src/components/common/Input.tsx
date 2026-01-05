import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    TextInput,
    View,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

// ============================================================================
// TYPES
// ============================================================================

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    helper?: string;
    containerStyle?: ViewStyle;
    showPasswordToggle?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const MASK_DELAY_MS = 500;

// ============================================================================
// COMPONENT
// ============================================================================

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helper,
    containerStyle,
    showPasswordToggle = false,
    leftIcon,
    rightIcon,
    secureTextEntry,
    value,
    onChangeText,
    onFocus,
    onBlur,
    ...props
}) => {
    const { colors, primary, spacing, borderRadius, typography } = useTheme();

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [displayValue, setDisplayValue] = useState('');
    const maskTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInternalChangeRef = useRef(false);
    const focusAnim = useRef(new Animated.Value(0)).current;

    const isSecureField = secureTextEntry && showPasswordToggle;
    const shouldUseCustomMasking = isSecureField && !isPasswordVisible;

    // Focus animation
    useEffect(() => {
        Animated.timing(focusAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, focusAnim]);

    // Sync display value
    useEffect(() => {
        if (value !== undefined && !isInternalChangeRef.current) {
            if (!shouldUseCustomMasking) {
                setDisplayValue(value);
            } else {
                setDisplayValue('•'.repeat(value.length));
            }
        }
        isInternalChangeRef.current = false;
    }, [value, shouldUseCustomMasking]);

    const handleTextChange = useCallback((text: string) => {
        if (!shouldUseCustomMasking) {
            onChangeText?.(text);
            return;
        }

        if (maskTimerRef.current) {
            clearTimeout(maskTimerRef.current);
            maskTimerRef.current = null;
        }

        const previousValue = value || '';
        const previousLength = previousValue.length;
        const currentLength = text.length;

        let newActualValue: string;

        if (currentLength > previousLength) {
            const addedChars = text.slice(previousLength);
            newActualValue = previousValue + addedChars;
        } else if (currentLength < previousLength) {
            newActualValue = previousValue.slice(0, currentLength);
        } else {
            newActualValue = previousValue;
        }

        isInternalChangeRef.current = true;
        onChangeText?.(newActualValue);

        if (currentLength > 0 && currentLength > previousLength) {
            const maskedPart = '•'.repeat(newActualValue.length - 1);
            const lastChar = newActualValue.slice(-1);
            setDisplayValue(maskedPart + lastChar);

            const valueToMask = newActualValue;
            maskTimerRef.current = setTimeout(() => {
                setDisplayValue('•'.repeat(valueToMask.length));
            }, MASK_DELAY_MS);
        } else {
            setDisplayValue('•'.repeat(newActualValue.length));
        }
    }, [shouldUseCustomMasking, value, onChangeText]);

    useEffect(() => {
        return () => {
            if (maskTimerRef.current) {
                clearTimeout(maskTimerRef.current);
            }
        };
    }, []);

    const togglePasswordVisibility = useCallback(() => {
        setIsPasswordVisible(prev => {
            const newVisible = !prev;
            if (newVisible) {
                setDisplayValue(value || '');
            } else {
                setDisplayValue('•'.repeat((value || '').length));
            }
            return newVisible;
        });
        if (maskTimerRef.current) {
            clearTimeout(maskTimerRef.current);
            maskTimerRef.current = null;
        }
    }, [value]);

    const handleFocus = useCallback((e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    }, [onFocus]);

    const handleBlur = useCallback((e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    }, [onBlur]);

    // Border color based on state
    const getBorderColor = () => {
        if (error) return colors.error;
        if (isFocused) return primary.main;
        return colors.inputBorder;
    };

    // Animated border width for focus ring effect
    const borderWidth = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2],
    });

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[
                    styles.label,
                    typography.labelSmall,
                    { color: error ? colors.error : colors.text }
                ]}>
                    {label}
                </Text>
            )}

            <Animated.View
                style={[
                    styles.inputWrapper,
                    {
                        borderWidth,
                        borderColor: getBorderColor(),
                        borderRadius: borderRadius.input,
                        backgroundColor: colors.inputBackground,
                    }
                ]}
            >
                {leftIcon && (
                    <View style={[styles.iconContainer, { marginLeft: spacing.md }]}>
                        {leftIcon}
                    </View>
                )}

                <TextInput
                    style={[
                        styles.input,
                        typography.bodyLarge,
                        {
                            color: colors.text,
                            paddingHorizontal: spacing.base,
                            paddingVertical: spacing.md,
                        },
                        leftIcon && { paddingLeft: spacing.sm },
                        (showPasswordToggle || rightIcon) && { paddingRight: spacing.sm },
                    ]}
                    placeholderTextColor={colors.textMuted}
                    value={shouldUseCustomMasking ? displayValue : value}
                    onChangeText={shouldUseCustomMasking ? handleTextChange : onChangeText}
                    secureTextEntry={isSecureField ? false : secureTextEntry}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />

                {showPasswordToggle && secureTextEntry && (
                    <TouchableOpacity
                        style={[styles.iconContainer, { marginRight: spacing.md }]}
                        onPress={togglePasswordVisibility}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={22}
                            color={colors.textMuted}
                        />
                    </TouchableOpacity>
                )}

                {rightIcon && !showPasswordToggle && (
                    <View style={[styles.iconContainer, { marginRight: spacing.md }]}>
                        {rightIcon}
                    </View>
                )}
            </Animated.View>

            {(error || helper) && (
                <Text style={[
                    styles.helperText,
                    typography.caption,
                    { color: error ? colors.error : colors.textMuted }
                ]}>
                    {error || helper}
                </Text>
            )}
        </View>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        minHeight: 50,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    helperText: {
        marginTop: 6,
    },
});

export default Input;
