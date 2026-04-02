/**
 * Input validation utilities for mingler
 * Centralized validation rules for email, password, and input sanitization
 */

export interface ValidationResult {
    isValid: boolean;
    error: string | null;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
    if (!email || !email.trim()) {
        return { isValid: false, error: 'Email is required' };
    }

    const trimmed = email.trim();

    // RFC 5322 simplified regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmed)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    if (trimmed.length > 254) {
        return { isValid: false, error: 'Email address is too long' };
    }

    return { isValid: true, error: null };
};

/**
 * Password strength rules
 */
export interface PasswordStrength {
    score: number; // 0–4
    label: 'Weak' | 'Fair' | 'Good' | 'Strong';
    color: string;
    checks: {
        minLength: boolean;
        hasUppercase: boolean;
        hasNumber: boolean;
        hasSpecial: boolean;
    };
}

/**
 * Validate password with strong rules
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const validatePassword = (password: string): ValidationResult => {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
        return { isValid: false, error: 'Password must be at least 8 characters' };
    }

    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least 1 uppercase letter' };
    }

    if (!/[0-9]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least 1 number' };
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least 1 special character' };
    }

    return { isValid: true, error: null };
};

/**
 * Get password strength indicator
 */
export const getPasswordStrength = (password: string): PasswordStrength => {
    const checks = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;

    const labels: Record<number, PasswordStrength['label']> = {
        0: 'Weak',
        1: 'Weak',
        2: 'Fair',
        3: 'Good',
        4: 'Strong',
    };

    const colors: Record<number, string> = {
        0: '#FF3B30',
        1: '#FF3B30',
        2: '#FF9500',
        3: '#34C759',
        4: '#00C853',
    };

    return {
        score,
        label: labels[score],
        color: colors[score],
        checks,
    };
};

/**
 * Sanitize text input — strip potentially dangerous characters
 * Prevents basic XSS and injection patterns
 */
export const sanitizeInput = (input: string): string => {
    return input
        .replace(/[<>]/g, '') // Strip angle brackets
        .replace(/javascript:/gi, '') // Strip JS protocol
        .replace(/on\w+=/gi, '') // Strip event handlers
        .trim();
};

/**
 * Validate that a field is not empty
 */
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
    if (!value || !value.trim()) {
        return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true, error: null };
};
