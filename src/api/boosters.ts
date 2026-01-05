import apiClient from './client';

export interface BoosterPricing {
    totalCost: number;
    costPerBooster: number;
    savings: number;
    savingsPercentage: number;
}

export interface BoosterPricingList {
    single: BoosterPricing;
    double: BoosterPricing;
    bulk3: BoosterPricing;
    bulk5: BoosterPricing;
    bulk10: BoosterPricing;
}

export interface PurchaseResult {
    boostersPurchased: number;
    gemsCost: number;
    newBoostersOwned: number;
    newGemsBalance: number;
}

export interface ActivateResult {
    boostExpiresAt: string;
    boostersUsed: number;
    boostersRemaining: number;
}

export interface BoosterStatus {
    isActive: boolean;
    timeRemainingSeconds: number;
    boostersOwned: number;
    activeBoost?: {
        startedAt: string;
        durationMinutes: number;
        expiresAt: string;
    };
}

export const boostersApi = {
    /**
     * Get booster pricing
     */
    getPricing: async (): Promise<BoosterPricingList> => {
        const response = await apiClient.get('/boosters/pricing');
        return response.data;
    },

    /**
     * Calculate cost for desired boosters
     */
    calculateCost: async (count: number): Promise<BoosterPricing> => {
        const response = await apiClient.get('/boosters/calculate', { params: { count } });
        return response.data;
    },

    /**
     * Purchase boosters
     */
    purchase: async (desiredBoosters: number): Promise<PurchaseResult> => {
        const response = await apiClient.post('/boosters/purchase', { desiredBoosters });
        return response.data;
    },

    /**
     * Activate boost
     */
    activate: async (durationMinutes: 15 | 30 | 45): Promise<ActivateResult> => {
        const response = await apiClient.post('/boosters/activate', { durationMinutes });
        return response.data;
    },

    /**
     * Get boost status
     */
    getStatus: async (): Promise<BoosterStatus> => {
        const response = await apiClient.get('/boosters/status');
        return response.data;
    },
};
