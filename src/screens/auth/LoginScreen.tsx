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
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { secureStorage } from '../../utils/secureStorage';
import { useTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { GoogleLogo } from '../../components/common/GoogleLogo';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { authApi } from '../../api/auth';
import { usersApi } from '../../api/users';
import { useAuthStore, useGemsStore } from '../../store';
import firebaseAuth from '../../config/firebase';

const LoginScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors, primary, spacing, borderRadius, typography, layout } = useTheme();
    const { setAuth } = useAuthStore();
    const { syncFromUser } = useGemsStore();
    const { signInWithGoogle, loading: googleLoading, error: googleError } = useGoogleAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = await firebaseAuth.signInWithEmail(email, password);

            if (!user.emailVerified) {
                navigation.navigate('VerifyEmail' as never);
                return;
            }

            const firebaseIdToken = await firebaseAuth.getIdToken();
            if (!firebaseIdToken) {
                throw new Error('Failed to get authentication token');
            }

            const response = await authApi.sync(firebaseIdToken);

            await secureStorage.setItemAsync('accessToken', response.tokens.accessToken);
            await secureStorage.setItemAsync('refreshToken', response.tokens.refreshToken);

            const userProfile = await usersApi.getMe();

            await setAuth(
                userProfile,
                response.tokens.accessToken,
                response.tokens.refreshToken
            );

            syncFromUser(userProfile);

        } catch (err: any) {
            console.error('Login error:', err);

            if (err.message === 'Network Error' || err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
                setError('Cannot connect to server. Please check your internet connection and try again.');
                return;
            }

            if (err.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found with this email');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Incorrect email or password');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later');
            } else if (err.code === 'auth/network-request-failed') {
                setError('Network error. Please check your internet connection.');
            } else if (err.response?.status === 401) {
                setError('Authentication failed. Please try again.');
            } else if (err.response?.status >= 500) {
                setError('Server error. Please try again later.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        await signInWithGoogle();
    };

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Email Required', 'Please enter your email address first');
            return;
        }

        try {
            await firebaseAuth.sendPasswordReset(email);
            Alert.alert(
                'Password Reset Sent',
                'Check your email for a password reset link'
            );
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to send reset email');
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
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../../assets/Logo/Minglr.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={[
                        styles.tagline,
                        typography.bodyLarge,
                        { color: colors.textSecondary }
                    ]}>
                        Find love, make friends
                    </Text>
                </View>

                {/* Login Form */}
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
                        placeholder="Enter your password"
                        secureTextEntry
                        showPasswordToggle
                        autoComplete="password"
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
                        title="Sign In"
                        onPress={handleLogin}
                        loading={loading}
                        fullWidth
                        size="large"
                    />

                    <TouchableOpacity
                        style={[styles.forgotPassword, { marginTop: spacing.base }]}
                        onPress={handleForgotPassword}
                    >
                        <Text style={[
                            typography.label,
                            { color: primary.main }
                        ]}>
                            Forgot Password?
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { marginVertical: spacing.xl }]}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    <Text style={[
                        typography.caption,
                        styles.dividerText,
                        { color: colors.textMuted, marginHorizontal: spacing.base }
                    ]}>
                        or continue with
                    </Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                {/* Social Login */}
                <View style={styles.socialButtons}>
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
                        onPress={handleGoogleSignIn}
                        disabled={loading || googleLoading}
                    >
                        <GoogleLogo size={20} />
                        <Text style={[
                            typography.label,
                            { color: colors.text, marginLeft: spacing.sm }
                        ]}>
                            {googleLoading ? 'Signing in...' : 'Google'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Sign Up Link */}
                <View style={[styles.signupContainer, { marginTop: spacing['2xl'] }]}>
                    <Text style={[typography.body, { color: colors.textSecondary }]}>
                        Don't have an account?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup' as never)}>
                        <Text style={[
                            typography.label,
                            { color: primary.main }
                        ]}>
                            Sign Up
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoImage: {
        width: 200,
        height: 80,
        marginBottom: 8,
    },
    tagline: {
        marginTop: 4,
    },
    form: {},
    errorContainer: {},
    forgotPassword: {
        alignItems: 'center',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {},
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
});

export default LoginScreen;
