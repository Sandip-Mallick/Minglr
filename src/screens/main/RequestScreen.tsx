import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button } from '../../components/common/Button';
import { friendsApi, FriendRequest, Friend } from '../../api/friends';
import { chatsApi } from '../../api/chats';
import { countries } from '../../utils/countries';
import { useGemsStore } from '../../store';
import { GemIcon } from '../../components/Icons';

const RequestScreen: React.FC = () => {
    const { colors, primary, primaryColor, spacing, borderRadius, typography } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { gemsBalance } = useGemsStore();

    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [recentFriends, setRecentFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [requestsData, friendsData] = await Promise.all([
                friendsApi.getRequests(),
                friendsApi.getRecentFriends(),
            ]);
            setRequests(requestsData.data);
            setRecentFriends(friendsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCountryInfo = (countryCode: string) => {
        const country = countries.find(c => c.code === countryCode || c.name === countryCode);
        return { flag: country?.flag || '🌍', code: country?.code || countryCode };
    };

    const handleAccept = async (requestId: string) => {
        try {
            await friendsApi.acceptRequest(requestId);
            setRequests(requests.filter((r) => r._id !== requestId));
            loadData();
        } catch (error) {
            console.error('Failed to accept:', error);
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await friendsApi.rejectRequest(requestId);
            setRequests(requests.filter((r) => r._id !== requestId));
        } catch (error) {
            console.error('Failed to reject:', error);
        }
    };

    const handleFriendPress = async (friend: Friend) => {
        try {
            const { chatId } = await chatsApi.getOrCreateChat(friend._id);
            (navigation as any).navigate('Chat', {
                chatId,
                participantName: friend.name,
                participantPhoto: friend.photos?.[0]?.url,
            });
        } catch (error) {
            console.error('Failed to open chat:', error);
            Alert.alert('Error', 'Failed to open chat');
        }
    };

    const handleOpenAllFriends = () => {
        (navigation as any).navigate('AllFriends');
    };

    const handleNavigateToFind = () => {
        (navigation as any).navigate('Main', { screen: 'Find' });
    };

    const handleNavigateToSwipe = () => {
        (navigation as any).navigate('Main', { screen: 'Swipe' });
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={primaryColor} />
            </View>
        );
    }

    const renderFriendItem = ({ item }: { item: Friend }) => (
        <TouchableOpacity style={styles.friendItem} onPress={() => handleFriendPress(item)}>
            {item.photos?.[0]?.url ? (
                <Image source={{ uri: item.photos[0].url }} style={styles.friendPhoto} />
            ) : (
                <View style={[styles.friendPhoto, { backgroundColor: colors.surface }]}>
                    <Ionicons name="person" size={24} color={colors.textMuted} />
                </View>
            )}
            <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
            </Text>
            {item.onlineStatus?.isOnline && (
                <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
            )}
        </TouchableOpacity>
    );

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return `${Math.floor(diffDays / 7)}w`;
    };

    const handleRequestPress = async (request: FriendRequest) => {
        // If the request has a message, navigate to chat to view/reply
        if (request.message) {
            try {
                const { chatId } = await chatsApi.getOrCreateChat(request.from._id);
                (navigation as any).navigate('Chat', {
                    chatId,
                    participantName: request.from.name,
                    participantPhoto: request.from.photos?.[0]?.url,
                    pendingRequestId: request._id,
                    initialMessage: request.message,
                });
            } catch (error) {
                console.error('Failed to open chat:', error);
            }
        }
    };

    const renderRequestItem = ({ item }: { item: FriendRequest }) => {
        const countryInfo = getCountryInfo(item.from.country);
        const timeAgo = getTimeAgo(item.createdAt);

        return (
            <TouchableOpacity
                style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleRequestPress(item)}
                activeOpacity={item.message ? 0.7 : 1}
            >
                {/* Photo */}
                {item.from.photos?.[0]?.url ? (
                    <Image source={{ uri: item.from.photos[0].url }} style={styles.requestPhoto} />
                ) : (
                    <View style={[styles.requestPhoto, { backgroundColor: colors.surface }]}>
                        <Ionicons name="person" size={20} color={colors.textMuted} />
                    </View>
                )}

                {/* User Info */}
                <View style={styles.requestDetails}>
                    <View style={styles.requestNameRow}>
                        <Text style={[styles.requestName, { color: colors.text }]}>{item.from.name}</Text>
                        <View style={[styles.ageBadge, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.ageBadgeText, { color: colors.textSecondary }]}>
                                {item.from.age}, {countryInfo.flag} {countryInfo.code}
                            </Text>
                        </View>
                        <Text style={[styles.timeAgo, { color: colors.textMuted }]}>· {timeAgo}</Text>
                    </View>
                    {item.message && (
                        <Text style={[styles.requestMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.message}
                        </Text>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.requestActions}>
                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAccept(item._id)}
                    >
                        <Ionicons name="checkmark" size={24} color={primaryColor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleReject(item._id)}
                    >
                        <Ionicons name="close" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    // Empty state - centered in screen with styled icon
    const renderEmptyState = () => (
        <View style={styles.emptyStateWrapper}>
            <View style={styles.emptyState}>
                {/* Styled Icon Container - like ChatsScreen */}
                <View style={[
                    styles.emptyIconContainer,
                    {
                        backgroundColor: `${primary.main}15`,
                        borderRadius: borderRadius.full,
                    }
                ]}>
                    <Ionicons name="mail-outline" size={48} color={primary.main} />
                </View>

                <Text style={[typography.h3, { color: colors.text, textAlign: 'center', marginTop: spacing.xl }]}>
                    No Requests Yet
                </Text>

                <Text style={[
                    typography.bodySmall,
                    {
                        color: colors.textSecondary,
                        textAlign: 'center',
                        marginTop: spacing.sm,
                        paddingHorizontal: spacing.xl,
                    }
                ]}>
                    When someone wants to be your friend, you'll see them here
                </Text>

                <View style={[styles.emptyActions, { marginTop: spacing.xl }]}>
                    <Button
                        title="Find Friends"
                        onPress={handleNavigateToFind}
                        style={styles.emptyButton}
                    />
                    <Button
                        title="Swipe"
                        onPress={handleNavigateToSwipe}
                        variant="outline"
                        style={styles.emptyButton}
                    />
                </View>
            </View>
        </View>
    );

    // Check if we should show the centered empty state (no requests AND no friends)
    const showCenteredEmptyState = requests.length === 0 && recentFriends.length === 0;

    if (showCenteredEmptyState) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                    <View style={styles.headerSide}>
                        <TouchableOpacity style={[styles.headerIconButton, { padding: spacing.xs }]} onPress={handleOpenAllFriends}>
                            <Ionicons name="people-outline" size={22} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerCenter}>
                        <Text style={[typography.h2, { color: colors.text }]}>Friends</Text>
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
                            <Text style={[typography.labelSmall, { color: colors.text, marginLeft: spacing.xs }]}>
                                {gemsBalance}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Centered Empty State */}
                {renderEmptyState()}
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
                <View style={styles.headerSide}>
                    <TouchableOpacity style={[styles.headerIconButton, { padding: spacing.xs }]} onPress={handleOpenAllFriends}>
                        <Ionicons name="people-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.headerCenter}>
                    <Text style={[typography.h2, { color: colors.text }]}>Friends</Text>
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
                        <Text style={[typography.labelSmall, { color: colors.text, marginLeft: spacing.xs }]}>
                            {gemsBalance}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Recent Friends */}
                {recentFriends.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: '#1A1A1A' }]}>Recent friends</Text>
                        <FlatList
                            horizontal
                            data={recentFriends}
                            renderItem={renderFriendItem}
                            keyExtractor={(item) => item._id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.friendsList}
                        />
                    </View>
                )}

                {/* Friend Requests */}
                {requests.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: '#1A1A1A' }]}>Friend requests</Text>
                        {requests.map((request) => (
                            <View key={request._id}>{renderRequestItem({ item: request })}</View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
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
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIconButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    gemsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    gemsText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    friendsList: {
        paddingRight: 16,
    },
    friendItem: {
        alignItems: 'center',
        marginRight: 16,
        width: 68,
    },
    friendPhoto: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    friendName: {
        fontSize: 12,
        marginTop: 6,
        textAlign: 'center',
    },
    onlineIndicator: {
        position: 'absolute',
        top: 0,
        right: 8,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
    },
    requestInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    requestPhoto: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requestDetails: {
        marginLeft: 12,
        flex: 1,
    },
    requestNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    requestName: {
        fontSize: 16,
        fontWeight: '600',
    },
    ageBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    ageBadgeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    timeAgo: {
        fontSize: 12,
    },
    requestMeta: {
        fontSize: 13,
        marginTop: 2,
    },
    requestMessage: {
        fontSize: 13,
        marginTop: 4,
    },
    requestActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    acceptButton: {
        padding: 8,
    },
    rejectButton: {
        padding: 8,
    },
    actionButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Full screen empty state (centered)
    emptyStateWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        padding: 24,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyActions: {
        flexDirection: 'row',
        gap: 12,
    },
    emptyButton: {
        minWidth: 110,
    },
    // Inline empty state (within scroll)
    inlineEmptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    smallIconContainer: {
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default RequestScreen;
