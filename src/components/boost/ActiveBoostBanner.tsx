import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { useGemsStore } from '../../store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActiveBoostBannerProps {
    style?: object;
}

export const ActiveBoostBanner: React.FC<ActiveBoostBannerProps> = ({ style }) => {
    const { activeBoost } = useGemsStore();
    const [timeRemaining, setTimeRemaining] = useState('');

    const isBoostActive = activeBoost && new Date(activeBoost.expiresAt) > new Date();

    const formatTimeRemaining = useCallback(() => {
        if (!activeBoost) return '';

        const expiresAt = new Date(activeBoost.expiresAt).getTime();
        const now = Date.now();
        const diff = Math.max(0, expiresAt - now);

        if (diff <= 0) return '00:00:00';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [activeBoost]);

    useEffect(() => {
        if (!isBoostActive) {
            setTimeRemaining('');
            return;
        }

        const updateTimer = () => {
            setTimeRemaining(formatTimeRemaining());
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [isBoostActive, formatTimeRemaining]);

    if (!isBoostActive) {
        return null;
    }

    return (
        <View style={[styles.container, style]}>
            <View style={styles.banner}>
                <Text style={styles.bannerText}>
                    🚀 You're boosted! {timeRemaining}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90,
        left: 20,
        right: 80, // Leave space for the booster button
    },
    banner: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 28,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    bannerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
    },
});

export default ActiveBoostBanner;
