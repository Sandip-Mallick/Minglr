import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { GoogleLogo } from '../../components/common/GoogleLogo';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import firebaseAuth from '../../config/firebase';
import { validateEmail, validatePassword, getPasswordStrength, sanitizeInput } from '../../utils/validation';
import { getUserFriendlyError } from '../../utils/errorMessages';

const SignupScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors, primary, spacing, borderRadius, typography } = useTheme();
    const { signInWithGoogle, loading: googleLoading, error: googleError } = useGoogleAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Password strength indicator
    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
    const showStrength = password.length > 0;

    const handleSignup = async () => {
        // Validate email
        const trimmedEmail = sanitizeInput(email);
        const emailResult = validateEmail(trimmedEmail);
        if (!emailResult.isValid) {
            setError(emailResult.error!);
            return;
        }

        // Validate password strength
        const passwordResult = validatePassword(password);
        if (!passwordResult.isValid) {
            setError(passwordResult.error!);
            return;
        }

        // Confirm password match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await firebaseAuth.signUpWithEmail(trimmedEmail, password);

            Alert.alert(
                'Verification Email Sent',
                'Please check your inbox and verify your email address.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('VerifyEmail' as never),
                    },
                ]
            );
        } catch (err: any) {
            // Check for specific conflict: email already used by Google account
            if (err.code === 'auth/email-already-in-use') {
                // Show specific message suggesting Google login
                setError('An account with this email already exists. If you signed up with Google, please use "Continue with Google" instead.');
            } else {
                setError(getUserFriendlyError(err));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { padding: spacing.xl }]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                automaticallyAdjustKeyboardInsets={true}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={[styles.header, { marginBottom: spacing['2xl'] }]}>
                    <Text style={[typography.h1, { color: primary.main }]}>
                        Create Account
                    </Text>
                    <Text style={[
                        typography.bodyLarge,
                        { color: colors.textSecondary, marginTop: spacing.sm }
                    ]}>
                        Join mingler and start connecting
                    </Text>
                </View>

                {/* Signup Form */}
                <View style={[styles.form, { marginBottom: spacing.xl }]}>
                    <Input
                        label="Email"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            setError('');
                        }}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />

                    <Input
                        label="Password"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            setError('');
                        }}
                        placeholder="Create a strong password"
                        secureTextEntry
                        showPasswordToggle
                        autoComplete="password-new"
                    />

                    {/* Password Strength Indicator */}
                    {showStrength && (
                        <View style={[styles.strengthContainer, { marginBottom: spacing.md }]}>
                            <View style={styles.strengthBarContainer}>
                                {[0, 1, 2, 3].map((i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.strengthBar,
                                            {
                                                backgroundColor: i < passwordStrength.score
                                                    ? passwordStrength.color
                                                    : colors.border,
                                                marginRight: i < 3 ? 4 : 0,
                                            }
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={[
                                typography.caption,
                                { color: passwordStrength.color, marginLeft: spacing.sm }
                            ]}>
                                {passwordStrength.label}
                            </Text>
                        </View>
                    )}

                    {/* Password requirements hint */}
                    {showStrength && passwordStrength.score < 4 && (
                        <View style={[
                            styles.hintContainer,
                            {
                                backgroundColor: `${colors.info}08`,
                                borderRadius: borderRadius.md,
                                padding: spacing.sm,
                                marginBottom: spacing.md,
                            }
                        ]}>
                            <Text style={[typography.caption, { color: colors.textMuted, lineHeight: 18 }]}>
                                {!passwordStrength.checks.minLength && '• At least 8 characters\n'}
                                {!passwordStrength.checks.hasUppercase && '• 1 uppercase letter\n'}
                                {!passwordStrength.checks.hasNumber && '• 1 number\n'}
                                {!passwordStrength.checks.hasSpecial && '• 1 special character (!@#$...)'}
                            </Text>
                        </View>
                    )}

                    <Input
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={(text) => {
                            setConfirmPassword(text);
                            setError('');
                        }}
                        placeholder="Confirm your password"
                        secureTextEntry
                        showPasswordToggle
                        autoComplete="password-new"
                    />

                    {(error || googleError) && (
                        <View style={[
                            styles.errorContainer,
                            {
                                backgroundColor: `${colors.error}15`,
                                borderRadius: borderRadius.md,
                                padding: spacing.md,
                                marginBottom: spacing.md,
                            }
                        ]}>
                            <Text style={[
                                typography.bodySmall,
                                { color: colors.error, textAlign: 'center' }
                            ]}>
                                {error || googleError}
                            </Text>
                        </View>
                    )}

                    <Button
                        title="Create Account"
                        onPress={handleSignup}
                        loading={loading}
                        fullWidth
                        size="large"
                    />
                </View>

                {/* Divider */}
                <View style={[styles.divider, { marginVertical: spacing.lg }]}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    <Text style={[
                        typography.caption,
                        { color: colors.textMuted, marginHorizontal: spacing.base }
                    ]}>
                        or sign up with
                    </Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                {/* Social Signup */}
                <View style={[styles.socialButtons, { marginBottom: spacing.lg }]}>
                    <TouchableOpacity
                        style={[
                            styles.socialButton,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                borderRadius: borderRadius.button,
                                paddingVertical: spacing.md,
                                paddingHorizontal: spacing.xl,
                            }
                        ]}
                        onPress={signInWithGoogle}
                        disabled={loading || googleLoading}
                    >
                        <GoogleLogo size={20} />
                        <Text style={[
                            typography.label,
                            { color: colors.text, marginLeft: spacing.sm }
                        ]}>
                            {googleLoading ? 'Signing up...' : 'Google'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Terms */}
                <Text style={[
                    typography.caption,
                    { color: colors.textMuted, textAlign: 'center', lineHeight: 20 }
                ]}>
                    By signing up, you agree to our{' '}
                    <Text style={{ color: primary.main }}>Terms of Service</Text> and{' '}
                    <Text style={{ color: primary.main }}>Privacy Policy</Text>
                </Text>

                {/* Login Link */}
                <View style={[styles.loginContainer, { marginTop: spacing['2xl'] }]}>
                    <Text style={[typography.body, { color: colors.textSecondary }]}>
                        Already have an account?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={[typography.label, { color: primary.main }]}>
                            Sign In
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
    },
    form: {},
    errorContainer: {},
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -4,
    },
    strengthBarContainer: {
        flexDirection: 'row',
        flex: 1,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    hintContainer: {},
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
});

export default SignupScreen;
