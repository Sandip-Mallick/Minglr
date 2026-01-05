import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    Animated,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { friendsApi, Friend } from '../../api/friends';
import { chatsApi } from '../../api/chats';
import { countries } from '../../utils/countries';

// Skeleton loading component for smooth loading state
const SkeletonItem: React.FC<{ colors: any; index: number }> = ({ colors, index }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const shimmer = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        shimmer.start();
        return () => shimmer.stop();
    }, []);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.friendItem,
                { borderBottomColor: colors.border, opacity }
            ]}
        >
            <View style={[styles.friendPhoto, { backgroundColor: colors.surface }]} />
            <View style={styles.friendInfo}>
                <View style={[styles.skeletonText, { backgroundColor: colors.surface, width: 120 }]} />
                <View style={[styles.skeletonText, { backgroundColor: colors.surface, width: 80, marginTop: 6 }]} />
            </View>
            <View style={[styles.skeletonButton, { backgroundColor: colors.surface }]} />
        </Animated.View>
    );
};

// Animated friend item wrapper for staggered entrance
const AnimatedFriendItem: React.FC<{
    children: React.ReactNode;
    index: number;
    isVisible: boolean;
}> = ({ children, index, isVisible }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (isVisible) {
            // Staggered animation delay based on index
            const delay = Math.min(index * 50, 300); // Cap delay at 300ms

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    delay,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    delay,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isVisible, index]);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            {children}
        </Animated.View>
    );
};

const AllFriendsScreen: React.FC = () => {
    const { colors, primary, primaryColor, spacing, borderRadius, typography, isDark } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [friends, setFriends] = useState<Friend[]>([]);
    const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isDataReady, setIsDataReady] = useState(false);
    const isInitialMount = useRef(true);

    // Fade animation for transitioning from skeleton to content
    const contentFadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadFriends();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = friends.filter(f =>
                f.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredFriends(filtered);
        } else {
            setFilteredFriends(friends);
        }
    }, [searchQuery, friends]);

    const loadFriends = useCallback(async (search?: string) => {
        try {
            if (!search) {
                setLoading(true);
                setIsDataReady(false);
            }
            const response = await friendsApi.getAllFriends(search, 1, 100);
            setFriends(response.data);
            setFilteredFriends(response.data);

            // Smooth transition to content
            if (!search) {
                setLoading(false);
                // Small delay to ensure state updates, then animate
                setTimeout(() => {
                    setIsDataReady(true);
                    Animated.timing(contentFadeAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }).start();
                }, 50);
            }
        } catch (error) {
            console.error('Failed to load friends:', error);
            setLoading(false);
        }
    }, []);

    // Debounced search - skip initial mount to prevent double loading
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                loadFriends(searchQuery.trim());
            } else {
                loadFriends();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, loadFriends]);

    const getCountryInfo = (countryCode: string) => {
        const country = countries.find(c => c.code === countryCode || c.name === countryCode);
        return { flag: country?.flag || '🌍', code: country?.code || countryCode };
    };

    const handleChat = async (friend: Friend) => {
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

    const handleRemoveFriend = (friendId: string) => {
        // TODO: Implement remove friend
        console.log('Remove friend:', friendId);
    };

    const handleDiscover = () => {
        (navigation as any).navigate('Main', { screen: 'Swipe' });
    };

    const renderFriend = ({ item, index }: { item: Friend; index: number }) => {
        const countryInfo = getCountryInfo(item.country);

        return (
            <AnimatedFriendItem index={index} isVisible={isDataReady}>
                <View style={[styles.friendItem, { borderBottomColor: colors.border }]}>
                    {/* Photo */}
                    {item.photos?.[0]?.url ? (
                        <Image source={{ uri: item.photos[0].url }} style={styles.friendPhoto} />
                    ) : (
                        <View style={[styles.friendPhoto, { backgroundColor: colors.surface }]}>
                            <Ionicons name="person" size={24} color={colors.textMuted} />
                        </View>
                    )}

                    {/* Info */}
                    <View style={styles.friendInfo}>
                        <Text style={[styles.friendName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.friendMeta, { color: colors.textSecondary }]}>
                            {item.age}, {countryInfo.flag} {countryInfo.code}
                        </Text>
                    </View>

                    {/* Chat button */}
                    <TouchableOpacity
                        style={[styles.chatButton, { backgroundColor: primaryColor }]}
                        onPress={() => handleChat(item)}
                    >
                        <Ionicons name="chatbubble" size={14} color="#FFFFFF" />
                        <Text style={styles.chatButtonText}>Chat</Text>
                    </TouchableOpacity>

                    {/* Remove button */}
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveFriend(item._id)}
                    >
                        <Ionicons name="close" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </AnimatedFriendItem>
        );
    };

    // Render skeleton loading state
    const renderSkeletonLoading = () => (
        <View style={styles.skeletonContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
                <SkeletonItem key={index} colors={colors} index={index} />
            ))}
        </View>
    );

    const renderEmptyState = () => (
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
                {searchQuery ? 'No Friends Found' : 'No Friend Requests'}
            </Text>

            <Text style={[
                typography.body,
                {
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginTop: spacing.sm,
                    paddingHorizontal: spacing['2xl'],
                }
            ]}>
                {searchQuery
                    ? 'Try a different search term'
                    : 'Start swiping to find and connect with new friends'}
            </Text>

            {!searchQuery && (
                <TouchableOpacity
                    style={[
                        styles.discoverButton,
                        {
                            backgroundColor: primary.main,
                            marginTop: spacing.xl,
                            borderRadius: borderRadius.button,
                        }
                    ]}
                    onPress={handleDiscover}
                >
                    <Ionicons name="compass-outline" size={20} color="#FFFFFF" />
                    <Text style={[typography.button, { color: '#FFFFFF', marginLeft: spacing.sm }]}>
                        Start Swiping
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color={isDark ? '#FFFFFF' : '#1A1A1A'} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: colors.text }]}>All Friends 👯</Text>

                <View style={{ width: 28 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
                    <Ionicons name="search" size={20} color={colors.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search by name"
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Friends List */}
            {loading ? (
                renderSkeletonLoading()
            ) : (
                <Animated.View style={{ flex: 1, opacity: contentFadeAnim }}>
                    <FlatList
                        data={filteredFriends}
                        renderItem={renderFriend}
                        keyExtractor={item => item._id}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={renderEmptyState}
                        contentContainerStyle={filteredFriends.length === 0 ? styles.emptyListContainer : undefined}
                    />
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 24,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    friendPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    friendInfo: {
        flex: 1,
        marginLeft: 12,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
    },
    friendMeta: {
        fontSize: 14,
        marginTop: 2,
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    chatButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    removeButton: {
        padding: 8,
    },
    emptyListContainer: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    discoverButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
    },
    skeletonContainer: {
        flex: 1,
    },
    skeletonText: {
        height: 14,
        borderRadius: 7,
    },
    skeletonButton: {
        width: 70,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
});

export default AllFriendsScreen;
