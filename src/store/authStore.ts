import { create } from 'zustand';
import { secureStorage } from '../utils/secureStorage';
import { usersApi } from '../api/users';

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
        await secureStorage.deleteItemAsync('accessToken');
        await secureStorage.deleteItemAsync('refreshToken');
        await secureStorage.deleteItemAsync('user');

        set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
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
        } catch (error) {
            console.error('Failed to load auth:', error);
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
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    },
}));
