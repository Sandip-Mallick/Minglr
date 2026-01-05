import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet, Image } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G, Circle, Rect, Polygon } from 'react-native-svg';

interface IconProps {
    size?: number;
    color?: string;
    secondaryColor?: string;
    animated?: boolean;
}

// Animated wrapper for icons
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

/**
 * Premium Gem Icon using PNG image
 */
export const GemIcon: React.FC<IconProps> = ({
    size = 24,
    animated = false,
}) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (animated) {
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleValue, {
                        toValue: 1.15,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleValue, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseAnimation.start();
            return () => pulseAnimation.stop();
        }
    }, [animated, scaleValue]);

    return (
        <Animated.View style={animated ? { transform: [{ scale: scaleValue }] } : undefined}>
            <Image
                source={require('../../../assets/icons/Gems.png')}
                style={{ width: size, height: size }}
                resizeMode="contain"
            />
        </Animated.View>
    );
};

/**
 * Booster/Rocket Icon using Ionicons vector
 */
export const BoosterIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#4CAF50',
    animated = false,
}) => {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (animated) {
            const floatAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(translateY, {
                        toValue: -3,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: 0,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            floatAnimation.start();
            return () => floatAnimation.stop();
        }
    }, [animated, translateY]);

    return (
        <Animated.View style={animated ? { transform: [{ translateY }] } : undefined}>
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <Path
                    d="M12 2C12 2 14 4 14 8C14 10.5 13 12.5 12 14C11 12.5 10 10.5 10 8C10 4 12 2 12 2Z"
                    fill={color}
                />
                <Path
                    d="M12 14C12 14 15 13 17 15C18.5 16.5 19 19 19 19L16 18.5C16 18.5 15 17 15 16C15 15 14.5 14.5 14.5 14.5L12 14Z"
                    fill={color}
                />
                <Path
                    d="M12 14C12 14 9 13 7 15C5.5 16.5 5 19 5 19L8 18.5C8 18.5 9 17 9 16C9 15 9.5 14.5 9.5 14.5L12 14Z"
                    fill={color}
                />
                <Circle cx="12" cy="7" r="2" fill="#FFFFFF" opacity={0.7} />
                <Path
                    d="M10 20L12 22L14 20"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />
                <Path
                    d="M12 14V20"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </Svg>
        </Animated.View>
    );
};


/**
 * Watch Video / Play Icon
 */
export const WatchVideoIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#EC4899',
    secondaryColor = '#BE185D',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Defs>
                <LinearGradient id="videoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={color} />
                    <Stop offset="100%" stopColor={secondaryColor} />
                </LinearGradient>
            </Defs>
            {/* TV/Screen body */}
            <Rect x="2" y="4" width="20" height="14" rx="2" fill="url(#videoGradient)" />
            {/* Screen */}
            <Rect x="4" y="6" width="16" height="10" rx="1" fill="#000000" opacity={0.2} />
            {/* Play button */}
            <Path
                d="M10 9L10 15L15 12L10 9Z"
                fill="#FFFFFF"
            />
            {/* Stand */}
            <Path
                d="M8 18L16 18L14 20L10 20L8 18Z"
                fill={secondaryColor}
            />
        </Svg>
    );
};

/**
 * Invite Friends / Users Icon
 */
export const InviteFriendsIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#10B981',
    secondaryColor = '#059669',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Defs>
                <LinearGradient id="usersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={color} />
                    <Stop offset="100%" stopColor={secondaryColor} />
                </LinearGradient>
            </Defs>
            {/* First user */}
            <Circle cx="9" cy="7" r="3" fill="url(#usersGradient)" />
            <Path
                d="M3 19C3 15.134 5.686 12 9 12C12.314 12 15 15.134 15 19"
                stroke="url(#usersGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
            />
            {/* Second user (behind) */}
            <Circle cx="16" cy="7" r="2.5" fill={secondaryColor} opacity={0.7} />
            <Path
                d="M11 19C11 16.239 13.015 14 15.5 14C17.985 14 20 16.239 20 19"
                stroke={secondaryColor}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                opacity={0.7}
            />
            {/* Plus sign */}
            <Circle cx="19" cy="5" r="3" fill="#FFFFFF" />
            <Path d="M19 3.5V6.5M17.5 5H20.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
    );
};

