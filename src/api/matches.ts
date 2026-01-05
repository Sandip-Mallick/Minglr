import apiClient from './client';

export interface MatchResult {
    found: boolean;
    user?: {
        _id: string;
        name: string;
        age: number;
        country: string;
        photos: Array<{ url: string; isMain: boolean }>;
        bio?: string;
    };
    chatId?: string;
    message?: string;
}

export const matchesApi = {
    /**
     * Find an online match
     */
    findMatch: async (): Promise<MatchResult> => {
        const response = await apiClient.post('/match/find');
        return response.data;
    },
};
