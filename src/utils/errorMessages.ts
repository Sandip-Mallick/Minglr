/**
 * Centralized error message mapper for mingler
 * Converts raw backend/Firebase/network errors into user-friendly messages
 */

import axios from 'axios';

/**
 * Firebase Auth error code → user-friendly message
 */
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Use at least 8 characters with uppercase, numbers, and symbols.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/requires-recent-login': 'Please sign in again to continue.',
    'auth/account-exists-with-different-credential': 'An account with this email already exists using a different sign-in method.',
    'auth/credential-already-in-use': 'This credential is already linked to another account.',
    'auth/expired-action-code': 'This link has expired. Please request a new one.',
    'auth/invalid-action-code': 'This link is invalid or has already been used.',
};

/**
 * HTTP status code → user-friendly message
 */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'Session expired. Please sign in again.',
    403: 'You don\'t have permission to do this.',
    404: 'The requested resource was not found.',
    408: 'Request timed out. Please try again.',
    409: 'This action conflicts with existing data.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error. Please try again later.',
    502: 'Server is temporarily unavailable. Please try again later.',
    503: 'Service is under maintenance. Please try again shortly.',
    504: 'Server took too long to respond. Please try again.',
};

/**
 * Get a user-friendly error message from a Firebase auth error
 */
export const getFirebaseErrorMessage = (error: any): string => {
    if (error?.code && FIREBASE_ERROR_MESSAGES[error.code]) {
        return FIREBASE_ERROR_MESSAGES[error.code];
    }

    // Fallback to error message if it's readable
    if (error?.message && !error.message.includes('Firebase')) {
        return error.message;
    }

    return 'Authentication failed. Please try again.';
};

/**
 * Detect if an error is a network/connectivity issue
 */
export const isNetworkError = (error: any): boolean => {
    if (!error) return false;

    // Axios network errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
        return true;
    }

    // Generic network error message
    if (error.message === 'Network Error' || error.message?.includes('Network request failed')) {
        return true;
    }

    // Firebase network error
    if (error.code === 'auth/network-request-failed') {
        return true;
    }

    return false;
};

/**
 * Detect timeout errors
 */
export const isTimeoutError = (error: any): boolean => {
    return error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT';
};

/**
 * Get a user-friendly message for network errors
 */
export const getNetworkErrorMessage = (error: any): string => {
    if (isTimeoutError(error)) {
        return 'Request timed out. Please check your connection and try again.';
    }

    return 'Cannot connect to the server. Please check your internet connection and try again.';
};

/**
 * Get a user-friendly error message from an API error
 * Handles axios errors, HTTP status codes, and backend error responses
 */
export const getApiErrorMessage = (error: any): string => {
    // Network errors first
    if (isNetworkError(error)) {
        return getNetworkErrorMessage(error);
    }

    // Timeout
    if (isTimeoutError(error)) {
        return getNetworkErrorMessage(error);
    }

    // Axios error with response
    if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;

        // Auth provider conflict
        if (status === 409 && data?.error === 'AUTH_PROVIDER_CONFLICT') {
            return data.message || 'Account conflict detected.';
        }

        // Backend error message (from our errorHandler)
        if (data?.message) {
            return data.message;
        }

        // Backend error code
        if (data?.error && typeof data.error === 'string' && data.error !== 'INTERNAL_ERROR') {
            // Convert error codes to readable messages
            const codeMessages: Record<string, string> = {
                'INSUFFICIENT_GEMS': 'You don\'t have enough gems for this action.',
                'INSUFFICIENT_BOOSTERS': 'You don\'t have any boosters available.',
                'BOOST_ALREADY_ACTIVE': 'You already have an active boost running.',
                'EMAIL_NOT_VERIFIED': 'Please verify your email to continue.',
                'PROFILE_INCOMPLETE': 'Please complete your profile first.',
                'NO_LETTERS': 'You don\'t have any letters available.',
                'NO_SWIPE_TO_UNDO': 'There\'s no recent swipe to undo.',
                'ALREADY_FRIENDS': 'You\'re already friends with this person.',
                'REQUEST_PENDING': 'You already have a pending request.',
                'VALIDATION_ERROR': 'Please check your input and try again.',
                'DUPLICATE_ENTRY': 'This already exists.',
            };

            if (codeMessages[data.error]) {
                return codeMessages[data.error];
            }
        }

        // HTTP status fallback
        if (HTTP_ERROR_MESSAGES[status]) {
            return HTTP_ERROR_MESSAGES[status];
        }
    }

    // Generic error with message
    if (error?.message) {
        return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
};

/**
 * Combined error handler — tries Firebase first, then API, then generic
 */
export const getUserFriendlyError = (error: any): string => {
    // Firebase error
    if (error?.code?.startsWith?.('auth/')) {
        return getFirebaseErrorMessage(error);
    }

    // API/Network error
    return getApiErrorMessage(error);
};
