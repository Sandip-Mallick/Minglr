import { create } from 'zustand';
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { secureStorage } from '../utils/secureStorage';
import { usersApi } from '../api/users';
import { authApi } from '../api/auth';
import firebaseAuth from '../config/firebase';

interface User {
    _id: string;
    email: string;
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    country: string;
    bio?: string;
    photos: Array<{
        url: string;
        order: number;
        isMain: boolean;
        isVerified: boolean;
    }>;
    searchPreferences: {
        searchCountries: 'worldwide' | string[];
        genderPreference: 'male' | 'female' | 'everyone';
        ageRange?: {
            min: number;
            max: number;
        };
    };
    gemsBalance: number;
    boostersOwned: number;
    activeBoost?: {
        startedAt: string;
        durationMinutes: number;
        expiresAt: string;
    };
    onlineStatus: {
        isOnline: boolean;
        lastActiveAt: string;
    };
    isProfileComplete: boolean;
    emailVerified: boolean;
    referralCode: string;
}

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;

    // Actions
    setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
    logout: () => Promise<void>;
    forceLogout: () => Promise<void>;
    updateUser: (userData: Partial<User>) => Promise<void>;
    setLoading: (loading: boolean) => void;
    loadStoredAuth: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    accessToken: null,
    refreshToken: null,

    setAuth: async (user, accessToken, refreshToken) => {
        await secureStorage.setItemAsync('accessToken', accessToken);
        await secureStorage.setItemAsync('refreshToken', refreshToken);
        await secureStorage.setItemAsync('user', JSON.stringify(user));

        set({
            isAuthenticated: true,
            user,
            accessToken,
            refreshToken,
            isLoading: false,
        });
    },

    logout: async () => {
        // Step 1: Tell backend to update online status (fail silently if network drops)
        try {
            await authApi.logout();
        } catch (e) {
            console.warn('Backend logout failed:', e);
        }

        // Step 2: Sign out of Firebase (this fixes Web App persistence!)
        try {
            await firebaseAuth.signOut();
        } catch (e) {
            console.warn('Firebase signout failed:', e);
        }

        // Step 3: Sever Native Google OAuth bindings (Mobile only)
        if (Platform.OS !== 'web') {
            try {
                await GoogleSignin.signOut();
            } catch (e) {
                // Not signed into Google directly or it failed
                console.warn('GoogleSignin signout failed:', e);
            }
        }

        // Step 4: Clear local device storage
        await secureStorage.deleteItemAsync('accessToken');
        await secureStorage.deleteItemAsync('refreshToken');
        await secureStorage.deleteItemAsync('user');

        // Step 5: Clear runtime UI state
        set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
        });
    },

    /**
     * Force logout — clears all state, storage, AND signs out of Firebase.
     * Called by the API client when token refresh fails.
     */
    forceLogout: async () => {
        // Clear secure storage
        await secureStorage.deleteItemAsync('accessToken');
        await secureStorage.deleteItemAsync('refreshToken');
        await secureStorage.deleteItemAsync('user');

        // Sign out of Firebase
        try {
            await firebaseAuth.signOut();
        } catch {
            // Ignore Firebase sign-out errors during force logout
        }

        // Clear Zustand state
        set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
        });
    },

    updateUser: async (userData) => {
        const currentUser = get().user;
        if (currentUser) {
            // Call API to persist to server
            const updatedUserFromServer = await usersApi.updateProfile(userData);
            // Merge server response with current user data
            const updatedUser = { ...currentUser, ...updatedUserFromServer };
            set({ user: updatedUser });
            await secureStorage.setItemAsync('user', JSON.stringify(updatedUser));
        }
    },

    setLoading: (loading) => {
        set({ isLoading: loading });
    },

    loadStoredAuth: async () => {
        try {
            const accessToken = await secureStorage.getItemAsync('accessToken');
            const refreshToken = await secureStorage.getItemAsync('refreshToken');
            const userStr = await secureStorage.getItemAsync('user');

            if (accessToken && refreshToken && userStr) {
                const user = JSON.parse(userStr) as User;
                set({
                    isAuthenticated: true,
                    user,
                    accessToken,
                    refreshToken,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        } catch {
            set({ isLoading: false });
        }
    },

    refreshUser: async () => {
        try {
            const userData = await usersApi.getMe();
            const currentUser = get().user;
            if (currentUser) {
                const updatedUser = { ...currentUser, ...userData } as User;
                set({ user: updatedUser });
                await secureStorage.setItemAsync('user', JSON.stringify(updatedUser));
            }
        } catch {
            // Silently fail — user will see stale data until next refresh
        }
    },
}));