/**
 * User Icon
 */
export const UserIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#6366F1',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="8" r="4" fill={color} />
            <Path
                d="M4 20C4 15.582 7.582 12 12 12C16.418 12 20 15.582 20 20"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
            />
        </Svg>
    );
};

/**
 * Edit/Pencil Icon - Filled/Bold Type
 */
export const EditIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#8B5CF6',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {/* Filled pencil body */}
            <Path
                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                fill={color}
            />
            {/* Pencil tip */}
            <Path
                d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                fill={color}
            />
        </Svg>
    );
};

/**
 * Camera Icon
 */
export const CameraIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#06B6D4',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M4 7C4 5.895 4.895 5 6 5H7.586C7.851 5 8.105 4.895 8.293 4.707L9.293 3.707C9.48 3.52 9.735 3.414 10 3.414H14C14.265 3.414 14.52 3.52 14.707 3.707L15.707 4.707C15.895 4.895 16.149 5 16.414 5H18C19.105 5 20 5.895 20 7V17C20 18.105 19.105 19 18 19H6C4.895 19 4 18.105 4 17V7Z"
                fill={color}
            />
            <Circle cx="12" cy="12" r="3.5" fill="#FFFFFF" opacity={0.9} />
        </Svg>
    );
};

/**
 * Target/Crosshair Icon
 */
export const TargetIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#F43F5E',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" fill="none" />
            <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" fill="none" />
            <Circle cx="12" cy="12" r="1" fill={color} />
            <Path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
    );
};

/**
 * Moon Icon (Dark Mode)
 */
export const MoonIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#6366F1',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M21.752 15.002C20.563 15.585 19.227 15.915 17.816 15.915C13.03 15.915 9.151 12.036 9.151 7.25C9.151 5.839 9.481 4.503 10.064 3.314C6.018 4.424 3 8.118 3 12.5C3 17.747 7.253 22 12.5 22C16.882 22 20.576 18.982 21.686 14.936C21.708 14.958 21.73 14.98 21.752 15.002Z"
                fill={color}
            />
            {/* Stars */}
            <Circle cx="18" cy="5" r="1" fill={color} opacity={0.6} />
            <Circle cx="20" cy="9" r="0.5" fill={color} opacity={0.4} />
        </Svg>
    );
};

/**
 * Bell/Notification Icon
 */
export const BellIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#F59E0B',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 3C8.134 3 5 6.134 5 10V14L3 17V18H21V17L19 14V10C19 6.134 15.866 3 12 3Z"
                fill={color}
            />
            <Path
                d="M9 18C9 19.657 10.343 21 12 21C13.657 21 15 19.657 15 18"
                stroke={color}
                strokeWidth="2"
                fill="none"
            />
            {/* Notification dot */}
            <Circle cx="17" cy="6" r="3" fill="#EF4444" />
        </Svg>
    );
};

/**
 * Location/Pin Icon
 */
export const LocationIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#EF4444',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 2C8.134 2 5 5.134 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.134 15.866 2 12 2Z"
                fill={color}
            />
            <Circle cx="12" cy="9" r="2.5" fill="#FFFFFF" />
        </Svg>
    );
};

/**
 * Lock/Security Icon
 */
export const LockIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#64748B',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Rect x="5" y="10" width="14" height="11" rx="2" fill={color} />
            <Path
                d="M8 10V7C8 4.791 9.791 3 12 3C14.209 3 16 4.791 16 7V10"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
            />
            {/* Keyhole */}
            <Circle cx="12" cy="15" r="1.5" fill="#FFFFFF" opacity={0.8} />
            <Rect x="11.25" y="15.5" width="1.5" height="2.5" rx="0.5" fill="#FFFFFF" opacity={0.8} />
        </Svg>
    );
};

/**
 * Share Icon
 */
export const ShareIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#3B82F6',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="18" cy="5" r="3" fill={color} />
            <Circle cx="6" cy="12" r="3" fill={color} />
            <Circle cx="18" cy="19" r="3" fill={color} />
            <Path
                d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </Svg>
    );
};

