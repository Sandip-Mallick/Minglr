import apiClient from './client';
import { PaginatedResponse } from './friends';

export interface ReplyTo {
    messageId: string;
    senderId: string;
    senderName: string;
    content: string;
}

export interface ChatMessage {
    _id: string;
    senderId: string;
    content: string;
    createdAt: string;
    readAt?: string;
    replyTo?: ReplyTo;
}

export interface ChatSummary {
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
        isRead: boolean;
    };
    unreadCount: number;
}

export const chatsApi = {
    /**
     * Get user's chats
     */
    getChats: async (page: number = 1, limit: number = 20): Promise<PaginatedResponse<ChatSummary>> => {
        const response = await apiClient.get('/chats', { params: { page, limit } });
        return response.data;
    },

    /**
     * Get messages in a chat (supports cursor-based pagination)
     * @param cursor - Optional message ID to load messages before (older messages)
     */
    getMessages: async (chatId: string, page: number = 1, limit: number = 25, cursor?: string): Promise<PaginatedResponse<ChatMessage>> => {
        const params: Record<string, any> = { page, limit };
        if (cursor) {
            params.cursor = cursor;
        }
        const response = await apiClient.get(`/chats/${chatId}`, { params });
        return response.data;
    },

    /**
     * Send message
     */
    sendMessage: async (chatId: string, content: string, replyToMessageId?: string): Promise<ChatMessage> => {
        const response = await apiClient.post(`/chats/${chatId}/message`, { content, replyToMessageId });
        return response.data;
    },

    /**
     * Mark chat as read
     */
    markAsRead: async (chatId: string): Promise<{ success: boolean }> => {
        const response = await apiClient.post(`/chats/${chatId}/read`);
        return response.data;
    },

    /**
     * Get or create chat with a user
     */
    getOrCreateChat: async (userId: string): Promise<{ chatId: string }> => {
        const response = await apiClient.post(`/chats/with/${userId}`);
        return response.data;
    },
};
