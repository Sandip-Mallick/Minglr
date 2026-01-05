import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { secureStorage } from '../utils/secureStorage';
import { useAuthStore, useGemsStore } from '../store';

// Complete auth session for web
WebBrowser.maybeCompleteAuthSession();

// Google OAuth client IDs
const GOOGLE_WEB_CLIENT_ID = '259971691056-unt1qitb70idvg9kvh3fg0of7i6c4nnq.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '259971691056-i0pqanv84lj05mn98tui850e1gu3rg32.apps.googleusercontent.com';

// Generate the redirect URI for the current platform
const redirectUri = makeRedirectUri({
    scheme: 'minglr',
});

// Log redirect URI on load
console.log('🔗 REDIRECT URI:', redirectUri);

interface UseGoogleAuthResult {
    signInWithGoogle: () => Promise<void>;
    loading: boolean;
    error: string | null;
    redirectUri: string;
}

export const useGoogleAuth = (): UseGoogleAuthResult => {
    const { setAuth } = useAuthStore();
    const { syncFromUser } = useGemsStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Configure Google OAuth request with platform-specific client IDs
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID,
        webClientId: GOOGLE_WEB_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        redirectUri: redirectUri,
        scopes: ['openid', 'profile', 'email'],
    });

    // Handle OAuth response
    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            console.log('Google OAuth response:', {
                hasIdToken: !!authentication?.idToken,
                hasAccessToken: !!authentication?.accessToken
            });
            handleGoogleAuthSuccess(authentication?.accessToken);
        } else if (response?.type === 'error') {
            console.error('Google OAuth error:', response.error);
            setError(response.error?.message || 'Google Sign-In failed');
            setLoading(false);
        } else if (response?.type === 'dismiss') {
            setLoading(false);
        }
    }, [response]);

    const handleGoogleAuthSuccess = async (accessToken: string | undefined) => {
        if (!accessToken) {
            setError('No access token received from Google');
            setLoading(false);
            return;
        }

        try {
            console.log('Authenticating with server using Google access token...');

            // Call our server's /auth/google endpoint
            const authResponse = await authApi.googleAuth(accessToken);

            console.log('Server auth response:', authResponse);

            // Store tokens
            await secureStorage.setItemAsync('accessToken', authResponse.tokens.accessToken);
            await secureStorage.setItemAsync('refreshToken', authResponse.tokens.refreshToken);

            // Get full user profile
            const userProfile = await usersApi.getMe();

            // Update auth store
            await setAuth(
                userProfile,
                authResponse.tokens.accessToken,
                authResponse.tokens.refreshToken
            );

            // Sync gems
            syncFromUser(userProfile);

            setError(null);
            console.log('Google Sign-In successful!');
        } catch (err: any) {
            console.error('Google auth error:', err);
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        setLoading(true);
        setError(null);

        try {
            await promptAsync();
        } catch (err: any) {
            console.error('Google prompt error:', err);
            setError(err.message || 'Failed to start Google Sign-In');
            setLoading(false);
        }
    };

    return {
        signInWithGoogle,
        loading,
        error,
        redirectUri,
    };
};

export default useGoogleAuth;