/**
 * Gift/Reward Icon
 */
export const GiftIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#EC4899',
    secondaryColor = '#BE185D',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Defs>
                <LinearGradient id="giftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={color} />
                    <Stop offset="100%" stopColor={secondaryColor} />
                </LinearGradient>
            </Defs>
            {/* Box bottom */}
            <Rect x="3" y="12" width="18" height="9" rx="1" fill="url(#giftGradient)" />
            {/* Box top */}
            <Rect x="2" y="8" width="20" height="4" rx="1" fill={color} />
            {/* Ribbon vertical */}
            <Rect x="10.5" y="8" width="3" height="13" fill="#FBBF24" />
            {/* Ribbon horizontal */}
            <Rect x="2" y="9" width="20" height="2" fill="#FBBF24" opacity={0.8} />
            {/* Bow */}
            <Circle cx="12" cy="6" r="2" fill="#FBBF24" />
            <Path d="M9 5C9 3 10 2 12 2" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" fill="none" />
            <Path d="M15 5C15 3 14 2 12 2" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" fill="none" />
        </Svg>
    );
};

/**
 * Chat Bubble Icon
 */
export const ChatIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#3B82F6',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M21 11.5C21 16.1944 16.9706 20 12 20C10.4607 20 9.01172 19.6377 7.73259 19.0004L3 21L4.39499 16.9283C3.51156 15.5195 3 13.8646 3 12.1C3 7.40558 7.02944 3.6 12 3.6C16.9706 3.6 21 7.40558 21 12.1V11.5Z"
                fill={color}
            />
            {/* Chat dots */}
            <Circle cx="8" cy="12" r="1" fill="#FFFFFF" opacity={0.9} />
            <Circle cx="12" cy="12" r="1" fill="#FFFFFF" opacity={0.9} />
            <Circle cx="16" cy="12" r="1" fill="#FFFFFF" opacity={0.9} />
        </Svg>
    );
};

/**
 * Plus Icon
 */
export const PlusIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#8B5CF6',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" fill={color} />
            <Path
                d="M12 8V16M8 12H16"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </Svg>
    );
};

/**
 * Close/X Icon - Darker theme color
 */
export const CloseIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#d7305b',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M6 6L18 18M18 6L6 18"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </Svg>
    );
};

/**
 * Settings/Gear Icon
 */
export const SettingsIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#1F2937',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                stroke={color}
                strokeWidth="2"
                fill="none"
            />
            <Path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </Svg>
    );
};

/**
 * Eye/Preview Icon
 */
export const EyeIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#1F2937',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill="none" />
        </Svg>
    );
};

/**
 * Gallery/Image Icon
 */
export const GalleryIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#3B82F6',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none" />
            <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
            <Path
                d="M21 15L16 10L5 21"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
};

/**
 * Star Icon
 */
export const StarIcon: React.FC<IconProps> = ({
    size = 24,
    color = '#FBBF24',
}) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill={color}
            />
        </Svg>
    );
};

/**
 * Letter Icon using PNG image
 */
export const LetterIcon: React.FC<IconProps> = ({
    size = 24,
    animated = false,
}) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (animated) {
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleValue, {
                        toValue: 1.1,
                        duration: 700,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleValue, {
                        toValue: 1,
                        duration: 700,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseAnimation.start();
            return () => pulseAnimation.stop();
        }
    }, [animated, scaleValue]);

    return (
        <Animated.View style={animated ? { transform: [{ scale: scaleValue }] } : undefined}>
            <Image
                source={require('../../../assets/icons/Letter.png')}
                style={{ width: size, height: size }}
                resizeMode="contain"
            />
        </Animated.View>
    );
};

export default {
    GemIcon,
    BoosterIcon,
    LetterIcon,
    WatchVideoIcon,
    InviteFriendsIcon,
    UserIcon,
    EditIcon,
    CameraIcon,
    TargetIcon,
    MoonIcon,
    BellIcon,
    LocationIcon,
    LockIcon,
    ShareIcon,
    GiftIcon,
    ChatIcon,
    PlusIcon,
    CloseIcon,
    SettingsIcon,
    EyeIcon,
    GalleryIcon,
    StarIcon,
};

