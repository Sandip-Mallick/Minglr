import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { secureStorage } from '../utils/secureStorage';

// Get API URL from Expo environment variables (must use EXPO_PUBLIC_ prefix)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.29.213:3000/api';

// Debug: Log the API URL only in development
if (__DEV__) {
    console.log('[API Client] Using API URL:', API_BASE_URL);
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await secureStorage.getItemAsync('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await secureStorage.getItemAsync('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data;

                    await secureStorage.setItemAsync('accessToken', accessToken);
                    await secureStorage.setItemAsync('refreshToken', newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Clear tokens on refresh failure
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
}

export const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as ApiError;
        return apiError?.message || apiError?.error || 'An error occurred';
    }
    return 'An unexpected error occurred';
};
