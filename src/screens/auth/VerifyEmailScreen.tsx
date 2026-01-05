import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { authApi } from '../../api/auth';
import { usersApi } from '../../api/users';
import { useAuthStore, useGemsStore } from '../../store';
import firebaseAuth from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';

const VerifyEmailScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors, primary, spacing, borderRadius, typography } = useTheme();
    const { setAuth } = useAuthStore();
    const { syncFromUser } = useGemsStore();

    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleResendEmail = async () => {
        if (countdown > 0) return;

        setResending(true);
        try {
            await firebaseAuth.resendVerificationEmail();
            Alert.alert('Email Sent', 'Verification email has been resent.');
            setCountdown(60);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to resend email');
        } finally {
            setResending(false);
        }
    };

    const handleCheckVerification = async () => {
        setLoading(true);
        try {
            const currentUser = firebaseAuth.getCurrentUser();
            if (!currentUser) {
                Alert.alert(
                    'Session Expired',
                    'Please sign in again to continue.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login' as never) }]
                );
                return;
            }

            await firebaseAuth.reloadUser();

            if (firebaseAuth.isEmailVerified()) {
                const firebaseIdToken = await firebaseAuth.getIdToken();
                if (!firebaseIdToken) {
                    throw new Error('Failed to get authentication token');
                }

                const response = await authApi.sync(firebaseIdToken);

                try {
                    const userProfile = await usersApi.getMe();

                    await setAuth(
                        userProfile,
                        response.tokens.accessToken,
                        response.tokens.refreshToken
                    );

                    syncFromUser(userProfile);
                } catch {
                    await setAuth(
                        {
                            _id: response.user._id,
                            email: response.user.email,
                            name: response.user.name || '',
                            isProfileComplete: response.user.isProfileComplete,
                            emailVerified: true,
                        } as any,
                        response.tokens.accessToken,
                        response.tokens.refreshToken
                    );
                }

                Alert.alert('Email Verified!', 'Your email has been verified successfully.');
            } else {
                Alert.alert(
                    'Not Verified Yet',
                    'Please check your email and click the verification link, then try again.'
                );
            }
        } catch (err: any) {
            console.error('Verification check error:', err);
            Alert.alert('Error', err.message || 'Failed to verify email');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await firebaseAuth.signOut();
            navigation.navigate('Login' as never);
        } catch (err) {
            console.error('Sign out error:', err);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.content, { padding: spacing.xl }]}>
                {/* Email Icon */}
                <View style={[
                    styles.iconContainer,
                    {
                        backgroundColor: `${primary.main}15`,
                        borderRadius: borderRadius.full,
                        marginBottom: spacing['2xl'],
                    }
                ]}>
                    <Ionicons name="mail-outline" size={56} color={primary.main} />
                </View>

                <Text style={[
                    typography.h2,
                    { color: colors.text, textAlign: 'center', marginBottom: spacing.base }
                ]}>
                    Verify Your Email
                </Text>

                <Text style={[
                    typography.body,
                    {
                        color: colors.textSecondary,
                        textAlign: 'center',
                        lineHeight: 22,
                        marginBottom: spacing.xl,
                        paddingHorizontal: spacing.base,
                    }
                ]}>
                    We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
                </Text>

                {/* Tip Box */}
                <View style={[
                    styles.tipContainer,
                    {
                        backgroundColor: `${colors.info}10`,
                        borderRadius: borderRadius.md,
                        padding: spacing.md,
                        marginBottom: spacing['2xl'],
                    }
                ]}>
                    <Text style={[
                        typography.caption,
                        { color: colors.textMuted, textAlign: 'center' }
                    ]}>
                        💡 Can't find the email? Check your spam folder
                    </Text>
                </View>

                <Button
                    title={loading ? 'Checking...' : "I've Verified My Email"}
                    onPress={handleCheckVerification}
                    loading={loading}
                    fullWidth
                    size="large"
                />

                <View style={{ height: spacing.md }} />

                <Button
                    title={
                        countdown > 0
                            ? `Resend Email (${countdown}s)`
                            : resending
                                ? 'Sending...'
                                : 'Resend Email'
                    }
                    onPress={handleResendEmail}
                    variant="outline"
                    disabled={countdown > 0 || resending}
                    fullWidth
                    size="large"
                />

                <View style={{ height: spacing.xl }} />

                <Button
                    title="Use Different Email"
                    onPress={handleSignOut}
                    variant="ghost"
                    fullWidth
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipContainer: {},
});

export default VerifyEmailScreen;
