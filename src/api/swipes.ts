import apiClient from './client';
import { UserProfile } from './users';

export interface SwipeResult {
    swipe: {
        _id: string;
        action: 'like' | 'dislike';
    };
    isMatch: boolean;
    chatId?: string;
}

export interface UndoResult {
    success: boolean;
    undoneProfile: UserProfile;
    gemsDeducted: number;
}

export interface MessageResult {
    success: boolean;
    friendRequest: unknown;
    letterUsed: boolean;
}

export const swipesApi = {
    /**
     * Get profiles to swipe on
     */
    getProfiles: async (limit: number = 20): Promise<UserProfile[]> => {
        const response = await apiClient.get('/swipe/profiles', { params: { limit } });
        return response.data;
    },

    /**
     * Perform swipe action
     */
    swipe: async (targetUserId: string, action: 'like' | 'dislike'): Promise<SwipeResult> => {
        const response = await apiClient.post('/swipe', { targetUserId, action });
        return response.data;
    },

    /**
     * Undo last swipe (costs 10 gems)
     */
    undoSwipe: async (): Promise<UndoResult> => {
        const response = await apiClient.post('/swipe/undo');
        return response.data;
    },

    /**
     * Send message to profile (uses 1 letter, creates friend request)
     */
    sendMessage: async (targetUserId: string, message: string): Promise<MessageResult> => {
        const response = await apiClient.post('/swipe/message', { targetUserId, message });
        return response.data;
    },
};

