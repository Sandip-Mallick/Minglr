import apiClient from './client';

export interface LetterPackage {
    id: string;
    letters: number;
    gemsCost: number;
}

export const lettersApi = {
    /**
     * Get letter balance
     */
    getBalance: async (): Promise<{ lettersOwned: number }> => {
        const response = await apiClient.get('/letters/balance');
        return response.data;
    },

    /**
     * Get available letter packages
     */
    getPackages: async (): Promise<{ packages: LetterPackage[] }> => {
        const response = await apiClient.get('/letters/packages');
        return response.data;
    },

    /**
     * Purchase letters
     */
    purchase: async (packageId: string): Promise<{
        success: boolean;
        lettersOwned: number;
        gemsBalance: number;
    }> => {
        const response = await apiClient.post('/letters/purchase', { packageId });
        return response.data;
    },
};
