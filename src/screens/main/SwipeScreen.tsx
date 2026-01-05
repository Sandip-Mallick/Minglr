import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Keyboard, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { SwipeCard } from '../../components/swipe/SwipeCard';
import { swipesApi } from '../../api/swipes';
import { friendsApi } from '../../api/friends';
import { gemsApi } from '../../api/gems';
import { boostersApi } from '../../api/boosters';
import { useGemsStore, useAuthStore } from '../../store';
import { useNavigation } from '@react-navigation/native';
import { GemIcon } from '../../components/Icons';
import { SearchPreferencesModal } from '../../components/common/SearchPreferencesModal';
import { BoosterModal, BoosterButton, ActiveBoostBanner } from '../../components/boost';
import { getCountryByCode } from '../../utils/countries';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STACK_SIZE = 5;
const CARD_MARGIN = 10;

interface UserProfile {
    _id: string;
    name: string;
    age: number;
    country: string;
    bio?: string;
    photos: Array<{ url: string; isMain: boolean; isVerified: boolean }>;
    onlineStatus?: { isOnline: boolean };
}

const SwipeScreen: React.FC = () => {
    const { colors, primary, spacing, borderRadius, typography, isDark } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { gemsBalance, deductGems, lettersOwned, deductLetter, syncFromUser } = useGemsStore();
    const { user: currentUser } = useAuthStore();

    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showSearchPreferences, setShowSearchPreferences] = useState(false);
    const [showBoosterModal, setShowBoosterModal] = useState(false);

    const backgroundScale = useRef(new Animated.Value(1)).current;
    const backgroundTranslateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (showSearchPreferences) {
            Animated.parallel([
                Animated.timing(backgroundScale, {
                    toValue: 0.92,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backgroundTranslateY, {
                    toValue: -20,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backgroundScale, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backgroundTranslateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [showSearchPreferences]);

    // Fetch gems and boost status on mount and poll for boost status
    const fetchGemsAndBoostStatus = useCallback(async () => {
        try {
            const [balance, boostStatus] = await Promise.all([
                gemsApi.getBalance(),
                boostersApi.getStatus(),
            ]);
            syncFromUser({
                gemsBalance: balance.gemsBalance,
                boostersOwned: boostStatus.boostersOwned,
                activeBoost: boostStatus.activeBoost || null,
                referralCode: balance.referralCode,
                referralCount: balance.referralCount,
            });
        } catch (error) {
            console.error('Failed to fetch gems/boost status:', error);
        }
    }, [syncFromUser]);

    useEffect(() => {
        fetchGemsAndBoostStatus();

        // Poll for boost status every 30 seconds (server-polling approach)
        const interval = setInterval(fetchGemsAndBoostStatus, 30000);
        return () => clearInterval(interval);
    }, [fetchGemsAndBoostStatus]);

    // Get user's main photo for booster modal
    const userMainPhoto = currentUser?.photos?.find(p => p.isMain)?.url || currentUser?.photos?.[0]?.url;

    useEffect(() => {
        loadProfiles();
    }, []);

    useEffect(() => {
        const remainingProfiles = profiles.length - currentIndex;
        if (remainingProfiles <= 5 && !loading && profiles.length > 0) {
            prefetchMoreProfiles();
        }
    }, [currentIndex, profiles.length]);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            const data = await swipesApi.getProfiles(20);
            const filteredData = currentUser
                ? data.filter(profile => profile._id !== currentUser._id)
                : data;
            setProfiles(filteredData);
            setCurrentIndex(0);
        } catch (error) {
            console.error('Failed to load profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const prefetchMoreProfiles = async () => {
        try {
            const data = await swipesApi.getProfiles(20);
            const filteredData = currentUser
                ? data.filter(profile => profile._id !== currentUser._id)
                : data;
            const existingIds = new Set(profiles.map(p => p._id));
            const newProfiles = filteredData.filter(p => !existingIds.has(p._id));
            if (newProfiles.length > 0) {
                setProfiles(prev => [...prev, ...newProfiles]);
            }
        } catch (error) {
            console.error('Failed to prefetch profiles:', error);
        }
    };

    const handleSwipe = async (action: 'like' | 'dislike') => {
        const currentProfile = profiles[currentIndex];
        if (!currentProfile) return;

        if (action === 'like') {
            // Swipe right = send friend request (costs 10 gems)
            if (gemsBalance < 10) {
                Alert.alert(
                    'Not Enough Gems',
                    'You need 10 gems to send a friend request.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Get Gems', onPress: () => navigation.navigate('GemsAndBoosters' as never) },
                    ]
                );
                return;
            }

            setCurrentIndex(prev => prev + 1);

            try {
                await friendsApi.sendRequestWithCost(currentProfile._id);
                deductGems(10);
            } catch (error: unknown) {
                setCurrentIndex(prev => Math.max(0, prev - 1));
                if (error && typeof error === 'object' && 'response' in error) {
                    const axiosError = error as { response?: { data?: { error?: string } } };
                    if (axiosError.response?.data?.error === 'ALREADY_FRIENDS') {
                        Alert.alert('Already Friends', `You're already friends with ${currentProfile.name}.`);
                        return;
                    }
                    if (axiosError.response?.data?.error === 'REQUEST_PENDING') {
                        Alert.alert('Request Pending', `You already have a pending request with ${currentProfile.name}.`);
                        return;
                    }
                }
                console.error('Friend request failed:', error);
                Alert.alert('Error', 'Failed to send friend request.');
            }
        } else {
            // Swipe left = dislike (free)
            setCurrentIndex(prev => prev + 1);
            try {
                await swipesApi.swipe(currentProfile._id, 'dislike');
            } catch (error) {
                console.error('Swipe failed:', error);
            }
        }
    };

    const handleUndo = async () => {
        if (gemsBalance < 10) {
            Alert.alert('Not Enough Gems', 'You need 10 gems to undo.');
            return;
        }

        try {
            const result = await swipesApi.undoSwipe();
            deductGems(10);

            if (result.undoneProfile) {
                const newProfiles = [...profiles];
                newProfiles.splice(currentIndex, 0, result.undoneProfile as UserProfile);
                setProfiles(newProfiles);
            }

            Alert.alert('Undo Successful', 'Previous profile restored!');
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { error?: string } } };
                if (axiosError.response?.data?.error === 'NO_SWIPE_TO_UNDO') {
                    Alert.alert('No Swipe to Undo', 'There\'s no recent swipe to undo.');
                    return;
                }
            }
            console.error('Undo failed:', error);
        }
    };

    const handleSendMessage = async (message: string) => {
        Keyboard.dismiss();

        if (lettersOwned < 1) {
            Alert.alert('No Letters', 'You need letters to send a message.');
            return;
        }

        const currentProfile = profiles[currentIndex];
        if (!currentProfile) return;

        try {
            await swipesApi.sendMessage(currentProfile._id, message);
            deductLetter();

            Alert.alert('✉️ Message Sent!', `Your message has been sent to ${currentProfile.name}.`);

            setCurrentIndex(prev => prev + 1);
        } catch (error) {
            Alert.alert('Error', 'Failed to send message.');
        }
    };

    const handleReport = () => {
        Alert.alert('Report User', 'Report functionality coming soon.');
    };

    const getStackCards = () => {
        const cards: UserProfile[] = [];
        for (let i = 0; i < STACK_SIZE; i++) {
            const index = currentIndex + i;
            if (index < profiles.length) {
                cards.push(profiles[index]);
            }
        }
        return cards;
    };

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
            <View style={styles.headerSide}>
                <TouchableOpacity
                    style={[styles.headerIcon, { padding: spacing.xs }]}
                    onPress={() => setShowSearchPreferences(true)}
                >
                    <Ionicons name="options-outline" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.headerLogoContainer}>
                <Image
                    source={require('../../../assets/Logo/Minglr.png')}
                    style={styles.headerLogo}
                    resizeMode="contain"
                />
            </View>

            <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
                <TouchableOpacity
                    style={[
                        styles.gemsContainer,
                        {
                            backgroundColor: colors.surface,
                            borderColor: primary.main,
                            borderRadius: borderRadius.button,
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.xs,
                        }
                    ]}
                    onPress={() => navigation.navigate('GemsAndBoosters' as never)}
                >
                    <GemIcon size={16} />
                    <Text style={[
                        typography.labelSmall,
                        { color: colors.text, marginLeft: spacing.xs }
                    ]}>
                        {gemsBalance}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={primary.main} />
            </View>
        );
    }

    if (profiles.length === 0 || currentIndex >= profiles.length) {
        return (
            <View style={styles.rootContainer}>
                {showSearchPreferences && <View style={styles.darkOverlay} />}

                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: colors.background,
                            transform: [
                                { scale: backgroundScale },
                                { translateY: backgroundTranslateY },
                            ],
                            borderRadius: showSearchPreferences ? 20 : 0,
                            overflow: 'hidden',
                        }
                    ]}
                >
                    {renderHeader()}

                    <View style={styles.emptyCardContainer}>
                        <View style={[
                            styles.emptyCard,
                            {
                                backgroundColor: isDark ? colors.surface : '#E8E8E8',
                                borderRadius: borderRadius.xl,
                            }
                        ]}>
                            <View style={[
                                styles.emptyIconContainer,
                                {
                                    backgroundColor: isDark ? colors.elevated : '#D0D0D0',
                                    borderRadius: borderRadius.full,
                                    marginBottom: spacing.base,
                                }
                            ]}>
                                <Ionicons name="person-outline" size={48} color={colors.textMuted} />
                            </View>
                            <Text style={[typography.h3, { color: colors.text, marginTop: spacing.base }]}>
                                No Profiles Found
                            </Text>
                            <Text style={[
                                typography.body,
                                {
                                    color: colors.textSecondary,
                                    textAlign: 'center',
                                    paddingHorizontal: spacing['2xl'],
                                    marginTop: spacing.sm,
                                }
                            ]}>
                                Try adjusting your preferences or check back later
                            </Text>
                        </View>
                    </View>

                    {/* Booster Button - positioned at bottom right */}
                    <View style={styles.boosterButtonContainer}>
                        <BoosterButton onPress={() => setShowBoosterModal(true)} />
                    </View>

                    {/* Active Boost Banner */}
                    <ActiveBoostBanner />

                </Animated.View>

                <SearchPreferencesModal
                    visible={showSearchPreferences}
                    onClose={() => setShowSearchPreferences(false)}
                    onSave={loadProfiles}
                />

                <BoosterModal
                    visible={showBoosterModal}
                    onClose={() => setShowBoosterModal(false)}
                    userPhoto={userMainPhoto}
                    onBoostActivated={() => {
                        setShowBoosterModal(false);
                        fetchGemsAndBoostStatus();
                    }}
                />
            </View>
        );
    }

    const stackCards = getStackCards();

    return (
        <View style={styles.rootContainer}>
            {showSearchPreferences && <View style={styles.darkOverlay} />}

            <Animated.View
                style={[
                    styles.container,
                    {
                        backgroundColor: colors.background,
                        transform: [
                            { scale: backgroundScale },
                            { translateY: backgroundTranslateY },
                        ],
                        borderRadius: showSearchPreferences ? 20 : 0,
                        overflow: 'hidden',
                    }
                ]}
            >
                {renderHeader()}

                <View style={styles.cardStackContainer}>
                    {profiles.slice(currentIndex, currentIndex + STACK_SIZE).map((profile, relativeIndex) => {
                        const absoluteIndex = currentIndex + relativeIndex;
                        const isTopCard = relativeIndex === 0;

                        return (
                            <View
                                key={`${absoluteIndex}-${profile._id}`}
                                style={[
                                    styles.stackCard,
                                    {
                                        zIndex: STACK_SIZE - relativeIndex,
                                        transform: relativeIndex <= 1 ? [] : [
                                            { scale: 1 - (relativeIndex - 1) * 0.03 },
                                            { translateY: (relativeIndex - 1) * 8 },
                                        ],
                                        opacity: relativeIndex <= 1 ? 1 : 1 - (relativeIndex - 1) * 0.15,
                                    },
                                ]}
                                pointerEvents={isTopCard ? 'auto' : 'none'}
                            >
                                {relativeIndex <= 1 ? (
                                    <SwipeCard
                                        user={profile}
                                        isTopCard={isTopCard}
                                        lettersOwned={lettersOwned}
                                        onLike={() => handleSwipe('like')}
                                        onDislike={() => handleSwipe('dislike')}
                                        onUndo={handleUndo}
                                        onSendMessage={handleSendMessage}
                                        onReport={handleReport}
                                    />
                                ) : (
                                    <View style={[
                                        styles.previewCard,
                                        {
                                            backgroundColor: colors.card,
                                            borderRadius: borderRadius.xl,
                                        }
                                    ]}>
                                        {profile.photos[0]?.url && (
                                            <Image
                                                source={{ uri: profile.photos[0].url }}
                                                style={styles.previewPhoto}
                                                resizeMode="cover"
                                            />
                                        )}
                                        <View style={[styles.previewUserInfo, { top: spacing['2xl'], left: spacing.base }]}>
                                            <Text style={[typography.h3, styles.previewUserName]}>
                                                {profile.name}
                                            </Text>
                                            <View style={[
                                                styles.previewCountryBadge,
                                                {
                                                    backgroundColor: `${primary.main}E6`,
                                                    borderRadius: borderRadius.sm,
                                                    marginTop: spacing.xs,
                                                }
                                            ]}>
                                                <Text style={styles.previewCountryFlag}>
                                                    {getCountryByCode(profile.country)?.flag || '🌍'}
                                                </Text>
                                                <Text style={[typography.labelSmall, styles.previewCountryText]}>
                                                    {getCountryByCode(profile.country)?.code || profile.country}, {profile.age}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Booster Button - positioned at bottom right */}
                <View style={styles.boosterButtonContainer}>
                    <BoosterButton onPress={() => setShowBoosterModal(true)} />
                </View>

                {/* Active Boost Banner */}
                <ActiveBoostBanner />

            </Animated.View>

            <SearchPreferencesModal
                visible={showSearchPreferences}
                onClose={() => setShowSearchPreferences(false)}
                onSave={loadProfiles}
            />

            <BoosterModal
                visible={showBoosterModal}
                onClose={() => setShowBoosterModal(false)}
                userPhoto={userMainPhoto}
                onBoostActivated={() => {
                    setShowBoosterModal(false);
                    fetchGemsAndBoostStatus();
                }}
            />
        </View>
    );
};


const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
    },
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 8,
        zIndex: 1,
    },
    headerSide: {
        minWidth: 72,
        alignItems: 'flex-start',
    },
    headerIcon: {},
    headerLogo: {
        width: 100,
        height: 32,
    },
    headerLogoContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gemsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    cardStackContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 80,
    },
    stackCard: {
        position: 'absolute',
    },
    previewCard: {
        width: SCREEN_WIDTH - CARD_MARGIN * 2,
        height: SCREEN_HEIGHT * 0.78,
        overflow: 'hidden',
    },
    previewPhoto: {
        width: '100%',
        height: '100%',
    },
    previewUserInfo: {
        position: 'absolute',
    },
    previewUserName: {
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    previewCountryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    previewCountryFlag: {
        fontSize: 14,
        marginRight: 6,
    },
    previewCountryText: {
        color: '#FFFFFF',
    },
    emptyCardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 80,
    },
    emptyCard: {
        width: SCREEN_WIDTH - 20,
        height: SCREEN_HEIGHT * 0.78,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    boosterButtonContainer: {
        position: 'absolute',
        right: 16,
        bottom: 100,
        zIndex: 10,
    },
});

export default SwipeScreen;
