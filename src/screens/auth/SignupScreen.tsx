import React, { useState } from 'react';
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

const SignupScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors, primary, spacing, borderRadius, typography } = useTheme();
    const { signInWithGoogle, loading: googleLoading, error: googleError } = useGoogleAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async () => {
        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = await firebaseAuth.signUpWithEmail(email, password);

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
            console.error('Signup error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Use at least 6 characters');
            } else if (err.code === 'auth/operation-not-allowed') {
                setError('Email/password accounts are not enabled. Please contact support.');
            } else {
                setError(err.message || 'Signup failed. Please try again.');
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
                        Join Minglr and start connecting
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
                        placeholder="Create a password"
                        secureTextEntry
                        showPasswordToggle
                        autoComplete="password-new"
                    />

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
