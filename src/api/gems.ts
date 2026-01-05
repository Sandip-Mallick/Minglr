import apiClient from './client';

export interface GemsBalance {
    gemsBalance: number;
    boostersOwned: number;
    activeBoost?: {
        startedAt: string;
        durationMinutes: number;
        expiresAt: string;
    };
    referralCode: string;
    referralCount: number;
}

export interface EarnAdResult {
    gemsEarned: number;
    newBalance: number;
    dailyLimitReached?: boolean;
}

export interface ReferralStatus {
    currentProgress: number;
    totalReferrals: number;
    gemsEarnedToday: number;
    dailyLimit: number;
    canClaim: boolean;
}

export interface InviteLinkResult {
    inviteUrl: string;
    code: string;
}

export const gemsApi = {
    /**
     * Get gems and boosters balance
     */
    getBalance: async (): Promise<GemsBalance> => {
        const response = await apiClient.get('/gems');
        return response.data;
    },

    /**
     * Earn gems from watching ad
     */
    earnFromAd: async (adSessionId: string): Promise<EarnAdResult> => {
        const response = await apiClient.post('/gems/earn/ad', { adSessionId });
        return response.data;
    },

    /**
     * Apply referral code
     */
    applyReferral: async (referralCode: string): Promise<{ success: boolean; message: string }> => {
        const response = await apiClient.post('/gems/referral/apply', { referralCode });
        return response.data;
    },

    /**
     * Claim referral rewards
     */
    claimReferralRewards: async (): Promise<{ success: boolean; gemsAwarded?: number; message?: string }> => {
        const response = await apiClient.post('/gems/referral/claim');
        return response.data;
    },

    /**
     * Get unique invite link for sharing
     */
    getInviteLink: async (): Promise<InviteLinkResult> => {
        const response = await apiClient.get('/gems/invite-link');
        return response.data;
    },

    /**
     * Get current referral status with progress and daily limits
     */
    getReferralStatus: async (): Promise<ReferralStatus> => {
        const response = await apiClient.get('/gems/referral-status');
        return response.data;
    },
};

