import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { boostersApi } from '../../api/boosters';
import { useGemsStore } from '../../store';
import { GemIcon } from '../Icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Pricing constants matching backend
const PRICING = {
    15: { boosters: 1, gems: 690, discount: 0 },
    30: { boosters: 2, gems: 1104, originalGems: 1380, discount: 20 },
    45: { boosters: 3, gems: 1407, originalGems: 2070, discount: 32 },
} as const;

type BoostDuration = 15 | 30 | 45;

interface BoosterModalProps {
    visible: boolean;
    onClose: () => void;
    userPhoto?: string;
    onBoostActivated: () => void;
}

export const BoosterModal: React.FC<BoosterModalProps> = ({
    visible,
    onClose,
    userPhoto,
    onBoostActivated,
}) => {
    const insets = useSafeAreaInsets();
    const { gemsBalance, boostersOwned, activeBoost, syncFromUser } = useGemsStore();

    const [selectedDuration, setSelectedDuration] = useState<BoostDuration>(15);
    const [loading, setLoading] = useState(false);

    const pricing = PRICING[selectedDuration];
    const boostersNeeded = pricing.boosters;
    const hasEnoughBoosters = boostersOwned >= boostersNeeded;
    const boostersShort = Math.max(0, boostersNeeded - boostersOwned);
    const buyPrice = boostersShort * 690;
    const hasEnoughGems = gemsBalance >= buyPrice;
    const isBoostActive = activeBoost && new Date(activeBoost.expiresAt) > new Date();

    useEffect(() => {
        if (visible) {
            fetchBoostStatus();
        }
    }, [visible]);

    const fetchBoostStatus = async () => {
        try {
            const status = await boostersApi.getStatus();
            syncFromUser({
                gemsBalance,
                boostersOwned: status.boostersOwned,
                activeBoost: status.activeBoost || null,
            });
        } catch (error) {
            console.error('Failed to fetch boost status:', error);
        }
    };

    const handleBuyBoosters = async () => {
        if (loading) return;

        if (!hasEnoughGems) {
            Alert.alert(
                'Not Enough Gems',
                `You need ${buyPrice} gems but only have ${gemsBalance}. Get more gems to purchase boosters!`,
                [{ text: 'OK' }]
            );
            return;
        }

        setLoading(true);
        try {
            const result = await boostersApi.purchase(boostersShort);
            syncFromUser({
                gemsBalance: result.newGemsBalance,
                boostersOwned: result.newBoostersOwned,
            });
        } catch (error) {
            console.error('Failed to purchase boosters:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivateBoost = async () => {
        if (!hasEnoughBoosters || loading) return;

        setLoading(true);
        try {
            const result = await boostersApi.activate(selectedDuration);
            syncFromUser({
                gemsBalance,
                boostersOwned: result.boostersRemaining,
                activeBoost: {
                    startedAt: new Date().toISOString(),
                    durationMinutes: selectedDuration,
                    expiresAt: result.boostExpiresAt,
                },
            });
            onBoostActivated();
        } catch (error) {
            console.error('Failed to activate boost:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeRemaining = useCallback(() => {
        if (!activeBoost) return '';
        const expiresAt = new Date(activeBoost.expiresAt);
        const now = new Date();
        const diff = expiresAt.getTime() - now.getTime();
        if (diff <= 0) return '00:00:00';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [activeBoost]);

    const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining());

    useEffect(() => {
        if (!isBoostActive) return;

        const interval = setInterval(() => {
            setTimeRemaining(formatTimeRemaining());
        }, 1000);

        return () => clearInterval(interval);
    }, [isBoostActive, formatTimeRemaining]);

    const renderDurationTab = (duration: BoostDuration) => {
        const isSelected = selectedDuration === duration;
        const tabPricing = PRICING[duration];

        return (
            <TouchableOpacity
                key={duration}
                style={[
                    styles.tab,
                    isSelected ? styles.tabSelected : styles.tabUnselected,
                ]}
                onPress={() => setSelectedDuration(duration)}
            >
                {/* Rocket vector icon with count badge */}
                <View style={styles.tabIconWrapper}>
                    <Ionicons
                        name="rocket"
                        size={26}
                        color={isSelected ? '#4CAF50' : '#2E7D32'}
                    />
                    <View style={[
                        styles.tabBadge,
                        isSelected ? styles.tabBadgeWhite : styles.tabBadgeBlue,
                    ]}>
                        <Text style={[
                            styles.tabBadgeText,
                            isSelected && { color: '#000000' },
                        ]}>{tabPricing.boosters}</Text>
                    </View>
                </View>
                <Text style={[
                    styles.tabText,
                    isSelected ? styles.tabTextWhite : styles.tabTextBlack,
                ]}>
                    {duration}m
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.overlayTap} onPress={onClose} />

                <View style={styles.modal}>
                    {/* Dark section */}
                    <View style={styles.darkPart}>
                        {/* Header */}
                        <View style={[styles.header, { paddingTop: 16 }]}>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.title}>Boost</Text>

                            <View style={styles.badges}>
                                <View style={styles.badge}>
                                    <Ionicons name="rocket" size={16} color="#4CAF50" />
                                    <Text style={styles.badgeText}>{boostersOwned}</Text>
                                </View>
                                <View style={styles.badge}>
                                    <GemIcon size={16} />
                                    <Text style={styles.badgeText}>{gemsBalance}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Photo with WHITE rocket emojis */}
                        <View style={styles.photoArea}>
                            {/* White/emoji rockets scattered */}
                            <Text style={[styles.rocket, { top: 5, left: 50 }]}>🚀</Text>
                            <Text style={[styles.rocket, { top: 40, left: 25 }]}>🚀</Text>
                            <Text style={[styles.rocket, { bottom: 60, left: 45 }]}>🚀</Text>
                            <Text style={[styles.rocket, { top: 20, right: 35 }]}>🚀</Text>
                            <Text style={[styles.rocket, { bottom: 40, right: 25 }]}>🚀</Text>
                            <Text style={[styles.rocket, { bottom: 80, right: 60 }]}>🚀</Text>

                            <View style={styles.photoWrap}>
                                {userPhoto ? (
                                    <Image source={{ uri: userPhoto }} style={styles.photo} />
                                ) : (
                                    <View style={[styles.photo, styles.photoEmpty]}>
                                        <Ionicons name="person" size={50} color="#555555" />
                                    </View>
                                )}
                                {isBoostActive && (
                                    <View style={styles.timer}>
                                        <Text style={styles.timerText}>{timeRemaining} 🚀</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Description */}
                        <View style={styles.desc}>
                            <Text style={styles.descText}>
                                - Be the first in the swipe list for {selectedDuration}m
                            </Text>
                            <Text style={styles.descText}>
                                - Swiping right on you won't cost any gems 💰
                            </Text>
                        </View>
                    </View>

                    {/* Green section - extends to bottom */}
                    <View style={[styles.greenPart, { paddingBottom: insets.bottom + 30 }]}>
                        {/* Duration tabs */}
                        <View style={styles.tabs}>
                            {([15, 30, 45] as BoostDuration[]).map(renderDurationTab)}
                        </View>

                        {/* Action */}
                        {isBoostActive ? (
                            <View style={styles.btn}>
                                <Text style={styles.btnText}>You're boosted</Text>
                            </View>
                        ) : hasEnoughBoosters ? (
                            <TouchableOpacity
                                style={styles.btn}
                                onPress={handleActivateBoost}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <View style={styles.btnRow}>
                                        <Text style={styles.btnText}>Boost now</Text>
                                        <Ionicons name="rocket" size={20} color="#4CAF50" />
                                        <Text style={styles.btnNum}>{boostersNeeded}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <>
                                <Text style={styles.needText}>
                                    You need {boostersShort} 🚀!
                                </Text>
                                <TouchableOpacity
                                    style={styles.btn}
                                    onPress={handleBuyBoosters}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <View style={styles.btnRow}>
                                            <Text style={styles.btnText}>Buy {boostersShort}</Text>
                                            <Ionicons name="rocket" size={20} color="#4CAF50" />
                                            <GemIcon size={18} />
                                            <Text style={styles.btnPrice}>{buyPrice}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    overlayTap: {
        flex: 1,
    },
    modal: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    darkPart: {
        backgroundColor: '#000000',
        paddingHorizontal: 20,
    },
    greenPart: {
        backgroundColor: '#5AE65A',
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 8,
        flex: 1,
    },
    badges: {
        flexDirection: 'row',
        gap: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        gap: 5,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    photoArea: {
        alignItems: 'center',
        height: 170,
        justifyContent: 'center',
        position: 'relative',
    },
    rocket: {
        fontSize: 16,
        position: 'absolute',
    },
    photoWrap: {
        alignItems: 'center',
    },
    photo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    photoEmpty: {
        backgroundColor: '#222222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timer: {
        position: 'absolute',
        bottom: -14,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
    },
    timerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    desc: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 12,
    },
    descText: {
        fontSize: 15,
        color: '#FFFFFF',
        textAlign: 'center',
        marginVertical: 2,
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 28,
    },
    tab: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    tabSelected: {
        backgroundColor: '#1A1A1A',
    },
    tabUnselected: {
        backgroundColor: 'rgba(144, 238, 144, 0.6)',
    },
    tabIconWrapper: {
        position: 'relative',
        marginBottom: 4,
    },
    tabBadge: {
        position: 'absolute',
        top: -5,
        right: -10,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabBadgeWhite: {
        backgroundColor: '#FFFFFF',
    },
    tabBadgeBlue: {
        backgroundColor: '#4A90D9',
    },
    tabBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
    },
    tabTextWhite: {
        color: '#FFFFFF',
    },
    tabTextBlack: {
        color: '#000000',
    },
    needText: {
        fontSize: 17,
        color: '#000000',
        textAlign: 'center',
        marginBottom: 14,
        fontWeight: '500',
    },
    btn: {
        backgroundColor: '#2A2A2A',
        borderRadius: 28,
        paddingVertical: 16,
        paddingHorizontal: 44,
        alignItems: 'center',
        alignSelf: 'center',
    },
    btnDisabled: {
        opacity: 0.5,
    },
    btnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    btnText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    btnNum: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    btnPrice: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 3,
    },
});

export default BoosterModal;
