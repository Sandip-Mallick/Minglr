import apiClient from './client';

export interface UserProfile {
    _id: string;
    email: string;
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    country: string;
    bio?: string;
    photos: Array<{
        url: string;
        publicId?: string;
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
    referralCount: number;
}

export interface CompleteProfileData {
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    country: string;
    searchPreferences: {
        searchCountries: 'worldwide' | string[];
        genderPreference: 'male' | 'female' | 'everyone';
    };
}

export interface UpdateProfileData {
    name?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    country?: string;
    bio?: string;
    searchPreferences?: {
        searchCountries?: 'worldwide' | string[];
        genderPreference?: 'male' | 'female' | 'everyone';
        ageRange?: {
            min: number;
            max: number;
        };
    };
}

export const usersApi = {
    /**
     * Get current user profile
     */
    getMe: async (): Promise<UserProfile> => {
        const response = await apiClient.get('/users/me');
        return response.data;
    },

    /**
     * Update profile
     */
    updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
        const response = await apiClient.put('/users/me', data);
        return response.data;
    },

    /**
     * Complete profile after registration
     */
    completeProfile: async (data: CompleteProfileData): Promise<UserProfile> => {
        const response = await apiClient.post('/users/me/complete', data);
        return response.data;
    },

    /**
     * Upload photo
     */
    uploadPhoto: async (formData: FormData): Promise<{ url: string; order: number; isMain: boolean; isVerified: boolean }> => {
        const response = await apiClient.post('/users/me/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    /**
     * Delete photo
     */
    deletePhoto: async (photoUrl: string): Promise<UserProfile> => {
        const response = await apiClient.delete('/users/me/photo', { data: { photoUrl } });
        return response.data;
    },

    /**
     * Reorder photos
     */
    reorderPhotos: async (photoOrder: string[]): Promise<UserProfile> => {
        const response = await apiClient.put('/users/me/photos/order', { photoOrder });
        return response.data;
    },

    /**
     * Verify photo
     */
    verifyPhoto: async (photoUrl: string): Promise<UserProfile> => {
        const response = await apiClient.post('/users/me/photo/verify', { photoUrl });
        return response.data;
    },

    /**
     * Get another user's profile
     */
    getUser: async (userId: string): Promise<Partial<UserProfile>> => {
        const response = await apiClient.get(`/users/${userId}`);
        return response.data;
    },

    /**
     * Block user
     */
    blockUser: async (userId: string): Promise<UserProfile> => {
        const response = await apiClient.post(`/users/${userId}/block`);
        return response.data;
    },

    /**
     * Unblock user
     */
    unblockUser: async (userId: string): Promise<UserProfile> => {
        const response = await apiClient.delete(`/users/${userId}/block`);
        return response.data;
    },

    /**
     * Report user
     */
    reportUser: async (userId: string, reason: string): Promise<{ success: boolean }> => {
        const response = await apiClient.post(`/users/${userId}/report`, { reason });
        return response.data;
    },

    /**
     * Set user online
     */
    setOnline: async (): Promise<{ success: boolean; status: string }> => {
        const response = await apiClient.post('/users/me/online');
        return response.data;
    },

    /**
     * Set user offline
     */
    setOffline: async (): Promise<{ success: boolean; status: string }> => {
        const response = await apiClient.post('/users/me/offline');
        return response.data;
    },
};
