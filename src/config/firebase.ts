import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
    initializeAuth,
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    GoogleAuthProvider,
    signInWithCredential,
    onAuthStateChanged,
    User,
    Auth,
    // @ts-ignore - React Native persistence
    getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration from environment variables
// These are set in eas.json for builds and can be overridden locally
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Validate Firebase config in development
if (__DEV__) {
    const missingKeys = Object.entries(firebaseConfig)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
    if (missingKeys.length > 0) {
        console.warn('[Firebase] Missing config keys:', missingKeys.join(', '));
    }
}

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

// Initialize Firebase Auth with React Native AsyncStorage persistence
// This ensures auth state persists across app restarts
let auth: Auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} catch (error: any) {
    // Auth already initialized (e.g., on hot reload), get existing instance
    auth = getAuth(app);
}

// Auth functions
export const firebaseAuth = {
    /**
     * Sign in with email and password
     */
    signInWithEmail: async (email: string, password: string) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },

    /**
     * Sign up with email and password
     */
    signUpWithEmail: async (email: string, password: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Send email verification
        if (userCredential.user) {
            await sendEmailVerification(userCredential.user);
        }
        return userCredential.user;
    },

    /**
     * Sign in with Google (using Google Sign-In library credential)
     */
    signInWithGoogle: async (idToken: string) => {
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        return userCredential.user;
    },

    /**
     * Sign out
     */
    signOut: async () => {
        await signOut(auth);
    },

    /**
     * Send password reset email
     */
    sendPasswordReset: async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    },

    /**
     * Resend email verification
     */
    resendVerificationEmail: async () => {
        const user = auth.currentUser;
        if (user) {
            await sendEmailVerification(user);
        }
    },

    /**
     * Get current user
     */
    getCurrentUser: (): User | null => {
        return auth.currentUser;
    },

    /**
     * Get Firebase ID token for backend verification
     */
    getIdToken: async (): Promise<string | null> => {
        const user = auth.currentUser;
        if (user) {
            return await user.getIdToken(true);
        }
        return null;
    },

    /**
     * Check if email is verified
     */
    isEmailVerified: (): boolean => {
        return auth.currentUser?.emailVerified ?? false;
    },

    /**
     * Reload current user to get updated email verification status
     */
    reloadUser: async () => {
        const user = auth.currentUser;
        if (user) {
            await user.reload();
        }
    },

    /**
     * Listen to auth state changes
     */
    onAuthStateChanged: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    },
};

export { auth };
export default firebaseAuth;
