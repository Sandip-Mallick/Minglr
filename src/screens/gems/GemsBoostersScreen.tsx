import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Share,
} from 'react-native';
import { useTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { useGemsStore } from '../../store';
import { gemsApi } from '../../api/gems';
import { boostersApi, BoosterPricingList } from '../../api/boosters';
import {
    GemIcon,
    BoosterIcon,
    LetterIcon,
    WatchVideoIcon,
    InviteFriendsIcon,
    ShareIcon,
    GiftIcon,
} from '../../components/Icons';

const GemsBoostersScreen: React.FC = () => {
    const { colors, primaryColor, secondaryColor } = useTheme();
    const { gemsBalance, boostersOwned, lettersOwned, activeBoost, referralCount, referralCode, addGems, addBoosters, setActiveBoost, syncFromUser } = useGemsStore();

    const [loading, setLoading] = useState(false);
    const [pricing, setPricing] = useState<BoosterPricingList | null>(null);
    const [selectedBoosters, setSelectedBoosters] = useState(1);
    const [referralStatus, setReferralStatus] = useState<{
        currentProgress: number;
        totalReferrals: number;
        gemsEarnedToday: number;
        dailyLimit: number;
        canClaim: boolean;
    } | null>(null);

    useEffect(() => {
        loadPricing();
        refreshBalance();
        loadReferralStatus();
    }, []);

    const loadPricing = async () => {
        try {
            const data = await boostersApi.getPricing();
            setPricing(data);
        } catch (error) {
            console.error('Failed to load pricing:', error);
        }
    };

    const refreshBalance = async () => {
        try {
            const balance = await gemsApi.getBalance();
            syncFromUser({
                gemsBalance: balance.gemsBalance,
                boostersOwned: balance.boostersOwned,
                activeBoost: balance.activeBoost,
                referralCode: balance.referralCode,
                referralCount: balance.referralCount,
            });
        } catch (error) {
            console.error('Failed to refresh balance:', error);
        }
    };

    const loadReferralStatus = async () => {
        try {
            const status = await gemsApi.getReferralStatus();
            setReferralStatus(status);
        } catch (error) {
            console.error('Failed to load referral status:', error);
            // Fallback to local calculation
            setReferralStatus({
                currentProgress: referralCount % 5,
                totalReferrals: referralCount,
                gemsEarnedToday: 0,
                dailyLimit: 2000,
                canClaim: referralCount >= 5 && (referralCount % 5) === 0,
            });
        }
    };

    const handleWatchAd = async () => {
        setLoading(true);
        try {
            const adSessionId = `ad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const result = await gemsApi.earnFromAd(adSessionId);
            if (result.gemsEarned === 0 && result.dailyLimitReached) {
                Alert.alert('Daily Limit Reached', 'You have reached the daily limit of 2000 gems from ads. Come back tomorrow!');
            } else {
                addGems(result.gemsEarned);
                Alert.alert('Gems Earned!', `You earned ${result.gemsEarned} gems!`);
            }
            refreshBalance();
        } catch (error: any) {
            if (error.response?.data?.message?.includes('limit')) {
                Alert.alert('Daily Limit Reached', 'You have reached the daily limit of 2000 gems. Come back tomorrow!');
            } else {
                Alert.alert('Error', 'Failed to earn gems. Try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleShareInvite = async () => {
        try {
            const inviteData = await gemsApi.getInviteLink();
            const message = `Join me on Minglr! Use my invite link to sign up and we both get rewarded! 🎉\n\n${inviteData.inviteUrl}`;

            await Share.share({
                message,
                title: 'Invite to Minglr',
            });
        } catch (error) {
            // Fallback if API fails, use local referral code
            const fallbackUrl = `https://minglr.app/invite/${referralCode}`;
            const message = `Join me on Minglr! Use my invite link to sign up and we both get rewarded! 🎉\n\n${fallbackUrl}`;

            try {
                await Share.share({
                    message,
                    title: 'Invite to Minglr',
                });
            } catch (shareError) {
                Alert.alert('Error', 'Could not share invite link');
            }
        }
    };

    const handleClaimReferralReward = async () => {
        if (!referralStatus?.canClaim) {
            Alert.alert('Not Yet', 'You need 5 successful referrals to claim 500 gems.');
            return;
        }

        if (referralStatus.gemsEarnedToday >= referralStatus.dailyLimit) {
            Alert.alert('Daily Limit Reached', 'You have reached the daily limit of 2000 gems from referrals. Come back tomorrow!');
            return;
        }

        setLoading(true);
        try {
            const result = await gemsApi.claimReferralRewards();
            if (result.success && result.gemsAwarded) {
                addGems(result.gemsAwarded);
                Alert.alert('Reward Claimed!', `You earned ${result.gemsAwarded} gems!`);
                loadReferralStatus();
                refreshBalance();
            } else {
                Alert.alert('No Rewards', result.message || 'No new rewards to claim.');
            }
        } catch (error: any) {
            if (error.response?.data?.message?.includes('limit')) {
                Alert.alert('Daily Limit Reached', 'You have reached the daily limit of 2000 gems. Come back tomorrow!');
            } else {
                Alert.alert('Error', 'Failed to claim rewards.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePurchaseBoosters = async () => {
        const cost = getBoosterCost(selectedBoosters);
        if (gemsBalance < cost) {
            Alert.alert('Not Enough Gems', 'Watch ads or invite friends to earn more gems!');
            return;
        }

        setLoading(true);
        try {
            const result = await boostersApi.purchase(selectedBoosters);
            addBoosters(result.boostersPurchased);
            Alert.alert('Boosters Purchased!', `You now have ${result.newBoostersOwned} boosters!`);
            refreshBalance();
        } catch (error) {
            Alert.alert('Error', 'Failed to purchase boosters.');
        } finally {
            setLoading(false);
        }
    };

    const handleActivateBoost = async (duration: 15 | 30 | 45) => {
        const boostersNeeded = duration === 15 ? 1 : duration === 30 ? 2 : 3;
        if (boostersOwned < boostersNeeded) {
            Alert.alert('Not Enough Boosters', `You need ${boostersNeeded} booster(s) for ${duration} minutes.`);
            return;
        }

        if (activeBoost && new Date(activeBoost.expiresAt) > new Date()) {
            Alert.alert('Boost Active', 'Wait for your current boost to expire first.');
            return;
        }

        setLoading(true);
        try {
            const result = await boostersApi.activate(duration);
            setActiveBoost({
                startedAt: new Date().toISOString(),
                durationMinutes: duration,
                expiresAt: result.boostExpiresAt,
            });
            Alert.alert('Boost Activated!', `Your profile is now boosted for ${duration} minutes!`);
            refreshBalance();
        } catch (error) {
            Alert.alert('Error', 'Failed to activate boost.');
        } finally {
            setLoading(false);
        }
    };

    const getBoosterCost = (count: number): number => {
        if (count === 1) return 690;
        if (count === 2) return 1104;
        return count * 469;
    };

    const formatBoostTime = () => {
        if (!activeBoost) return null;
        const expiresAt = new Date(activeBoost.expiresAt);
        const now = new Date();
        const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60));
        return remaining > 0 ? `${remaining} minutes` : null;
    };

    const boostRemaining = formatBoostTime();

    // Calculate referral progress (0-5 for current cycle)
    const currentProgress = referralStatus?.currentProgress ?? (referralCount % 5);
    const progressPercentage = (currentProgress / 5) * 100;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Current Balance */}
            <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Balance</Text>
                <View style={styles.balanceRow}>
                    <View style={styles.balanceItem}>
                        <GemIcon size={40} animated />
                        <Text style={[styles.balanceValue, { color: colors.text }]}>{gemsBalance.toLocaleString()}</Text>
                        <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Gems</Text>
                    </View>
                    <View style={styles.balanceItem}>
                        <BoosterIcon size={40} animated />
                        <Text style={[styles.balanceValue, { color: colors.text }]}>{boostersOwned}</Text>
                        <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Boosters</Text>
                    </View>
                    <View style={styles.balanceItem}>
                        <LetterIcon size={40} animated />
                        <Text style={[styles.balanceValue, { color: colors.text }]}>{lettersOwned}</Text>
                        <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Letters</Text>
                    </View>
                </View>

                {boostRemaining && (
                    <View style={[styles.boostActive, { backgroundColor: primaryColor }]}>
                        <View style={styles.boostActiveContent}>
                            <BoosterIcon size={18} />
                            <Text style={styles.boostActiveText}> Boost Active: {boostRemaining} remaining</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Free Gems Section */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Free Gems</Text>

                {/* Watch Ad */}
                <TouchableOpacity
                    style={[styles.earnOption, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    onPress={handleWatchAd}
                    disabled={loading}
                >
                    <View style={styles.earnIconContainer}>
                        <WatchVideoIcon size={32} color="#EC4899" />
                    </View>
                    <View style={styles.earnInfo}>
                        <Text style={[styles.earnTitle, { color: colors.text }]}>Watch a video</Text>
                        <Text style={[styles.earnDesc, { color: colors.textSecondary }]}>Earn 20 gems per video</Text>
                    </View>
                    <View style={styles.earnRewardContainer}>
                        <GemIcon size={16} />
                        <Text style={[styles.earnRewardText, { color: primaryColor }]}>+20</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.watchButton, { backgroundColor: '#F472B6' }]}
                        onPress={handleWatchAd}
                        disabled={loading}
                    >
                        <Text style={styles.watchButtonText}>Watch</Text>
                    </TouchableOpacity>
                </TouchableOpacity>

                {/* Invite Friends */}
                <View style={[styles.inviteCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    <View style={styles.inviteHeader}>
                        <View style={styles.earnIconContainer}>
                            <InviteFriendsIcon size={32} color="#10B981" />
                        </View>
                        <View style={styles.earnInfo}>
                            <Text style={[styles.earnTitle, { color: colors.text }]}>Invite your friends</Text>
                            <Text style={[styles.earnDesc, { color: colors.textSecondary }]}>500 gems per 5 successful invites</Text>
                        </View>
                        <View style={styles.earnRewardContainer}>
                            <GemIcon size={16} />
                            <Text style={[styles.earnRewardText, { color: primaryColor }]}>+500</Text>
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${progressPercentage}%`,
                                        backgroundColor: '#10B981',
                                    }
                                ]}
                            />
                        </View>
                        <Text style={[styles.progressText, { color: colors.text }]}>
                            {currentProgress}/5
                        </Text>
                    </View>

                    {/* Progress Dots */}
                    <View style={styles.progressDots}>
                        {[0, 1, 2, 3, 4].map((index) => (
                            <View
                                key={index}
                                style={[
                                    styles.progressDot,
                                    {
                                        backgroundColor: index < currentProgress ? '#10B981' : colors.border,
                                        borderColor: index < currentProgress ? '#10B981' : colors.border,
                                    },
                                ]}
                            >
                                {index < currentProgress && (
                                    <Text style={styles.checkmark}>✓</Text>
                                )}
                            </View>
                        ))}
                        <View style={[styles.rewardIcon, { backgroundColor: currentProgress >= 5 ? '#10B981' : colors.border }]}>
                            <GiftIcon size={20} color={currentProgress >= 5 ? '#FFFFFF' : colors.textMuted} />
                        </View>
                    </View>

                    {/* Daily Limit Info */}
                    {referralStatus && (
                        <View style={styles.dailyLimitInfo}>
                            <Text style={[styles.dailyLimitText, { color: colors.textSecondary }]}>
                                Today: {referralStatus.gemsEarnedToday.toLocaleString()} / {referralStatus.dailyLimit.toLocaleString()} gems
                            </Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.inviteActions}>
                        <TouchableOpacity
                            style={[styles.shareButton, { backgroundColor: '#10B981' }]}
                            onPress={handleShareInvite}
                        >
                            <ShareIcon size={18} color="#FFFFFF" />
                            <Text style={styles.shareButtonText}>Share Invite Link</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.claimButton,
                                {
                                    backgroundColor: referralStatus?.canClaim ? primaryColor : colors.border,
                                    opacity: referralStatus?.canClaim ? 1 : 0.6,
                                }
                            ]}
                            onPress={handleClaimReferralReward}
                            disabled={!referralStatus?.canClaim || loading}
                        >
                            <Text style={[styles.claimButtonText, { color: referralStatus?.canClaim ? '#FFFFFF' : colors.textMuted }]}>
                                Claim
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Daily Rewards Section */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Rewards</Text>
                <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                    Collect your free daily prize
                </Text>

                <View style={styles.dailyRewardsRow}>
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <View key={day} style={[styles.dailyRewardItem, { borderColor: day === 1 ? '#10B981' : colors.border }]}>
                            <Text style={[styles.dailyRewardDay, { color: colors.text }]}>Day {day}</Text>
                            <View style={styles.dailyRewardGems}>
                                <GemIcon size={24} />
                            </View>
                            <Text style={[styles.dailyRewardValue, { color: colors.text }]}>{200 + (day - 1) * 50}</Text>
                            {day === 1 && <View style={styles.checkBadge}><Text style={styles.checkBadgeText}>✓</Text></View>}
                        </View>
                    ))}
                </View>
            </View>

            {/* Purchase Boosters */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Buy Boosters</Text>

                <View style={styles.boosterOptions}>
                    {[1, 2, 3, 5, 10].map((count) => (
                        <TouchableOpacity
                            key={count}
                            style={[
                                styles.boosterOption,
                                { borderColor: selectedBoosters === count ? primaryColor : colors.border },
                                selectedBoosters === count && { backgroundColor: `${primaryColor}20` },
                            ]}
                            onPress={() => setSelectedBoosters(count)}
                        >
                            <View style={styles.boosterCountRow}>
                                <Text style={[styles.boosterCount, { color: colors.text }]}>{count}x</Text>
                                <BoosterIcon size={20} />
                            </View>
                            <View style={styles.boosterCostRow}>
                                <Text style={[styles.boosterCostText, { color: primaryColor }]}>{getBoosterCost(count)}</Text>
                                <GemIcon size={14} />
                            </View>
                            {count >= 3 && (
                                <Text style={[styles.discount, { color: secondaryColor }]}>~32% off</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <Button
                    title={`Purchase ${selectedBoosters} Booster${selectedBoosters > 1 ? 's' : ''}`}
                    onPress={handlePurchaseBoosters}
                    disabled={loading || gemsBalance < getBoosterCost(selectedBoosters)}
                    style={styles.purchaseButton}
                />
            </View>

            {/* Activate Boost */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Activate Boost</Text>
                <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                    Get more visibility and matches!
                </Text>

                <View style={styles.activateOptions}>
                    {([15, 30, 45] as const).map((duration) => {
                        const boostersNeeded = duration === 15 ? 1 : duration === 30 ? 2 : 3;
                        return (
                            <TouchableOpacity
                                key={duration}
                                style={[
                                    styles.activateOption,
                                    { backgroundColor: primaryColor },
                                    boostersOwned < boostersNeeded && { opacity: 0.5 },
                                ]}
                                onPress={() => handleActivateBoost(duration)}
                                disabled={loading || boostersOwned < boostersNeeded}
                            >
                                <Text style={styles.activateTime}>{duration} min</Text>
                                <View style={styles.activateCostRow}>
                                    <Text style={styles.activateCostText}>{boostersNeeded}x</Text>
                                    <BoosterIcon size={16} />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={primaryColor} />
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    balanceCard: {
        margin: 16,
        padding: 20,
        borderRadius: 16,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
    },
    balanceItem: {
        alignItems: 'center',
    },
    balanceValue: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 8,
    },
    balanceLabel: {
        fontSize: 14,
        marginTop: 4,
    },
    boostActive: {
        marginTop: 16,
        padding: 12,
        borderRadius: 20,
        alignItems: 'center',
    },
    boostActiveContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    boostActiveText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    section: {
        margin: 16,
        marginTop: 0,
        padding: 20,
        borderRadius: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionDesc: {
        fontSize: 14,
        marginBottom: 16,
    },
    earnOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 12,
    },
    earnIconContainer: {
        marginRight: 12,
    },
    earnInfo: {
        flex: 1,
    },
    earnTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    earnDesc: {
        fontSize: 13,
        marginTop: 2,
    },
    earnRewardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    earnRewardText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    watchButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    watchButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    inviteCard: {
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 12,
    },
    inviteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    progressBar: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 40,
    },
    progressDots: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingHorizontal: 4,
    },
    progressDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    rewardIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dailyLimitInfo: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    dailyLimitText: {
        fontSize: 13,
        textAlign: 'center',
    },
    inviteActions: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
    },
    shareButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    shareButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    claimButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    claimButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },
    dailyRewardsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    dailyRewardItem: {
        width: '13%',
        minWidth: 60,
        padding: 8,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        position: 'relative',
    },
    dailyRewardDay: {
        fontSize: 11,
        fontWeight: '500',
        marginBottom: 4,
    },
    dailyRewardGems: {
        marginVertical: 4,
    },
    dailyRewardValue: {
        fontSize: 12,
        fontWeight: '600',
    },
    checkBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    boosterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 12,
    },
    boosterOption: {
        width: '30%',
        padding: 12,
        borderWidth: 2,
        borderRadius: 12,
        alignItems: 'center',
    },
    boosterCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    boosterCount: {
        fontSize: 16,
        fontWeight: '600',
    },
    boosterCostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    boosterCostText: {
        fontSize: 14,
    },
    discount: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
    },
    purchaseButton: {
        marginTop: 20,
    },
    activateOptions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    activateOption: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    activateTime: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    activateCostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    activateCostText: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default GemsBoostersScreen;
