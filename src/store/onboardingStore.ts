import { create } from 'zustand';

interface OnboardingState {
    // Basic Info
    name: string;
    age: string;
    gender: 'male' | 'female' | 'other' | '';
    country: string;

    // Preferences
    searchCountries: 'worldwide' | 'specific';
    genderPreference: 'male' | 'female' | 'everyone';

    // Photos
    photoUris: string[];

    // Actions
    setBasicInfo: (name: string, age: string, gender: 'male' | 'female' | 'other', country: string) => void;
    setPreferences: (searchCountries: 'worldwide' | 'specific', genderPreference: 'male' | 'female' | 'everyone') => void;
    setPhotoUris: (uris: string[]) => void;
    addPhotoUri: (uri: string) => void;
    removePhotoUri: (index: number) => void;
    reset: () => void;
}

const initialState = {
    name: '',
    age: '',
    gender: '' as const,
    country: '',
    searchCountries: 'worldwide' as const,
    genderPreference: 'everyone' as const,
    photoUris: [],
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
    ...initialState,

    setBasicInfo: (name, age, gender, country) => set({ name, age, gender, country }),

    setPreferences: (searchCountries, genderPreference) => set({ searchCountries, genderPreference }),

    setPhotoUris: (uris) => set({ photoUris: uris }),

    addPhotoUri: (uri) => set((state) => ({ photoUris: [...state.photoUris, uri] })),

    removePhotoUri: (index) => set((state) => ({
        photoUris: state.photoUris.filter((_, i) => i !== index),
    })),

    reset: () => set(initialState),
}));
