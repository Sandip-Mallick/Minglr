import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Text,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useGemsStore } from '../../store';

interface BoosterButtonProps {
    onPress: () => void;
}

export const BoosterButton: React.FC<BoosterButtonProps> = ({ onPress }) => {
    const { activeBoost } = useGemsStore();
    const [progress, setProgress] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState('');

    const isBoostActive = activeBoost && new Date(activeBoost.expiresAt) > new Date();

    const calculateProgress = useCallback(() => {
        if (!activeBoost) return 0;

        const startedAt = new Date(activeBoost.startedAt).getTime();
        const expiresAt = new Date(activeBoost.expiresAt).getTime();
        const now = Date.now();

        const totalDuration = expiresAt - startedAt;
        const elapsed = now - startedAt;
        const remaining = Math.max(0, 1 - elapsed / totalDuration);

        return remaining;
    }, [activeBoost]);

    const formatTimeRemaining = useCallback(() => {
        if (!activeBoost) return '';

        const expiresAt = new Date(activeBoost.expiresAt).getTime();
        const now = Date.now();
        const diff = Math.max(0, expiresAt - now);

        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [activeBoost]);

    useEffect(() => {
        if (!isBoostActive) {
            setProgress(0);
            setTimeRemaining('');
            return;
        }

        const updateTimer = () => {
            setProgress(calculateProgress());
            setTimeRemaining(formatTimeRemaining());
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [isBoostActive, calculateProgress, formatTimeRemaining]);

    // SVG Circle parameters for progress ring
    const size = 68;
    const strokeWidth = 4;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* Background circle */}
            <View style={[
                styles.circle,
                isBoostActive ? styles.circleActive : styles.circleInactive,
            ]}>
                {/* Progress ring (only when boosted) */}
                {isBoostActive && (
                    <Svg width={size} height={size} style={styles.progressSvg}>
                        {/* Background track */}
                        <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="rgba(255, 255, 255, 0.25)"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                        />
                        {/* Progress arc */}
                        <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#FFFFFF"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            rotation="-90"
                            origin={`${center}, ${center}`}
                        />
                    </Svg>
                )}

                {/* Rocket vector icon */}
                <Ionicons
                    name="rocket"
                    size={32}
                    color={isBoostActive ? '#FFFFFF' : '#FFFFFF'}
                />
            </View>

            {/* Time badge (only when boosted) */}
            {isBoostActive && timeRemaining && (
                <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>{timeRemaining}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleInactive: {
        backgroundColor: 'rgba(100, 100, 100, 0.6)',
    },
    circleActive: {
        backgroundColor: '#4CAF50',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
        elevation: 8,
    },
    progressSvg: {
        position: 'absolute',
    },
    timeBadge: {
        position: 'absolute',
        bottom: -4,
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    timeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default BoosterButton;
