import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { socketService } from '../api/socket';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MatchmakingStatus =
    | 'idle'
    | 'searching'
    | 'found'
    | 'accepted'
    | 'success'
    | 'timeout'
    | 'cooldown';

export interface PartnerProfile {
    _id: string;
    name: string;
    age: number;
    country: string;
    gender: string;
    photo: string | null;
}

export interface UseMatchmakingReturn {
    status: MatchmakingStatus;
    matchId: string | null;
    partnerProfile: PartnerProfile | null;
    partnerAccepted: boolean;
    chatId: string | null;
    countdown: number;
    cooldownRemaining: number;
    cancelReason: string | null;
    joinQueue: () => void;
    leaveQueue: () => void;
    acceptMatch: () => void;
    declineMatch: () => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useMatchmaking(): UseMatchmakingReturn {
    const [status, setStatus] = useState<MatchmakingStatus>('idle');
    const [matchId, setMatchId] = useState<string | null>(null);
    const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
    const [partnerAccepted, setPartnerAccepted] = useState(false);
    const [chatId, setChatId] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [cancelReason, setCancelReason] = useState<string | null>(null);

    // Client-side join lock — prevents multiple rapid join emissions
    const isJoiningRef = useRef(false);

    // Interval refs for cleanup
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const cooldownEndRef = useRef<number>(0);

    // ─── Countdown Timer (cosmetic) ──────────────────────────────────────

    const startCountdown = useCallback((seconds: number) => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdown(seconds);
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const stopCountdown = useCallback(() => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
        setCountdown(0);
    }, []);

    // ─── Cooldown Timer ──────────────────────────────────────────────────

    const startCooldown = useCallback((seconds: number) => {
        if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
        cooldownEndRef.current = Date.now() + seconds * 1000;
        setCooldownRemaining(seconds);
        setStatus('cooldown');

        cooldownIntervalRef.current = setInterval(() => {
            const remaining = Math.ceil((cooldownEndRef.current - Date.now()) / 1000);
            if (remaining <= 0) {
                if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
                cooldownIntervalRef.current = null;
                setCooldownRemaining(0);
                setStatus('idle');
            } else {
                setCooldownRemaining(remaining);
            }
        }, 1000);
    }, []);

    // ─── Reset State ─────────────────────────────────────────────────────

    const resetMatchState = useCallback(() => {
        setMatchId(null);
        setPartnerProfile(null);
        setPartnerAccepted(false);
        setChatId(null);
        setCancelReason(null);
        stopCountdown();
    }, [stopCountdown]);

    // ─── Socket Event Listeners ──────────────────────────────────────────

    // Track socket readiness so we can re-run the effect when it connects
    const [socketReady, setSocketReady] = useState(false);

    // Connect and track readiness
    useEffect(() => {
        let cancelled = false;

        const initSocket = async () => {
            await socketService.connect();
            if (!cancelled) {
                setSocketReady(socketService.isConnected());
            }
        };

        initSocket();

        // Also listen for reconnection to re-register listeners
        const checkInterval = setInterval(() => {
            const connected = socketService.isConnected();
            setSocketReady(prev => {
                if (prev !== connected) return connected;
                return prev;
            });
        }, 1000);

        return () => {
            cancelled = true;
            clearInterval(checkInterval);
        };
    }, []);

    // Register event listeners once socket is ready
    useEffect(() => {
        const socket = socketService.getSocket();
        if (!socket) return;

        const onMatchmakingStatus = (data: { v: number; status: string }) => {
            if (data.status === 'searching') {
                setStatus('searching');
                startCountdown(30);
                isJoiningRef.current = false;
            } else if (data.status === 'already_searching') {
                // Already in queue — update UI to match
                setStatus('searching');
                isJoiningRef.current = false;
            }
        };

        const onMatchmakingError = (data: {
            v: number;
            error: string;
            cooldownSeconds?: number;
        }) => {
            isJoiningRef.current = false;

            if (data.error === 'COOLDOWN_ACTIVE' && data.cooldownSeconds) {
                startCooldown(data.cooldownSeconds);
            } else if (data.error === 'CHAT_CREATION_FAILED') {
                // Match succeeded but chat couldn't be created
                setCancelReason('chat_creation_failed');
                setStatus('idle');
                resetMatchState();
            }
            // Other errors: silently ignore (RATE_LIMITED, ALREADY_CONNECTED_ELSEWHERE, etc.)
        };

        const onMatchFound = (data: {
            v: number;
            matchId: string;
            user: PartnerProfile;
        }) => {
            stopCountdown();
            setMatchId(data.matchId);
            setPartnerProfile(data.user);
            setPartnerAccepted(false);
            setCancelReason(null);
            setStatus('found');
            startCountdown(10); // 10s acceptance window (cosmetic)
        };

        const onMatchPartnerAccepted = (_data: { v: number; matchId: string }) => {
            setPartnerAccepted(true);
        };

        const onMatchSuccess = (data: {
            v: number;
            matchId: string;
            chatId: string;
        }) => {
            stopCountdown();
            setChatId(data.chatId);
            setStatus('success');
        };

        const onMatchCancelled = (data: {
            v: number;
            matchId: string;
            reason: string;
            cooldownSeconds?: number;
        }) => {
            stopCountdown();
            setCancelReason(data.reason);

            if (data.reason === 'you_declined' && data.cooldownSeconds) {
                resetMatchState();
                startCooldown(data.cooldownSeconds);
            } else if (data.reason === 'partner_declined' || data.reason === 'partner_disconnected') {
                // Partner left — we're re-queued by server, expect 'matchmaking_status: searching'
                resetMatchState();
                setStatus('searching');
                startCountdown(30);
            } else if (data.reason === 'accept_timeout') {
                resetMatchState();
                setStatus('timeout');
            } else {
                resetMatchState();
                setStatus('idle');
            }
        };

        const onMatchTimeout = (_data: { v: number; reason: string }) => {
            stopCountdown();
            resetMatchState();
            setStatus('timeout');
        };

        // Register listeners
        socket.on('matchmaking_status', onMatchmakingStatus);
        socket.on('matchmaking_error', onMatchmakingError);
        socket.on('match_found', onMatchFound);
        socket.on('match_partner_accepted', onMatchPartnerAccepted);
        socket.on('match_success', onMatchSuccess);
        socket.on('match_cancelled', onMatchCancelled);
        socket.on('match_timeout', onMatchTimeout);

        return () => {
            socket.off('matchmaking_status', onMatchmakingStatus);
            socket.off('matchmaking_error', onMatchmakingError);
            socket.off('match_found', onMatchFound);
            socket.off('match_partner_accepted', onMatchPartnerAccepted);
            socket.off('match_success', onMatchSuccess);
            socket.off('match_cancelled', onMatchCancelled);
            socket.off('match_timeout', onMatchTimeout);
        };
    }, [socketReady, startCountdown, stopCountdown, startCooldown, resetMatchState]);

    // ─── AppState Listener (background → leave queue) ────────────────────

    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState !== 'active' && (status === 'searching' || status === 'found')) {
                socketService.emitLeaveMatchmaking();
                resetMatchState();
                setStatus('idle');
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [status, resetMatchState]);

