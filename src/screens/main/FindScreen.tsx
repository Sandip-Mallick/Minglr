import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useGemsStore } from '../../store';
import { GemIcon } from '../../components/Icons';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { getCountryByCode } from '../../utils/countries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Component ──────────────────────────────────────────────────────────────

const FindScreen: React.FC = () => {
    const { colors, primary, spacing, borderRadius, typography } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { gemsBalance } = useGemsStore();

    const {
        status,
        partnerProfile,
        partnerAccepted,
        chatId,
        countdown,
        cooldownRemaining,
        joinQueue,
        leaveQueue,
        acceptMatch,
        declineMatch,
    } = useMatchmaking();

    // ─── Animations ──────────────────────────────────────────────────────

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const radarAnim = useRef(new Animated.Value(0)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;
    const scaleIn = useRef(new Animated.Value(0.85)).current;
    const acceptBarWidth = useRef(new Animated.Value(1)).current;

    // Searching radar animation
    useEffect(() => {
        if (status === 'searching') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            Animated.loop(
                Animated.timing(radarAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
            radarAnim.stopAnimation();
            radarAnim.setValue(0);
        }
    }, [status]);

    // Match found entrance animation
    useEffect(() => {
        if (status === 'found') {
            fadeIn.setValue(0);
            scaleIn.setValue(0.85);
            acceptBarWidth.setValue(1);

            Animated.parallel([
                Animated.timing(fadeIn, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleIn, {
                    toValue: 1,
                    friction: 8,
                    tension: 50,
                    useNativeDriver: true,
                }),
            ]).start();

            // 10s countdown bar
            Animated.timing(acceptBarWidth, {
                toValue: 0,
                duration: 10000,
                easing: Easing.linear,
                useNativeDriver: false,
            }).start();
        }
    }, [status]);

    // Navigate to chat on success
    useEffect(() => {
        if (status === 'success' && chatId && partnerProfile) {
            const timer = setTimeout(() => {
                (navigation as any).navigate('Chat', {
                    chatId,
                    participantId: partnerProfile._id,
                    participantName: partnerProfile.name,
                    participantPhoto: partnerProfile.photo,
                });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [status, chatId, partnerProfile, navigation]);

    // ─── Derived values ──────────────────────────────────────────────────

    const radarSpin = radarAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const countryInfo = partnerProfile?.country
        ? getCountryByCode(partnerProfile.country)
        : null;

    // ─── Header ──────────────────────────────────────────────────────────

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
            <View style={styles.headerSide}>
                {(status === 'searching' || status === 'found' || status === 'accepted') && (
                    <TouchableOpacity
                        style={[styles.headerIcon, { padding: spacing.xs }]}
                        onPress={leaveQueue}
                    >
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.headerCenter}>
                <Text style={[typography.h2, { color: colors.text }]}>Find</Text>
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
                        },
                    ]}
                    onPress={() => navigation.navigate('GemsAndBoosters' as never)}
                >
                    <GemIcon size={16} />
                    <Text style={[typography.labelSmall, { color: colors.text, marginLeft: spacing.xs }]}>
                        {gemsBalance}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ─── Idle State ──────────────────────────────────────────────────────

    const renderIdle = () => (
        <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${primary.main}12`, borderRadius: borderRadius.full }]}>
                <Ionicons name="people-outline" size={48} color={primary.main} />
            </View>

            <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginTop: spacing.xl }]}>
                Find a Friend
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl, lineHeight: 20 }]}>
                Connect instantly with someone who is online right now
            </Text>

            <TouchableOpacity
                style={[styles.findButton, { backgroundColor: primary.main, borderRadius: borderRadius.button }]}
                onPress={joinQueue}
                activeOpacity={0.8}
            >
                <Ionicons name="search" size={22} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
                <Text style={[typography.button, { color: '#FFFFFF' }]}>Find Now</Text>
            </TouchableOpacity>
        </View>
    );

    // ─── Searching State ─────────────────────────────────────────────────

    const renderSearching = () => (
        <View style={styles.content}>
            <Animated.View style={[
                styles.radarContainer,
                { transform: [{ scale: pulseAnim }] },
            ]}>
                <View style={[styles.radarOuter, { borderColor: `${primary.main}20` }]}>
                    <View style={[styles.radarMiddle, { borderColor: `${primary.main}30` }]}>
                        <Animated.View style={[
                            styles.radarInner,
                            { backgroundColor: `${primary.main}15`, transform: [{ rotate: radarSpin }] },
                        ]}>
                            <Ionicons name="search" size={36} color={primary.main} />
                        </Animated.View>
                    </View>
                </View>
            </Animated.View>

            <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginTop: spacing['2xl'] }]}>
                Searching...
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
                Looking for online users
            </Text>

            {/* Countdown */}
            <View style={[styles.countdownBadge, { backgroundColor: `${primary.main}15`, borderRadius: borderRadius.button }]}>
                <Ionicons name="time-outline" size={18} color={primary.main} />
                <Text style={[typography.label, { color: primary.main, marginLeft: spacing.xs }]}>
                    {countdown}s
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border, borderRadius: borderRadius.button }]}
                onPress={leaveQueue}
                activeOpacity={0.7}
            >
                <Text style={[typography.body, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );

    // ─── Match Found / Accepted State ────────────────────────────────────

    const renderMatchFound = () => {
        if (!partnerProfile) return null;

        return (
            <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ scale: scaleIn }] }]}>
                {/* Profile card */}
                <View style={[styles.profileCard, { backgroundColor: colors.surface, borderRadius: borderRadius.xl, borderColor: `${primary.main}30` }]}>
                    {/* Photo */}
                    <View style={[styles.profilePhotoContainer, { borderRadius: borderRadius.xl }]}>
                        {partnerProfile.photo ? (
                            <Image
                                source={{ uri: partnerProfile.photo }}
                                style={styles.profilePhoto}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.profilePhoto, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="person" size={64} color="rgba(255,255,255,0.4)" />
                            </View>
                        )}
                    </View>

                    {/* Info */}
                    <View style={styles.profileInfo}>
                        <Text style={[typography.h2, { color: colors.text }]}>
                            {partnerProfile.name}, {partnerProfile.age}
                        </Text>

                        <View style={styles.profileMeta}>
                            {countryInfo && (
                                <View style={[styles.metaBadge, { backgroundColor: `${primary.main}15`, borderRadius: borderRadius.sm }]}>
                                    <Text style={{ fontSize: 16, marginRight: 4 }}>{countryInfo.flag}</Text>
                                    <Text style={[typography.labelSmall, { color: primary.main }]}>
                                        {countryInfo.name}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.metaBadge, { backgroundColor: `${primary.main}15`, borderRadius: borderRadius.sm }]}>
                                <Ionicons name="male-female" size={14} color={primary.main} />
                                <Text style={[typography.labelSmall, { color: primary.main, marginLeft: 4 }]}>
                                    {partnerProfile.gender.charAt(0).toUpperCase() + partnerProfile.gender.slice(1)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Accept countdown bar */}
                    <Animated.View style={[
                        styles.acceptBar,
                        {
                            backgroundColor: primary.main,
                            width: acceptBarWidth.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]} />
                </View>

                {/* Partner accepted indicator */}
                {partnerAccepted && status === 'accepted' && (
                    <View style={[styles.partnerAcceptedBadge, { backgroundColor: '#22C55E20', borderRadius: borderRadius.button }]}>
                        <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                        <Text style={[typography.labelSmall, { color: '#22C55E', marginLeft: spacing.xs }]}>
                            Partner accepted! Waiting for match...
                        </Text>
                    </View>
                )}

                {/* Action buttons */}
                {status === 'found' && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.declineButton, { backgroundColor: '#EF444420', borderRadius: borderRadius.full }]}
                            onPress={declineMatch}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close" size={32} color="#EF4444" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.acceptButton, { backgroundColor: primary.main, borderRadius: borderRadius.full }]}
                            onPress={acceptMatch}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="checkmark" size={36} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                )}

                {status === 'accepted' && !partnerAccepted && (
                    <View style={[styles.waitingContainer, { marginTop: spacing.xl }]}>
                        <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
                            Waiting for partner to accept...
                        </Text>
                    </View>
                )}
            </Animated.View>
        );
    };

    // ─── Success State ───────────────────────────────────────────────────

    const renderSuccess = () => (
        <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#22C55E15', borderRadius: borderRadius.full }]}>
                <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
            </View>
            <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginTop: spacing.xl }]}>
                Match!
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
                Opening chat...
            </Text>
        </View>
    );

    // ─── Timeout State ───────────────────────────────────────────────────

    const renderTimeout = () => (
        <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: `${primary.main}12`, borderRadius: borderRadius.full }]}>
                <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
            </View>

            <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginTop: spacing.xl }]}>
                No Match Found
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.xl, lineHeight: 20 }]}>
                No one is online right now. Try again later!
            </Text>

            <TouchableOpacity
                style={[styles.findButton, { backgroundColor: primary.main, borderRadius: borderRadius.button }]}
                onPress={joinQueue}
                activeOpacity={0.8}
            >
                <Ionicons name="refresh" size={20} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
                <Text style={[typography.button, { color: '#FFFFFF' }]}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );

    // ─── Cooldown State ──────────────────────────────────────────────────

    const renderCooldown = () => (
        <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#F59E0B15', borderRadius: borderRadius.full }]}>
                <Ionicons name="hourglass-outline" size={48} color="#F59E0B" />
            </View>

            <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginTop: spacing.xl }]}>
                Cooldown
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
                You can search again in
            </Text>

            <View style={[styles.countdownBadge, { backgroundColor: '#F59E0B15', borderRadius: borderRadius.button }]}>
                <Ionicons name="time-outline" size={18} color="#F59E0B" />
                <Text style={[typography.label, { color: '#F59E0B', marginLeft: spacing.xs }]}>
                    {cooldownRemaining}s
                </Text>
            </View>
        </View>
    );

    // ─── Render ──────────────────────────────────────────────────────────

    const renderContent = () => {
        switch (status) {
            case 'idle':
                return renderIdle();
            case 'searching':
                return renderSearching();
            case 'found':
            case 'accepted':
                return renderMatchFound();
            case 'success':
                return renderSuccess();
            case 'timeout':
                return renderTimeout();
            case 'cooldown':
                return renderCooldown();
            default:
                return renderIdle();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {renderHeader()}
            {renderContent()}
        </View>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    headerSide: {
        minWidth: 72,
        alignItems: 'flex-start',
    },
    headerIcon: {
        padding: 4,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gemsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    findButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        marginTop: 32,
        minWidth: 200,
    },

    // Searching
    radarContainer: {
        width: 160,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radarOuter: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radarMiddle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radarInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginTop: 24,
    },
    cancelButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginTop: 16,
        borderWidth: 1,
    },

    // Match Found
    profileCard: {
        width: SCREEN_WIDTH - 48,
        overflow: 'hidden',
        borderWidth: 1,
    },
    profilePhotoContainer: {
        width: '100%',
        height: 280,
        overflow: 'hidden',
    },
    profilePhoto: {
        width: '100%',
        height: '100%',
    },
    profileInfo: {
        padding: 20,
    },
    profileMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 8,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    acceptBar: {
        height: 3,
    },
    partnerAcceptedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginTop: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        marginTop: 24,
    },
    declineButton: {
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptButton: {
        width: 72,
        height: 72,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    waitingContainer: {
        alignItems: 'center',
    },
});

export default FindScreen;
