import { create } from 'zustand';

interface ChatMessage {
    _id: string;
    senderId: string;
    content: string;
    createdAt: string;
    readAt?: string;
    replyTo?: {
        messageId: string;
        senderId: string;
        senderName: string;
        content: string;
    };
}

interface ChatSummary {
    chatId: string;
    participant: {
        _id: string;
        name: string;
        photo?: string;
        isOnline: boolean;
        lastActiveAt?: string;
    };
    lastMessage?: {
        content: string;
        createdAt: string;
        isFromMe: boolean;
        isRead?: boolean;
    };
    unreadCount: number;
}

// Cache entry with TTL management
interface MessageCacheEntry {
    messages: ChatMessage[];
    lastFetched: number;
    lastAccessed: number;
    cursor?: string; // For pagination - ID of oldest message
    hasMore: boolean;
}

// TTL constants (in milliseconds)
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes - messages considered fresh
const CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes - max time to keep in memory

interface ChatState {
    // Chat list
    chats: ChatSummary[];

    // Message cache per chat
    messageCache: Map<string, MessageCacheEntry>;

    // Currently active chat
    activeChat: {
        chatId: string;
        participant: ChatSummary['participant'];
    } | null;

    isLoading: boolean;

    // Chat list actions
    setChats: (chats: ChatSummary[]) => void;
    updateChatLastMessage: (chatId: string, lastMessage: ChatSummary['lastMessage']) => void;

    // Message cache actions
    getCachedMessages: (chatId: string) => MessageCacheEntry | null;
    setCachedMessages: (chatId: string, messages: ChatMessage[], hasMore: boolean, cursor?: string) => void;
    appendCachedMessages: (chatId: string, messages: ChatMessage[], hasMore: boolean, cursor?: string) => void;
    prependMessage: (chatId: string, message: ChatMessage) => void;
    updateMessageInCache: (chatId: string, tempId: string, message: ChatMessage) => void;
    removeMessageFromCache: (chatId: string, messageId: string) => void;
    markMessagesAsRead: (chatId: string, readAt: string) => void;
    isCacheStale: (chatId: string) => boolean;
    refreshCacheTimestamp: (chatId: string) => void;
    clearStaleCache: () => void;

    // Active chat actions
    setActiveChat: (chatId: string, participant: ChatSummary['participant']) => void;
    clearActiveChat: () => void;

    setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    chats: [],
    messageCache: new Map(),
    activeChat: null,
    isLoading: false,

    // Chat list actions
    setChats: (chats) => {
        set({ chats });
    },

    updateChatLastMessage: (chatId, lastMessage) => {
        set((state) => ({
            chats: state.chats.map((chat) =>
                chat.chatId === chatId
                    ? { ...chat, lastMessage, unreadCount: 0 }
                    : chat
            ),
        }));
    },

    // Message cache actions
    getCachedMessages: (chatId) => {
        const cache = get().messageCache.get(chatId);
        if (!cache) return null;

        // Update last accessed time
        const now = Date.now();
        set((state) => {
            const newCache = new Map(state.messageCache);
            const entry = newCache.get(chatId);
            if (entry) {
                newCache.set(chatId, { ...entry, lastAccessed: now });
            }
            return { messageCache: newCache };
        });

        return cache;
    },

    setCachedMessages: (chatId, messages, hasMore, cursor) => {
        const now = Date.now();
        set((state) => {
            const newCache = new Map(state.messageCache);
            newCache.set(chatId, {
                messages,
                lastFetched: now,
                lastAccessed: now,
                hasMore,
                cursor,
            });
            return { messageCache: newCache };
        });
    },

    appendCachedMessages: (chatId, messages, hasMore, cursor) => {
        const now = Date.now();
        set((state) => {
            const newCache = new Map(state.messageCache);
            const existing = newCache.get(chatId);

            if (existing) {
                // Append older messages (for pagination)
                const existingIds = new Set(existing.messages.map(m => m._id));
                const newMessages = messages.filter(m => !existingIds.has(m._id));

                newCache.set(chatId, {
                    messages: [...existing.messages, ...newMessages],
                    lastFetched: existing.lastFetched, // Keep original fetch time
                    lastAccessed: now,
                    hasMore,
                    cursor,
                });
            } else {
                newCache.set(chatId, {
                    messages,
                    lastFetched: now,
                    lastAccessed: now,
                    hasMore,
                    cursor,
                });
            }
            return { messageCache: newCache };
        });
    },

    prependMessage: (chatId, message) => {
        const now = Date.now();
        set((state) => {
            const newCache = new Map(state.messageCache);
            const existing = newCache.get(chatId);

            if (existing) {
                // Check if message already exists (avoid duplicates)
                if (!existing.messages.some(m => m._id === message._id)) {
                    newCache.set(chatId, {
                        ...existing,
                        messages: [message, ...existing.messages],
                        lastAccessed: now,
                        lastFetched: now, // Reset TTL on new message
                    });
                }
            } else {
                // CRITICAL: Create new cache entry if none exists
                newCache.set(chatId, {
                    messages: [message],
                    lastFetched: now,
                    lastAccessed: now,
                    hasMore: true, // Assume there may be more history
                });
            }
            return { messageCache: newCache };
        });
    },

    updateMessageInCache: (chatId, tempId, message) => {
        set((state) => {
            const newCache = new Map(state.messageCache);
            const existing = newCache.get(chatId);

            if (existing) {
                newCache.set(chatId, {
                    ...existing,
                    messages: existing.messages.map(m =>
                        m._id === tempId ? message : m
                    ),
                });
            }
            return { messageCache: newCache };
        });
    },

    removeMessageFromCache: (chatId, messageId) => {
        set((state) => {
            const newCache = new Map(state.messageCache);
            const existing = newCache.get(chatId);

            if (existing) {
                newCache.set(chatId, {
                    ...existing,
                    messages: existing.messages.filter(m => m._id !== messageId),
                });
            }
            return { messageCache: newCache };
        });
    },

    markMessagesAsRead: (chatId, readAt) => {
        set((state) => {
            const newCache = new Map(state.messageCache);
            const existing = newCache.get(chatId);

            if (existing) {
                newCache.set(chatId, {
                    ...existing,
                    messages: existing.messages.map(m =>
                        m.readAt ? m : { ...m, readAt }
                    ),
                });
            }
            return { messageCache: newCache };
        });
    },

    isCacheStale: (chatId) => {
        const cache = get().messageCache.get(chatId);
        if (!cache) return true;

        const now = Date.now();
        return (now - cache.lastFetched) > CACHE_TTL;
    },

    refreshCacheTimestamp: (chatId) => {
        const now = Date.now();
        set((state) => {
            const newCache = new Map(state.messageCache);
            const existing = newCache.get(chatId);

            if (existing) {
                newCache.set(chatId, {
                    ...existing,
                    lastFetched: now,
                    lastAccessed: now,
                });
            }
            return { messageCache: newCache };
        });
    },

    clearStaleCache: () => {
        const now = Date.now();
        set((state) => {
            const newCache = new Map(state.messageCache);

            // Remove entries older than max age
            for (const [chatId, entry] of newCache.entries()) {
                if ((now - entry.lastAccessed) > CACHE_MAX_AGE) {
                    newCache.delete(chatId);
                }
            }

            return { messageCache: newCache };
        });
    },

    // Active chat actions
    setActiveChat: (chatId, participant) => {
        set({ activeChat: { chatId, participant } });
    },

    clearActiveChat: () => {
        set({ activeChat: null });
    },

    setLoading: (loading) => {
        set({ isLoading: loading });
    },
}));
