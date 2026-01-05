import apiClient from './client';

export interface FriendRequest {
    _id: string;
    from: {
        _id: string;
        name: string;
        photos: Array<{ url: string; isMain: boolean }>;
        age: number;
        country: string;
    };
    to: string;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
    createdAt: string;
}

export interface Friend {
    _id: string;
    name: string;
    photos: Array<{ url: string; isMain: boolean }>;
    age: number;
    country: string;
    onlineStatus: {
        isOnline: boolean;
        lastActiveAt: string;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface AcceptRequestResult {
    request: FriendRequest;
    chatId: string;
}

export interface SendRequestWithCostResult {
    success: boolean;
    request: FriendRequest;
    gemsDeducted: number;
}

export const friendsApi = {
    /**
     * Get friend requests
     */
    getRequests: async (page: number = 1, limit: number = 20): Promise<PaginatedResponse<FriendRequest>> => {
        const response = await apiClient.get('/friends/requests', { params: { page, limit } });
        return response.data;
    },

    /**
     * Get recent friends
     */
    getRecentFriends: async (limit: number = 10): Promise<Friend[]> => {
        const response = await apiClient.get('/friends/recent', { params: { limit } });
        return response.data;
    },

    /**
     * Get all friends with search and pagination
     */
    getAllFriends: async (search?: string, page: number = 1, limit: number = 50): Promise<PaginatedResponse<Friend>> => {
        const response = await apiClient.get('/friends/all', { params: { search, page, limit } });
        return response.data;
    },

    /**
     * Send friend request (free)
     */
    sendRequest: async (toUserId: string, message?: string): Promise<FriendRequest> => {
        const response = await apiClient.post('/friends/request', { toUserId, message });
        return response.data;
    },

    /**
     * Send friend request with gem cost (10 gems - for swipe right)
     */
    sendRequestWithCost: async (toUserId: string): Promise<SendRequestWithCostResult> => {
        const response = await apiClient.post('/friends/request-with-cost', { toUserId });
        return response.data;
    },

    /**
     * Accept friend request
     */
    acceptRequest: async (requestId: string): Promise<AcceptRequestResult> => {
        const response = await apiClient.post('/friends/accept', { requestId });
        return response.data;
    },

    /**
     * Reject friend request
     */
    rejectRequest: async (requestId: string): Promise<FriendRequest> => {
        const response = await apiClient.post('/friends/reject', { requestId });
        return response.data;
    },
};

