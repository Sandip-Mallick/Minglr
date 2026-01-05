import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { chatsApi, ChatSummary } from '../../api/chats';
import { friendsApi } from '../../api/friends';
import { useChatStore, useGemsStore } from '../../store';
import { UserIcon, ChatIcon, GemIcon } from '../../components/Icons';
import { socketService } from '../../api/socket';

const ChatsScreen: React.FC = () => {
    const { colors, primary, spacing, borderRadius, typography, isDark } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { setChats } = useChatStore();
    const { gemsBalance } = useGemsStore();

    const [chatList, setChatList] = useState<ChatSummary[]>([]);
    const [hasFriends, setHasFriends] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    useEffect(() => {
        loadChats();
    }, []);

    // Socket.io for real-time updates
    useEffect(() => {
        socketService.connect();

        // Listen for chat list updates (user-level channel - works regardless of being in a chat)
        const unsubChatListUpdate = socketService.onChatListUpdate((data) => {
            setChatList((prev) => {
                const index = prev.findIndex((c) => c.chatId === data.chatId);
                if (index === -1) {
                    // New chat - reload to get full data
                    loadChatsQuietly();
                    return prev;
                }

                const updated = [...prev];
                const chat = { ...updated[index] };
                chat.lastMessage = {
                    content: data.lastMessage.content,
                    createdAt: data.lastMessage.createdAt,
                    isFromMe: data.lastMessage.isFromMe,
                    isRead: false,
                };
                if (!data.lastMessage.isFromMe) {
                    chat.unreadCount = (chat.unreadCount || 0) + 1;
                }
                updated[index] = chat;

                // Move chat to top
                updated.splice(index, 1);
                updated.unshift(chat);
                return updated;
            });
        });

        // Also listen for new_message for when user is in a specific chat
        const unsubMessage = socketService.onNewMessage((data) => {
            setChatList((prev) => {
                const index = prev.findIndex((c) => c.chatId === data.chatId);
                if (index === -1) return prev;

                const updated = [...prev];
                const chat = { ...updated[index] };
                chat.lastMessage = {
                    content: data.message.content,
                    createdAt: data.message.createdAt,
                    isFromMe: false,
                    isRead: false,
                };
                chat.unreadCount = (chat.unreadCount || 0) + 1;
                updated[index] = chat;

                updated.splice(index, 1);
                updated.unshift(chat);
                return updated;
            });
        });

        const unsubRead = socketService.onMessagesRead((data) => {
            setChatList((prev) => {
                const index = prev.findIndex((c) => c.chatId === data.chatId);
                if (index === -1) return prev;

                const updated = [...prev];
                const chat = { ...updated[index] };
                if (chat.lastMessage?.isFromMe) {
                    chat.lastMessage = { ...chat.lastMessage, isRead: true };
                }
                updated[index] = chat;
                return updated;
            });
        });

        return () => {
            unsubChatListUpdate();
            unsubMessage();
            unsubRead();
        };
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (initialLoadDone) {
                loadChatsQuietly();
            }
        }, [initialLoadDone])
    );

    const loadChats = async () => {
        try {
            setLoading(true);
            const [chatsData, friendsData] = await Promise.all([
                chatsApi.getChats(),
                friendsApi.getRecentFriends(1),
            ]);
            const validChats = chatsData.data.filter(
                (chat) =>
                    chat.participant._id &&
                    chat.participant.name &&
                    chat.participant.name !== 'Unknown'
            );
            setChatList(validChats);
            setChats(validChats);
            setHasFriends(friendsData.length > 0);
        } catch (error) {
            console.error('Failed to load chats:', error);
        } finally {
            setLoading(false);
            setInitialLoadDone(true);
        }
    };

    const loadChatsQuietly = async () => {
        try {
            const [chatsData, friendsData] = await Promise.all([
                chatsApi.getChats(),
                friendsApi.getRecentFriends(1),
            ]);
            const validChats = chatsData.data.filter(
                (chat) =>
                    chat.participant._id &&
                    chat.participant.name &&
                    chat.participant.name !== 'Unknown'
            );
            setChatList(validChats);
            setChats(validChats);
            setHasFriends(friendsData.length > 0);
        } catch (error) {
            console.error('Failed to load chats:', error);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const handleChatPress = (chat: ChatSummary) => {
        if (chat.unreadCount > 0) {
            setChatList((prev) =>
                prev.map((c) =>
                    c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c
                )
            );
        }

        (navigation as any).navigate('Chat', {
            chatId: chat.chatId,
            participantId: chat.participant._id,
            participantName: chat.participant.name,
            participantPhoto: chat.participant.photo,
            isOnline: chat.participant.isOnline,
            lastActiveAt: chat.participant.lastActiveAt,
        });
    };

    const renderReadReceipt = (item: ChatSummary) => {
        if (!item.lastMessage?.isFromMe) return null;

        if (item.lastMessage.isRead) {
            return (
                <View style={styles.readReceiptContainer}>
                    {item.participant.photo ? (
                        <Image source={{ uri: item.participant.photo }} style={styles.seenAvatar} />
                    ) : (
                        <View style={[styles.seenAvatar, { backgroundColor: colors.surface }]}>
                            <Ionicons name="person" size={8} color={colors.textMuted} />
                        </View>
                    )}
                </View>
            );
        }

        return (
            <View style={styles.readReceiptContainer}>
                <Ionicons name="checkmark" size={14} color={colors.textMuted} />
            </View>
        );
    };

    const renderChatItem = ({ item }: { item: ChatSummary }) => (
        <TouchableOpacity
            style={[styles.chatItem, { padding: spacing.base }]}
            onPress={() => handleChatPress(item)}
        >
            <View style={styles.avatarContainer}>
                {item.participant.photo ? (
                    <Image source={{ uri: item.participant.photo }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                        <UserIcon size={24} color={colors.textMuted} />
                    </View>
                )}
                {item.participant.isOnline && (
                    <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
                )}
            </View>

            <View style={[styles.chatInfo, { marginLeft: spacing.md }]}>
                <View style={styles.chatHeader}>
                    <Text style={[typography.label, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                        {item.participant.name}
                    </Text>
                    {item.lastMessage && (
                        <Text style={[typography.caption, { color: colors.textMuted }]}>
                            {formatTime(item.lastMessage.createdAt)}
                        </Text>
                    )}
                </View>

                <View style={styles.chatPreview}>
                    {item.lastMessage?.isFromMe && renderReadReceipt(item)}
                    <Text
                        style={[
                            typography.bodySmall,
                            {
                                color: item.unreadCount > 0 ? colors.text : colors.textSecondary,
                                flex: 1,
                            },
                            item.unreadCount > 0 && { fontWeight: '600' },
                        ]}
                        numberOfLines={1}
                    >
                        {item.lastMessage?.isFromMe && 'You: '}
                        {item.lastMessage?.content || 'No messages yet'}
                    </Text>

                    {item.unreadCount > 0 && (
                        <View style={[
                            styles.unreadBadge,
                            {
                                backgroundColor: primary.main,
                                minWidth: 20,
                                height: 20,
                                borderRadius: 10,
                            }
                        ]}>
                            <Text style={[typography.captionSmall, styles.unreadCount]}>
                                {item.unreadCount > 99 ? '99+' : item.unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
            <View style={styles.headerSide} />

            <View style={styles.headerCenter}>
                <Text style={[typography.h2, { color: colors.text }]}>Chats</Text>
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
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                {renderHeader()}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={primary.main} />
                </View>
            </View>
        );
    }

    if (chatList.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}

                <View style={[styles.emptyContent, { padding: spacing.xl }]}>
                    <View style={[
                        styles.emptyIconContainer,
                        {
                            backgroundColor: `${primary.main}15`,
                            borderRadius: borderRadius.full,
                            marginBottom: spacing.xl,
                        }
                    ]}>
                        <ChatIcon size={48} color={primary.main} />
                    </View>
                    <Text style={[typography.h3, { color: colors.text, textAlign: 'center' }]}>
                        {hasFriends ? 'No Chat History' : 'No Friends Yet'}
                    </Text>
                    <Text style={[
                        typography.body,
                        { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }
                    ]}>
                        {hasFriends
                            ? 'You have no chat history. Start the chat by selecting any friends'
                            : 'You have no friends yet. Start by swiping right or find'}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {renderHeader()}

            <FlatList
                data={chatList}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.chatId}
                showsVerticalScrollIndicator={false}
            />
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
    gemsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centered: {},
    chatItem: {
        flexDirection: 'row',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    chatInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatPreview: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    readReceiptContainer: {
        marginRight: 4,
    },
    seenAvatar: {
        width: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadBadge: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadCount: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});

export default ChatsScreen;
