import apiClient from './client';

export interface SyncResponse {
    user: {
        _id: string;
        email: string;
        name: string;
        isProfileComplete: boolean;
        emailVerified: boolean;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
    isNewUser: boolean;
}

export const authApi = {
    /**
     * Sync Firebase user with backend
     */
    sync: async (firebaseIdToken: string): Promise<SyncResponse> => {
        const response = await apiClient.post('/auth/sync', { firebaseIdToken });
        return response.data;
    },

    /**
     * Authenticate with Google OAuth access token
     */
    googleAuth: async (accessToken: string): Promise<SyncResponse> => {
        const response = await apiClient.post('/auth/google', { accessToken });
        return response.data;
    },

    /**
     * Refresh tokens
     */
    refresh: async (refreshToken: string) => {
        const response = await apiClient.post('/auth/refresh', { refreshToken });
        return response.data;
    },

    /**
     * Logout
     */
    logout: async () => {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    },
};
