/**
 * Production-safe logger for mingler
 *
 * - Only logs in __DEV__ mode (development)
 * - Provides structured interface ready for Sentry integration
 * - Drop-in replacement for console.log/error/warn
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.info('Something happened', { extra: 'data' });
 *   logger.error('Something broke', error);
 *   logger.warn('Watch out', { detail: 'info' });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    data?: unknown;
}

/**
 * Format a log entry for console output
 */
const formatLog = (entry: LogEntry): string => {
    const prefix = `[${entry.level.toUpperCase()}]`;
    return `${prefix} ${entry.message}`;
};

/**
 * Core log function
 */
const log = (level: LogLevel, message: string, data?: unknown): void => {
    // Only log in development
    if (!__DEV__) {
        // TODO: In production, send to Sentry/analytics
        // if (level === 'error') {
        //     Sentry.captureMessage(message, { level, extra: data });
        // }
        return;
    }

    const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        data,
    };

    const formatted = formatLog(entry);

    switch (level) {
        case 'debug':
            // eslint-disable-next-line no-console
            console.log(formatted, data !== undefined ? data : '');
            break;
        case 'info':
            // eslint-disable-next-line no-console
            console.log(formatted, data !== undefined ? data : '');
            break;
        case 'warn':
            // eslint-disable-next-line no-console
            console.warn(formatted, data !== undefined ? data : '');
            break;
        case 'error':
            // eslint-disable-next-line no-console
            console.error(formatted, data !== undefined ? data : '');
            break;
    }
};

export const logger = {
    debug: (message: string, data?: unknown) => log('debug', message, data),
    info: (message: string, data?: unknown) => log('info', message, data),
    warn: (message: string, data?: unknown) => log('warn', message, data),
    error: (message: string, data?: unknown) => log('error', message, data),
};

export default logger;
