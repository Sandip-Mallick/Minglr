import { io, Socket } from 'socket.io-client';
import { secureStorage } from '../utils/secureStorage';
import { ChatMessage } from './chats';

// Socket server URL - extract just the origin (protocol://host:port) from API URL
// Fallback to production URL if env var is not set (safer for production builds)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://minglr-backend.onrender.com/api/v1';
// Parse URL to get just the origin without any path
const getSocketUrl = (apiUrl: string): string => {
    try {
        const url = new URL(apiUrl);
        return url.origin; // Returns protocol://host:port
    } catch {
        // Fallback: strip everything after port (use production URL as default)
        const match = apiUrl.match(/^(https?:\/\/[^\/]+)/);
        return match ? match[1] : 'https://minglr-backend.onrender.com';
    }
};
const SOCKET_URL = getSocketUrl(API_BASE_URL);
console.log('[Socket] Using socket URL:', SOCKET_URL);

type MessageHandler = (data: { chatId: string; message: ChatMessage }) => void;
type ReadHandler = (data: { chatId: string; readerId: string; readAt: string }) => void;
type TypingHandler = (data: { userId: string; isTyping: boolean }) => void;
type ChatListUpdateHandler = (data: {
    chatId: string;
    lastMessage: {
        content: string;
        createdAt: string;
        isFromMe: boolean;
    }
}) => void;

class SocketService {
    private socket: Socket | null = null;
    private messageHandlers: Set<MessageHandler> = new Set();
    private readHandlers: Set<ReadHandler> = new Set();
    private typingHandlers: Set<TypingHandler> = new Set();
    private chatListUpdateHandlers: Set<ChatListUpdateHandler> = new Set();
    private currentChatId: string | null = null;
    private isConnecting: boolean = false;

    /**
     * Connect to socket server with auth token
     */
    async connect(): Promise<void> {
        // Already connected or connecting
        if (this.socket?.connected || this.isConnecting) {
            return;
        }

        // Socket exists but not connected - it will auto-reconnect
        if (this.socket) {
            return;
        }

        this.isConnecting = true;

        const token = await secureStorage.getItemAsync('accessToken');
        if (!token) {
            this.isConnecting = false;
            return;
        }

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Connected! Socket ID:', this.socket?.id);
            this.isConnecting = false;
            // Rejoin current chat if any
            if (this.currentChatId) {
                console.log('[Socket] Rejoining chat room:', this.currentChatId);
                this.joinChat(this.currentChatId);
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            // Socket.io will auto-reconnect, no need to log or take action
        });

        this.socket.on('connect_error', (error) => {
            console.log('[Socket] Connection error:', error.message);
            this.isConnecting = false;
        });

        // Listen for new messages (when inside a chat)
        this.socket.on('new_message', (data: { chatId: string; message: ChatMessage }) => {
            console.log('[Socket] Received new_message:', data.chatId, data.message._id);
            this.messageHandlers.forEach((handler) => handler(data));
        });

        // Listen for chat list updates (for chat list screen real-time updates)
        this.socket.on('chat_list_update', (data: { chatId: string; lastMessage: { content: string; createdAt: string; isFromMe: boolean } }) => {
            console.log('[Socket] Received chat_list_update:', data.chatId);
            this.chatListUpdateHandlers.forEach((handler) => handler(data));
        });

        // Listen for read receipts
        this.socket.on('messages_read', (data: { chatId: string; readerId: string; readAt: string }) => {
            this.readHandlers.forEach((handler) => handler(data));
        });

        // Listen for typing indicators
        this.socket.on('user_typing', (data: { userId: string; isTyping: boolean }) => {
            this.typingHandlers.forEach((handler) => handler(data));
        });
    }

    /**
     * Disconnect from socket server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Join a chat room to receive messages
     */
    joinChat(chatId: string): void {
        console.log('[Socket] joinChat called for:', chatId, 'connected:', this.socket?.connected);
        this.currentChatId = chatId;
        if (this.socket?.connected) {
            console.log('[Socket] Emitting join_chat for:', chatId);
            this.socket.emit('join_chat', chatId);
        } else {
            console.log('[Socket] Not connected, will join on connect');
        }
    }

    /**
     * Leave a chat room
     */
    leaveChat(chatId: string): void {
        if (this.currentChatId === chatId) {
            this.currentChatId = null;
        }
        if (this.socket?.connected) {
            this.socket.emit('leave_chat', chatId);
        }
    }

    /**
     * Send typing indicator
     */
    sendTyping(chatId: string, isTyping: boolean): void {
        if (this.socket?.connected) {
            this.socket.emit('typing', { chatId, isTyping });
        }
    }

    /**
     * Add handler for new messages
     */
    onNewMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    /**
     * Add handler for chat list updates (real-time chat list)
     */
    onChatListUpdate(handler: ChatListUpdateHandler): () => void {
        this.chatListUpdateHandlers.add(handler);
        return () => this.chatListUpdateHandlers.delete(handler);
    }

    /**
     * Add handler for read receipts
     */
    onMessagesRead(handler: ReadHandler): () => void {
        this.readHandlers.add(handler);
        return () => this.readHandlers.delete(handler);
    }

    /**
     * Add handler for typing indicators
     */
    onTyping(handler: TypingHandler): () => void {
        this.typingHandlers.add(handler);
        return () => this.typingHandlers.delete(handler);
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService();

