import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    Platform,
    ActivityIndicator,
    Animated,
    PanResponder,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme';
import { chatsApi, ChatMessage } from '../../api/chats';
import { usersApi, UserProfile } from '../../api/users';
import { useAuthStore, useChatStore } from '../../store';
import { ProfileCardModal } from '../../components/profile/ProfileCardModal';
import { socketService } from '../../api/socket';

type ChatScreenRouteProp = RouteProp<{
    Chat: {
        chatId: string;
        participantId: string;
        participantName: string;
        participantPhoto?: string;
        isOnline?: boolean;
        lastActiveAt?: string;
        pendingRequestId?: string;
        initialMessage?: string;
    }
}, 'Chat'>;

const SWIPE_THRESHOLD = 60;

const ChatScreen: React.FC = () => {
    const { colors, primaryColor } = useTheme();
    const navigation = useNavigation();
    const route = useRoute<ChatScreenRouteProp>();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const {
        getCachedMessages,
        setCachedMessages,
        prependMessage,
        updateMessageInCache,
        removeMessageFromCache,
        isCacheStale,
        setActiveChat,
        clearActiveChat,
    } = useChatStore();
    const flatListRef = useRef<FlatList>(null);
    const currentChatRef = useRef<string | null>(null);

    const { chatId, participantId, participantName, participantPhoto, isOnline, lastActiveAt, pendingRequestId, initialMessage } = route.params;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [sending, setSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileUser, setProfileUser] = useState<Partial<UserProfile> | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Load messages with cache-first strategy
    useEffect(() => {
        loadMessagesWithCache();

        // Set active chat in store
        setActiveChat(chatId, {
            _id: participantId,
            name: participantName,
            photo: participantPhoto,
            isOnline: isOnline || false,
            lastActiveAt,
        });

        return () => {
            clearActiveChat();
        };
    }, [chatId]);

    // Socket.io connection and listeners
    useEffect(() => {
        // Connect to socket server (only once)
        socketService.connect();

        // Join this chat room only if not already joined
        if (currentChatRef.current !== chatId) {
            if (currentChatRef.current) {
                socketService.leaveChat(currentChatRef.current);
            }
            socketService.joinChat(chatId);
            currentChatRef.current = chatId;
        }

        // Listen for new messages
        const unsubMessage = socketService.onNewMessage((data) => {
            if (data.chatId === chatId) {
                // Skip messages from self (we already added them optimistically)
                if (data.message.senderId === user?._id || data.message.senderId?.toString() === user?._id) {
                    return;
                }

                // Only add if not already in messages (avoid duplicates)
                // For inverted list, prepend new message (it shows at bottom)
                setMessages((prev) => {
                    const messageId = data.message._id?.toString() || data.message._id;
                    const exists = prev.some((m) => {
                        const existingId = m._id?.toString() || m._id;
                        return existingId === messageId;
                    });
                    if (exists) return prev;
                    return [data.message, ...prev];
                });

                // CRITICAL: Also sync to cache so message persists on reopen
                prependMessage(chatId, data.message);

                // CRITICAL: Mark as read immediately since user is viewing this chat
                // This triggers the read receipt so the sender sees the "seen" indicator
                markAsRead();
            }
        });

        // Listen for read receipts
        const unsubRead = socketService.onMessagesRead((data) => {
            console.log('[ChatScreen] Received messages_read:', data.chatId, 'by:', data.readerId, 'current user:', user?._id);
            if (data.chatId === chatId && data.readerId !== user?._id) {
                console.log('[ChatScreen] Updating messages as read');
                // Update all messages as read
                setMessages((prev) =>
                    prev.map((m) =>
                        m.senderId === user?._id && !m.readAt
                            ? { ...m, readAt: data.readAt }
                            : m
                    )
                );
            }
        });

        return () => {
            // Only cleanup listeners, don't leave room (we track with ref)
            unsubMessage();
            unsubRead();
        };
    }, [chatId, user?._id]);

    // Leave room on unmount
    useEffect(() => {
        return () => {
            if (currentChatRef.current) {
                socketService.leaveChat(currentChatRef.current);
                currentChatRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            }
        );
        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardHeight(0);
            }
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []);

    useFocusEffect(
        useCallback(() => {
            markAsRead();
        }, [chatId])
    );

    // Cache-first loading strategy: show cached immediately, then sync in background
    const loadMessagesWithCache = async () => {
        // Check cache first
        const cached = getCachedMessages(chatId);

        if (cached && cached.messages.length > 0) {
            // Show cached immediately
            setMessages(cached.messages);
            setHasMore(cached.hasMore);
            setLoading(false);
            setInitialLoadDone(true);

            // If cache is stale, sync in background
            if (isCacheStale(chatId)) {
                syncMessagesInBackground();
            }
        } else {
            // No cache - load fresh
            await loadMessages();
        }
    };

    // Background sync without loading indicator
    const syncMessagesInBackground = async () => {
        try {
            const response = await chatsApi.getMessages(chatId, 1, 25);
            const newMessages = response.data;

            // Update state and cache
            setMessages(newMessages);
            setHasMore(response.pagination?.hasNext ?? true);
            setCachedMessages(chatId, newMessages, response.pagination?.hasNext ?? true);
        } catch (error) {
            // Silently fail - we already have cached data displayed
            console.log('Background sync failed, keeping cached messages');
        }
    };

    // Fresh load for first time or when no cache
    const loadMessages = async () => {
        try {
            if (!initialLoadDone) {
                setLoading(true);
            }
            const response = await chatsApi.getMessages(chatId, 1, 25);
            const newMessages = response.data;

            setMessages(newMessages);
            setHasMore(response.pagination?.hasNext ?? true);

            // Cache the messages
            setCachedMessages(chatId, newMessages, response.pagination?.hasNext ?? true);
        } catch (error) {
            console.log('No messages yet or chat is new');
            setMessages([]);
            setHasMore(false);
        } finally {
            setLoading(false);
            setInitialLoadDone(true);
        }
    };

    // Load more messages (lazy loading on scroll)
    const loadMoreMessages = async () => {
        if (!hasMore || loadingMore || messages.length === 0) return;

        setLoadingMore(true);
        try {
            // Use the oldest message ID as cursor (for inverted list, it's the last item)
            const oldestMessage = messages[messages.length - 1];
            const response = await chatsApi.getMessages(chatId, undefined, 25, oldestMessage._id);

            const olderMessages = response.data;
            if (olderMessages.length > 0) {
                // Append older messages
                setMessages(prev => [...prev, ...olderMessages]);
                setHasMore(response.pagination?.hasNext ?? false);

                // Update cache with all messages
                const cached = getCachedMessages(chatId);
                if (cached) {
                    const existingIds = new Set(cached.messages.map(m => m._id));
                    const newOldMessages = olderMessages.filter((m: ChatMessage) => !existingIds.has(m._id));
                    setCachedMessages(
                        chatId,
                        [...cached.messages, ...newOldMessages],
                        response.pagination?.hasNext ?? false
                    );
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.log('Failed to load more messages');
        } finally {
            setLoadingMore(false);
        }
    };

    const markAsRead = async () => {
        try {
            await chatsApi.markAsRead(chatId);
        } catch (error) {
            // Silently ignore
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setSending(true);

        const tempMessage: ChatMessage = {
            _id: `temp-${Date.now()}`,
            senderId: user?._id || '',
            content: messageText,
            createdAt: new Date().toISOString(),
            replyTo: replyingTo ? {
                messageId: replyingTo._id,
                senderId: replyingTo.senderId,
                senderName: replyingTo.senderId === user?._id ? 'yourself' : participantName,
                content: replyingTo.content,
            } : undefined,
        };

        // For inverted list, prepend new message (it shows at bottom)
        setMessages(prev => [tempMessage, ...prev]);

        // CRITICAL: Also add to cache optimistically
        prependMessage(chatId, tempMessage);

        const replyToId = replyingTo?._id;
        setReplyingTo(null);

        try {
            const sentMessage = await chatsApi.sendMessage(chatId, messageText, replyToId);

            // Update local state
            setMessages(prev => prev.map(m => m._id === tempMessage._id ? sentMessage : m));

            // CRITICAL: Update cache with confirmed message (replace temp ID with real ID)
            updateMessageInCache(chatId, tempMessage._id, sentMessage);

            // For inverted list, scroll to offset 0 shows the bottom (newest messages)
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        } catch (error) {
            // Remove from local state
            setMessages(prev => prev.filter(m => m._id !== tempMessage._id));

            // CRITICAL: Also remove from cache
            removeMessageFromCache(chatId, tempMessage._id);

            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    };

    const getLastActiveText = (lastActiveAt?: string) => {
        if (!lastActiveAt) return 'Offline';

        const lastActive = new Date(lastActiveAt);
        const now = new Date();
        const diffMs = now.getTime() - lastActive.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };
    const handleReply = (message: ChatMessage) => {
        setReplyingTo(message);
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const handleOpenProfile = async () => {
        if (loadingProfile) return;

        // Guard against undefined participantId
        if (!participantId) {
            // Fallback: show modal with basic info from route params
            setProfileUser({
                _id: '',
                name: participantName,
                age: 0,
                country: '',
                photos: participantPhoto ? [{ url: participantPhoto, order: 0, isMain: true, isVerified: false }] : [],
                onlineStatus: { isOnline: isOnline || false, lastActiveAt: lastActiveAt || '' },
            });
            setShowProfileModal(true);
            return;
        }

        setLoadingProfile(true);
        try {
            const userData = await usersApi.getUser(participantId);
            setProfileUser({
                _id: participantId,
                name: userData.name || participantName,
                age: userData.age || 0,
                country: userData.country || '',
                bio: userData.bio,
                photos: userData.photos || [],
                onlineStatus: { isOnline: isOnline || false, lastActiveAt: lastActiveAt || '' },
            });
            setShowProfileModal(true);
        } catch (error) {
            console.error('Failed to load user profile:', error);
            // Fallback: show modal with basic info from route params
            setProfileUser({
                _id: participantId,
                name: participantName,
                age: 0,
                country: '',
                photos: participantPhoto ? [{ url: participantPhoto, order: 0, isMain: true, isVerified: false }] : [],
                onlineStatus: { isOnline: isOnline || false, lastActiveAt: lastActiveAt || '' },
            });
            setShowProfileModal(true);
        } finally {
            setLoadingProfile(false);
        }
    };

    // Find last message from me to show seen indicator
    // With inverted list, index 0 = newest (bottom), so find first message from me
    const getLastMyMessageIndex = () => {
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].senderId === user?._id) {
                return i;
            }
        }
        return -1;
    };

    const lastMyMessageIndex = getLastMyMessageIndex();

    const SwipeableMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isMe = item.senderId === user?._id;
        const isLastMyMessage = index === lastMyMessageIndex;
        const pan = useRef(new Animated.Value(0)).current;
        const replyOpacity = useRef(new Animated.Value(0)).current;

        const panResponder = useRef(
            PanResponder.create({
                onMoveShouldSetPanResponder: (_, gestureState) => {
                    return gestureState.dx > 10 && Math.abs(gestureState.dy) < 30;
                },
                onPanResponderMove: (_, gestureState) => {
                    if (gestureState.dx > 0 && gestureState.dx <= SWIPE_THRESHOLD * 1.5) {
                        pan.setValue(gestureState.dx);
                        replyOpacity.setValue(Math.min(gestureState.dx / SWIPE_THRESHOLD, 1));
                    }
                },
                onPanResponderRelease: (_, gestureState) => {
                    if (gestureState.dx >= SWIPE_THRESHOLD) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleReply(item);
                    }
                    Animated.parallel([
                        Animated.spring(pan, { toValue: 0, useNativeDriver: true }),
                        Animated.timing(replyOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                    ]).start();
                },
            })
        ).current;

        const isReplyToSelf = item.replyTo?.senderId === user?._id;

        // Determine the correct reply display name based on perspective
        const getReplyDisplayName = () => {
            if (!item.replyTo) return '';

            const repliedToUserId = item.replyTo.senderId;
            const messageSenderId = item.senderId;
            const currentUserId = user?._id;

            // If the message sender replied to themselves
            if (repliedToUserId === messageSenderId) {
                if (messageSenderId === currentUserId) {
                    // I replied to myself -> "yourself"
                    return 'yourself';
                } else {
                    // Other user replied to themselves -> show their name
                    return participantName;
                }
            }

            // If replying to the current user (me)
            if (repliedToUserId === currentUserId) {
                return 'You';
            }

            // If replying to the other participant
            return item.replyTo.senderName || participantName;
        };

        const replyDisplayName = getReplyDisplayName();

        return (
            <View style={styles.swipeableContainer}>
                {/* Reply indicator on swipe */}
                <Animated.View style={[styles.replyIndicator, { opacity: replyOpacity }]}>
                    <View style={styles.replyIndicatorOuter}>
                        <View style={[styles.replyIndicatorInner, { backgroundColor: primaryColor }]}>
                            <Ionicons name="arrow-undo" size={18} color="#FFFFFF" />
                        </View>
                    </View>
                </Animated.View>

                <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                        styles.messageContainer,
                        { transform: [{ translateX: pan }] },
                    ]}
                >
                    {/* Reply header if this is a reply */}
                    {item.replyTo && (
                        <View style={[
                            styles.replyHeader,
                            // Position on the sender's side (right for my messages, left for others)
                            { justifyContent: isMe ? 'flex-end' : 'flex-start' }
                        ]}>
                            <Ionicons name={isMe ? "arrow-redo" : "arrow-undo"} size={14} color={colors.textMuted} />
                            <Text style={[styles.replyHeaderText, { color: colors.textMuted }]}>
                                replied {replyDisplayName}
                            </Text>
                        </View>
                    )}

                    {/* Message row */}
                    <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
                        <View style={[styles.bubbleWrapper, !isMe && styles.bubbleWrapperOther]}>
                            {/* Quoted bubble (attached above main bubble with sharp corner) */}
                            {item.replyTo && (
                                <View style={[
                                    styles.quotedBubble,
                                    isMe ? styles.quotedBubbleSharpRight : styles.quotedBubbleSharpLeft,
                                    // Style based on whose message is being quoted
                                    item.replyTo.senderId === user?._id
                                        ? { backgroundColor: '#eee0fa' }  // Quoting MY message → purple
                                        : { backgroundColor: '#e8e8e8' }, // Quoting OTHER's message → gray
                                ]}>
                                    <Text style={[
                                        styles.quotedText,
                                        {
                                            color: item.replyTo.senderId === user?._id ? '#805aa1' : '#757575',
                                            fontWeight: '500'
                                        }
                                    ]} numberOfLines={2}>
                                        {item.replyTo.content}
                                    </Text>
                                </View>
                            )}

                            {/* Main bubble with time inside same row */}
                            <View style={styles.bubbleWithMeta}>
                                <View
                                    style={[
                                        styles.messageBubble,
                                        isMe
                                            ? [styles.messageBubbleMe, { backgroundColor: primaryColor }]
                                            : [styles.messageBubbleOther, { backgroundColor: '#000000' }],
                                    ]}
                                >
                                    <View style={styles.messageContent}>
                                        <Text style={[styles.messageText, { color: '#FFFFFF' }]}>
                                            {item.content}
                                        </Text>
                                        <Text style={[
                                            styles.timeInside,
                                            { color: 'rgba(255,255,255,0.7)' }
                                        ]}>
                                            {formatTime(item.createdAt)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Seen/Tick indicator at bottom-right corner */}
                                {isMe && isLastMyMessage && (
                                    <View style={styles.seenBottomRight}>
                                        {item.readAt ? (
                                            <View style={styles.seenAvatarBorder}>
                                                {participantPhoto ? (
                                                    <Image source={{ uri: participantPhoto }} style={styles.seenAvatar} />
                                                ) : (
                                                    <View style={[styles.seenAvatar, { backgroundColor: colors.surface }]}>
                                                        <Ionicons name="person" size={12} color={colors.textMuted} />
                                                    </View>
                                                )}
                                            </View>
                                        ) : (
                                            <View style={styles.tickCircle}>
                                                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleOpenProfile} style={styles.profileTouchable} activeOpacity={0.7}>
                    {participantPhoto ? (
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: participantPhoto }} style={styles.avatar} />
                            {isOnline && <View style={styles.onlineDot} />}
                        </View>
                    ) : (
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                                <Ionicons name="person" size={20} color={colors.textMuted} />
                            </View>
                            {isOnline && <View style={styles.onlineDot} />}
                        </View>
                    )}

                    <View style={styles.headerInfo}>
                        <Text style={[styles.headerName, { color: colors.text }]}>{participantName}</Text>
                        <Text style={[styles.headerStatus, { color: isOnline ? '#22C55E' : colors.textMuted }]}>
                            {isOnline ? 'Online now' : getLastActiveText(lastActiveAt)}
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.headerAction}>
                    <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={primaryColor} />
                </View>
            ) : (
                <>
                    {/* Initial message banner (from friend request) */}
                    {initialMessage && messages.length === 0 && (
                        <View style={[styles.initialMessageBanner, { backgroundColor: colors.surface }]}>
                            <View style={styles.initialMessageHeader}>
                                <Ionicons name="mail-outline" size={18} color={primaryColor} />
                                <Text style={[styles.initialMessageLabel, { color: colors.textSecondary }]}>
                                    Message from {participantName}
                                </Text>
                            </View>
                            <Text style={[styles.initialMessageText, { color: colors.text }]}>
                                "{initialMessage}"
                            </Text>
                            <Text style={[styles.initialMessageHint, { color: colors.textMuted }]}>
                                Reply to accept the friend request
                            </Text>
                        </View>
                    )}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={({ item, index }) => <SwipeableMessage item={item} index={index} />}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.messagesList}
                        showsVerticalScrollIndicator={false}
                        // Inverted list - newest messages at bottom automatically
                        inverted={true}
                        // Lazy loading - load more when scrolling to top (end for inverted list)
                        onEndReached={loadMoreMessages}
                        onEndReachedThreshold={0.3}
                        // Loading indicator for fetching more messages
                        ListFooterComponent={
                            loadingMore ? (
                                <View style={styles.loadingMoreContainer}>
                                    <ActivityIndicator size="small" color={primaryColor} />
                                </View>
                            ) : null
                        }
                        // Performance optimizations
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        initialNumToRender={15}
                        updateCellsBatchingPeriod={50}
                    />
                </>
            )}

            {/* Reply Preview */}
            {replyingTo && (
                <View style={[styles.replyPreview, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <View style={styles.replyPreviewContent}>
                        <View style={styles.replyPreviewHeader}>
                            <Ionicons name="arrow-undo" size={16} color={primaryColor} />
                            <Text style={[styles.replyPreviewName, { color: primaryColor }]}>
                                {replyingTo.senderId === user?._id ? 'yourself' : participantName}
                            </Text>
                        </View>
                        <Text style={[styles.replyPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {replyingTo.content}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={cancelReply} style={styles.replyPreviewClose}>
                        <Ionicons name="close" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Input */}
            <View style={[
                styles.inputContainer,
                {
                    paddingBottom: keyboardHeight > 0 ? 12 : insets.bottom + 8,
                    backgroundColor: colors.card,
                    marginBottom: keyboardHeight > 0 ? keyboardHeight + 10 : 0,
                }
            ]}>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                    placeholder="Aa"
                    placeholderTextColor={colors.textMuted}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={1000}
                />
                <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: primaryColor, opacity: newMessage.trim() ? 1 : 0.5 }]}
                    onPress={handleSend}
                    disabled={!newMessage.trim() || sending}
                >
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Profile Card Modal */}
            <ProfileCardModal
                visible={showProfileModal}
                user={profileUser as any}
                onClose={() => setShowProfileModal(false)}
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
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    backButton: {
        padding: 4,
    },
    avatarContainer: {
        position: 'relative',
        marginLeft: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerName: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerStatus: {
        fontSize: 12,
        marginTop: 2,
    },
    headerAction: {
        padding: 8,
    },
    profileTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingMoreContainer: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    messagesList: {
        padding: 16,
        flexGrow: 1,
    },
    swipeableContainer: {
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    replyIndicator: {
        position: 'absolute',
        left: 0,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyIndicatorOuter: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(100, 100, 100, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyIndicatorInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageContainer: {
        flex: 1,
    },
    replyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
    },
    replyHeaderText: {
        fontSize: 13,
        fontWeight: '500',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    messageRowMe: {
        justifyContent: 'flex-end',
    },
    bubbleWrapper: {
        maxWidth: '80%',
        alignItems: 'flex-end',
    },
    bubbleWrapperOther: {
        alignItems: 'flex-start',
    },
    quotedBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        marginBottom: 0,
    },
    quotedBubbleSharpRight: {
        borderBottomRightRadius: 4,
    },
    quotedBubbleSharpLeft: {
        borderBottomLeftRadius: 4,
    },
    quotedText: {
        fontSize: 15,
    },
    bubbleWithMeta: {
        position: 'relative',
    },
    messageBubble: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 18,
        alignSelf: 'flex-end',
    },
    messageBubbleMe: {
        borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
        borderBottomLeftRadius: 4,
        alignSelf: 'flex-start',
    },
    messageContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'baseline',
    },
    messageText: {
        fontSize: 16,
        fontWeight: '500',
        flexShrink: 1,
    },
    timeInside: {
        fontSize: 9,
        marginLeft: 6,
    },
    seenBottomRight: {
        position: 'absolute',
        bottom: -6,
        right: -6,
    },
    seenAvatarBorder: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    seenAvatar: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    tickCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#6B7280',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageTimeOther: {
        fontSize: 10,
        marginLeft: 6,
        marginBottom: 1,
    },
    replyPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    replyPreviewContent: {
        flex: 1,
    },
    replyPreviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    replyPreviewName: {
        fontSize: 14,
        fontWeight: '600',
    },
    replyPreviewText: {
        fontSize: 14,
        marginTop: 2,
        marginLeft: 22,
    },
    replyPreviewClose: {
        padding: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    initialMessageBanner: {
        margin: 16,
        padding: 16,
        borderRadius: 16,
        marginBottom: 0,
    },
    initialMessageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    initialMessageLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    initialMessageText: {
        fontSize: 16,
        fontStyle: 'italic',
        lineHeight: 22,
    },
    initialMessageHint: {
        fontSize: 12,
        marginTop: 12,
        textAlign: 'center',
    },
});

export default ChatScreen;
