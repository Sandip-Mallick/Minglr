import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    TouchableOpacity,
    TextInput,
    Keyboard,
    Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolation,
    useAnimatedKeyboard,
    useAnimatedReaction,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { countries, Country } from '../../utils/countries';
import { LetterIcon } from '../Icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_MARGIN = 10;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.78; // Larger card - 82% of screen height
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface Photo {
    url: string;
    isMain: boolean;
    isVerified: boolean;
}

interface SwipeCardProps {
    user: {
        _id: string;
        name: string;
        age: number;
        country: string;
        bio?: string;
        photos: Photo[];
        onlineStatus?: { isOnline: boolean };
    };
    isTopCard?: boolean;
    lettersOwned: number;
    onLike: () => void;
    onDislike: () => void;
    onUndo: () => void;
    onSendMessage: (message: string) => void;
    onReport: () => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
    user,
    isTopCard = true,
    lettersOwned,
    onLike,
    onDislike,
    onUndo,
    onSendMessage,
    onReport,
}) => {
    const { colors, primaryColor } = useTheme();
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [messageText, setMessageText] = useState('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Track previous userId to detect user changes vs remounts
    const prevUserIdRef = useRef(user._id);

    // Keyboard handling
    useEffect(() => {
        const keyboardShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const keyboardHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );

        return () => {
            keyboardShowListener.remove();
            keyboardHideListener.remove();
        };
    }, []);

    // Shared values for animation
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // Only reset animated values when the actual user changes (not on remount)
    // This prevents the blinking effect when cards shift positions
    useEffect(() => {
        if (prevUserIdRef.current !== user._id) {
            // Different user - reset values for the new profile
            translateX.value = 0;
            translateY.value = 0;
            setCurrentPhotoIndex(0);
            setMessageText('');
            prevUserIdRef.current = user._id;
        }
    }, [user._id, translateX, translateY]);

    const photos = user.photos.length > 0 ? user.photos : [{ url: '', isMain: true, isVerified: false }];

    // Get country flag
    const countryData = countries.find((c: Country) => c.code === user.country || c.name === user.country);
    const countryFlag = countryData?.flag || '🌍';
    const countryCode = countryData?.code || user.country;


    const nextPhoto = () => {
        if (photos.length > 1) {
            setCurrentPhotoIndex((currentPhotoIndex + 1) % photos.length);
        }
    };

    const prevPhoto = () => {
        if (photos.length > 1) {
            setCurrentPhotoIndex((currentPhotoIndex - 1 + photos.length) % photos.length);
        }
    };

    const handleSwipeComplete = (direction: 'left' | 'right') => {
        if (direction === 'right') {
            onLike();
        } else {
            onDislike();
        }
        // Don't reset translateX/translateY here - the card is being removed from
        // the stack and resetting would cause a visual glitch before it disappears
    };

    const handleSendMessage = () => {
        if (messageText.trim() && lettersOwned > 0) {
            onSendMessage(messageText.trim());
            setMessageText('');
            Keyboard.dismiss();
        }
    };

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY * 0.5;
        })
        .onEnd((event) => {
            if (event.translationX > SWIPE_THRESHOLD) {
                translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
                    runOnJS(handleSwipeComplete)('right');
                });
            } else if (event.translationX < -SWIPE_THRESHOLD) {
                translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
                    runOnJS(handleSwipeComplete)('left');
                });
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            }
        });

    const cardStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
            [-15, 0, 15],
            Extrapolation.CLAMP
        );

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate}deg` },
            ],
        };
    });

    const likeOverlayStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [0, SWIPE_THRESHOLD],
            [0, 1],
            Extrapolation.CLAMP
        );
        return { opacity };
    });

    const nopeOverlayStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [-SWIPE_THRESHOLD, 0],
            [1, 0],
            Extrapolation.CLAMP
        );
        return { opacity };
    });

    return (
        <View style={styles.container}>
            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.card, { backgroundColor: colors.card }, cardStyle]}>
                    {/* Photo */}
                    <View style={styles.photoContainer}>
                        {photos[currentPhotoIndex]?.url ? (
                            <Image
                                source={{ uri: photos[currentPhotoIndex].url }}
                                style={styles.photo}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.photo, { backgroundColor: colors.surface }]}>
                                <Ionicons name="person" size={64} color={colors.textMuted} />
                            </View>
                        )}

                        {/* Photo indicators */}
                        <View style={styles.photoIndicators}>
                            {photos.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.indicator,
                                        {
                                            backgroundColor:
                                                index === currentPhotoIndex
                                                    ? '#FFFFFF'
                                                    : 'rgba(255,255,255,0.5)',
                                        },
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Photo navigation areas */}
                        <TouchableOpacity
                            style={styles.photoNavLeft}
                            onPress={prevPhoto}
                            activeOpacity={1}
                        />
                        <TouchableOpacity
                            style={styles.photoNavRight}
                            onPress={nextPhoto}
                            activeOpacity={1}
                        />

                        {/* User info - Top left */}
                        <View style={styles.userInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.userName}>{user.name}</Text>
                                {user.onlineStatus?.isOnline && (
                                    <View style={styles.onlineIndicator} />
                                )}
                            </View>
                            <View style={styles.countryBadge}>
                                <Text style={styles.countryFlag}>{countryFlag}</Text>
                                <Text style={styles.countryText}>{countryCode}, {user.age}</Text>
                            </View>
                        </View>

                        {/* Report button - Top right */}
                        <TouchableOpacity style={styles.reportButton} onPress={onReport}>
                            <Ionicons name="flag" size={18} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* LIKE overlay */}
                        <Animated.View style={[styles.overlay, styles.likeOverlay, likeOverlayStyle]}>
                            <View style={[styles.overlayBadge, { borderColor: '#4CAF50' }]}>
                                <Text style={[styles.overlayText, { color: '#4CAF50' }]}>LIKE</Text>
                            </View>
                        </Animated.View>

                        {/* NOPE overlay */}
                        <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeOverlayStyle]}>
                            <View style={[styles.overlayBadge, { borderColor: '#FF5252' }]}>
                                <Text style={[styles.overlayText, { color: '#FF5252' }]}>NOPE</Text>
                            </View>
                        </Animated.View>

                        {/* Undo button - Right side */}
                        <TouchableOpacity
                            style={styles.undoButton}
                            onPress={onUndo}
                        >
                            <View style={styles.undoButtonOuter}>
                                <View style={[styles.undoButtonInner, { backgroundColor: primaryColor }]}>
                                    <Image source={require('../../../assets/icons/undo-arrow.png')} style={{ width: 24, height: 24, tintColor: '#FFFFFF' }} />
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Letter count badge - Right side (only show when keyboard is closed) */}
                        {keyboardHeight === 0 && (
                            <View style={styles.letterBadges}>
                                <View style={styles.letterBadge}>
                                    <LetterIcon size={18} />
                                    <Text style={styles.letterBadgeCount}>{lettersOwned}</Text>
                                </View>
                            </View>
                        )}

                        {/* Message bar at bottom of card */}
                        <View style={styles.messageBarContainer}>
                            <TextInput
                                style={styles.messageInput}
                                placeholder="Send a message..."
                                placeholderTextColor="rgba(255,255,255,0.7)"
                                value={messageText}
                                onChangeText={setMessageText}
                            />
                        </View>
                    </View>
                </Animated.View>
            </GestureDetector>

            {/* Floating message bar when keyboard is open */}
            {keyboardHeight > 0 && (
                <View style={[styles.floatingMessageBar, { bottom: keyboardHeight + 10 }]}>
                    {/* Left: User's letter count */}
                    <View style={styles.floatingLetterInfo}>
                        <LetterIcon size={20} />
                        <Text style={styles.floatingLetterCount}>{lettersOwned}</Text>
                    </View>

                    {/* Center: Text input */}
                    <TextInput
                        style={styles.floatingMessageInput}
                        placeholder="Type your message..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={messageText}
                        onChangeText={setMessageText}
                        autoFocus
                    />

                    {/* Right: Send button with cost indicator */}
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            {
                                backgroundColor: messageText.trim() && lettersOwned >= 1
                                    ? primaryColor
                                    : 'rgba(100,100,100,0.5)',
                            }
                        ]}
                        onPress={handleSendMessage}
                        disabled={!messageText.trim() || lettersOwned < 1}
                    >
                        <View style={styles.sendButtonContent}>
                            <Ionicons
                                name="send"
                                size={16}
                                color={messageText.trim() && lettersOwned >= 1 ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
                            />
                            <View style={styles.sendButtonCost}>
                                <LetterIcon size={12} />
                                <Text style={styles.sendButtonCostText}>1</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    photoContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoIndicators: {
        position: 'absolute',
        top: 12,
        left: 16,
        right: 16,
        flexDirection: 'row',
        gap: 4,
    },
    indicator: {
        flex: 1,
        height: 3,
        borderRadius: 2,
    },
    photoNavLeft: {
        position: 'absolute',
        left: 0,
        top: 60,
        bottom: 80,
        width: '40%',
    },
    photoNavRight: {
        position: 'absolute',
        right: 0,
        top: 60,
        bottom: 80,
        width: '40%',
    },
    userInfo: {
        position: 'absolute',
        top: 28,
        left: 16,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    onlineIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    countryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(215, 48, 91, 0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginTop: 6,
        alignSelf: 'flex-start',
    },
    countryFlag: {
        fontSize: 14,
        marginRight: 6,
    },
    countryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    reportButton: {
        position: 'absolute',
        top: 28,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        position: 'absolute',
        top: 100,
        zIndex: 10,
    },
    likeOverlay: {
        left: 30,
        transform: [{ rotate: '-20deg' }],
    },
    nopeOverlay: {
        right: 30,
        transform: [{ rotate: '20deg' }],
    },
    overlayBadge: {
        borderWidth: 4,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    overlayText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    undoButton: {
        position: 'absolute',
        right: 16,
        bottom: 100,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    undoButtonOuter: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(100, 100, 100, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    undoButtonInner: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    letterBadges: {
        position: 'absolute',
        right: 16,
        bottom: 155,
        gap: 8,
    },
    letterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    letterEmoji: {
        fontSize: 14,
    },
    letterBadgeCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 4,
    },
    messageBarContainer: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 70,
    },
    messageInput: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#FFFFFF',
    },
    floatingMessageBar: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(50,50,50,0.95)',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    floatingMessageInput: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        marginHorizontal: 10,
    },
    floatingLetterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    floatingLetterEmoji: {
        fontSize: 14,
    },
    floatingLetterCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 4,
    },
    floatingLetterCost: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButton: {
        width: 48,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    sendButtonCost: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 2,
    },
    sendButtonCostText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 1,
    },
});

export default SwipeCard;
