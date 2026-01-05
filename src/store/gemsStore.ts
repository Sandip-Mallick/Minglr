import { create } from 'zustand';

interface GemsState {
    gemsBalance: number;
    boostersOwned: number;
    lettersOwned: number;
    activeBoost: {
        startedAt: string;
        durationMinutes: number;
        expiresAt: string;
    } | null;
    referralCode: string;
    referralCount: number;

    // Actions
    setBalance: (gems: number, boosters: number, letters?: number) => void;
    addGems: (amount: number) => void;
    deductGems: (amount: number) => void;
    addBoosters: (amount: number) => void;
    addLetters: (amount: number) => void;
    deductLetter: () => void;
    setActiveBoost: (boost: GemsState['activeBoost']) => void;
    setReferral: (code: string, count: number) => void;
    syncFromUser: (userData: {
        gemsBalance: number;
        boostersOwned: number;
        lettersOwned?: number;
        activeBoost?: GemsState['activeBoost'];
        referralCode?: string;
        referralCount?: number;
    }) => void;
}

export const useGemsStore = create<GemsState>((set) => ({
    gemsBalance: 0,
    boostersOwned: 0,
    lettersOwned: 0,
    activeBoost: null,
    referralCode: '',
    referralCount: 0,

    setBalance: (gems, boosters, letters = 0) => {
        set({ gemsBalance: gems, boostersOwned: boosters, lettersOwned: letters });
    },

    addGems: (amount) => {
        set((state) => ({ gemsBalance: state.gemsBalance + amount }));
    },

    deductGems: (amount) => {
        set((state) => ({ gemsBalance: Math.max(0, state.gemsBalance - amount) }));
    },

    addBoosters: (amount) => {
        set((state) => ({ boostersOwned: state.boostersOwned + amount }));
    },

    addLetters: (amount) => {
        set((state) => ({ lettersOwned: state.lettersOwned + amount }));
    },

    deductLetter: () => {
        set((state) => ({ lettersOwned: Math.max(0, state.lettersOwned - 1) }));
    },

    setActiveBoost: (boost) => {
        set({ activeBoost: boost });
    },

    setReferral: (code, count) => {
        set({ referralCode: code, referralCount: count });
    },

    syncFromUser: (userData) => {
        set({
            gemsBalance: userData.gemsBalance,
            boostersOwned: userData.boostersOwned,
            lettersOwned: userData.lettersOwned || 0,
            activeBoost: userData.activeBoost || null,
            referralCode: userData.referralCode || '',
            referralCount: userData.referralCount || 0,
        });
    },
}));
