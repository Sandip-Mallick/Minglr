import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { secureStorage } from '../utils/secureStorage';

// Get API URL from Expo environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://minglr-backend.onrender.com/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// In-flight request deduplication map (only for GET requests)
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Generate a unique key for a request to detect duplicates
 */
const getRequestKey = (config: InternalAxiosRequestConfig): string => {
    return `${config.method}:${config.baseURL}${config.url}:${JSON.stringify(config.params || '')}`;
};

/**
 * Decode JWT payload without verification (frontend-side pre-check)
 * Returns null if the token is invalid or can't be decoded
 */
const decodeJwtPayload = (token: string): { exp?: number } | null => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch {
        return null;
    }
};

/**
 * Check if a JWT token is about to expire (within 60 seconds)
 */
const isTokenExpiringSoon = (token: string): boolean => {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return false;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp - nowInSeconds < 60; // Less than 60 seconds left
};

// Track if a token refresh is currently in progress
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Proactively refresh the access token
 * Returns the new access token, or null if refresh failed
 */
const proactiveRefresh = async (): Promise<string | null> => {
    // If already refreshing, wait for the existing refresh
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const refreshToken = await secureStorage.getItemAsync('refreshToken');
            if (!refreshToken) return null;

            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;

            await secureStorage.setItemAsync('accessToken', accessToken);
            await secureStorage.setItemAsync('refreshToken', newRefreshToken);

            return accessToken as string;
        } catch {
            return null;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

// Request interceptor — add auth token, pre-check JWT expiry, deduplicate GETs
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        let token = await secureStorage.getItemAsync('accessToken');

        // Proactively refresh if token is expiring soon
        if (token && isTokenExpiringSoon(token)) {
            const newToken = await proactiveRefresh();
            if (newToken) {
                token = newToken;
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — token refresh on 401, force logout on failure
apiClient.interceptors.response.use(
    (response) => {
        // Remove from pending on success
        if (response.config.method === 'get') {
            const key = getRequestKey(response.config);
            pendingRequests.delete(key);
        }
        return response;
    },
    async (error: AxiosError) => {
        // Remove from pending on error
        if (error.config?.method === 'get') {
            const key = getRequestKey(error.config);
            pendingRequests.delete(key);
        }

        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const newToken = await proactiveRefresh();
            if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);
            }

            // Refresh failed — force logout
            // Use dynamic import to prevent circular dependency
            try {
                const { useAuthStore } = await import('../store/authStore');
                await useAuthStore.getState().forceLogout();
            } catch {
                // Fallback: clear storage directly
                await secureStorage.deleteItemAsync('accessToken');
                await secureStorage.deleteItemAsync('refreshToken');
                await secureStorage.deleteItemAsync('user');
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;

// Error handling helper
export interface ApiError {
    error: string;
    message?: string;
    details?: Array<{ path: string; message: string }>;
    authProvider?: string;
}

export const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as ApiError;

        // Auth provider conflict
        if (error.response?.status === 409 && apiError?.error === 'AUTH_PROVIDER_CONFLICT') {
            return apiError.message || 'Account conflict detected.';
        }

        return apiError?.message || apiError?.error || 'An error occurred';
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
};