    // ─── Cleanup on unmount ──────────────────────────────────────────────

    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
            // Leave queue if active when FindScreen unmounts
            if (status === 'searching' || status === 'found') {
                socketService.emitLeaveMatchmaking();
            }
        };
    }, [status]);

    // ─── Actions ─────────────────────────────────────────────────────────

    const joinQueue = useCallback(async () => {
        if (isJoiningRef.current || status === 'searching' || status === 'found' || status === 'cooldown') {
            return;
        }
        isJoiningRef.current = true;
        setCancelReason(null);
        await socketService.connect();
        socketService.emitJoinMatchmaking();
    }, [status]);

    const leaveQueue = useCallback(() => {
        socketService.emitLeaveMatchmaking();
        resetMatchState();
        setStatus('idle');
    }, [resetMatchState]);

    const acceptMatchAction = useCallback(() => {
        if (matchId && status === 'found') {
            setStatus('accepted');
            socketService.emitAcceptMatch(matchId);
        }
    }, [matchId, status]);

    const declineMatchAction = useCallback(() => {
        if (matchId && (status === 'found' || status === 'accepted')) {
            socketService.emitDeclineMatch(matchId);
        }
    }, [matchId, status]);

    return {
        status,
        matchId,
        partnerProfile,
        partnerAccepted,
        chatId,
        countdown,
        cooldownRemaining,
        cancelReason,
        joinQueue,
        leaveQueue,
        acceptMatch: acceptMatchAction,
        declineMatch: declineMatchAction,
    };
}
