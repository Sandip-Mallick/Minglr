import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { useTheme } from '../theme';
import { useGemsStore, useAuthStore } from '../store';
import { GemIcon, UserIcon } from '../components/Icons';
import { gemsApi } from '../api/gems';

// Import screens
import SwipeScreen from '../screens/main/SwipeScreen';
import FindScreen from '../screens/main/FindScreen';
import RequestScreen from '../screens/main/RequestScreen';
import ChatsScreen from '../screens/main/ChatsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab icons using Ionicons
type IoniconsName = keyof typeof Ionicons.glyphMap;

// Profile tab icon with user photo
const ProfileTabIcon: React.FC<{ focused: boolean; color: string }> = ({ focused, color }) => {
    const { user } = useAuthStore();
    const { primaryColor } = useTheme();
    const mainPhoto = user?.photos?.find((p) => p.isMain)?.url;

    if (mainPhoto) {
        return (
            <View style={[
                styles.profileIconContainer,
                { borderColor: focused ? primaryColor : 'transparent' }
            ]}>
                <Image source={{ uri: mainPhoto }} style={styles.profileIcon} />
            </View>
        );
    }

    return <UserIcon size={28} color={color} />;
};

const TabIcon: React.FC<{ name: string; focused: boolean; color: string }> = ({ name, focused, color }) => {
    // Special handling for Profile tab
    if (name === 'Profile') {
        return <ProfileTabIcon focused={focused} color={color} />;
    }

    // Always use filled icons for all tabs
    const iconMap: Record<string, IoniconsName> = {
        Swipe: 'sparkles',
        Find: 'search',
        Request: 'person',
        Chats: 'chatbubble',
    };

    const iconName = iconMap[name] || 'ellipse';

    return (
        <Ionicons name={iconName} size={28} color={color} />
    );
};

// Animated Gems Display component
const AnimatedGemsDisplay: React.FC<{ onPress: () => void }> = ({ onPress }) => {
    const { colors, primaryColor } = useTheme();
    const { gemsBalance, syncFromUser } = useGemsStore();
    const animatedValue = useRef(new Animated.Value(0)).current;
    const previousBalance = useRef(gemsBalance);
    const displayValue = useRef(new Animated.Value(gemsBalance)).current;

    // Fetch gems on component mount
    useEffect(() => {
        const fetchGems = async () => {
            try {
                const balance = await gemsApi.getBalance();
                syncFromUser({
                    gemsBalance: balance.gemsBalance,
                    boostersOwned: balance.boostersOwned,
                    activeBoost: balance.activeBoost,
                    referralCode: balance.referralCode,
                    referralCount: balance.referralCount,
                });
            } catch (error) {
                console.error('Failed to fetch gems balance:', error);
            }
        };

        fetchGems();

        // Optionally refresh every 30 seconds
        const interval = setInterval(fetchGems, 30000);
        return () => clearInterval(interval);
    }, [syncFromUser]);

    // Animate when balance changes
    useEffect(() => {
        if (previousBalance.current !== gemsBalance) {
            // Reset animation
            animatedValue.setValue(0);

            // Scroll animation effect
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 150,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 2,
                    duration: 150,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();

            previousBalance.current = gemsBalance;
        }
    }, [gemsBalance, animatedValue]);

    // Interpolate for scroll animation
    const translateY = animatedValue.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [0, -10, 0],
    });

    const opacity = animatedValue.interpolate({
        inputRange: [0, 0.5, 1, 1.5, 2],
        outputRange: [1, 0.5, 0.8, 0.5, 1],
    });

    const scale = animatedValue.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [1, 1.2, 1],
    });

    return (
        <TouchableOpacity
            style={[styles.gemsContainer, { backgroundColor: colors.surface, borderColor: primaryColor }]}
            onPress={onPress}
        >
            <GemIcon size={16} />
            <Animated.Text
                style={[
                    styles.gemsText,
                    {
                        color: colors.text,
                        marginLeft: 4,
                        transform: [{ translateY }, { scale }],
                        opacity,
                    },
                ]}
            >
                {gemsBalance}
            </Animated.Text>
        </TouchableOpacity>
    );
};

export const MainTabNavigator: React.FC = () => {
    const { colors, primaryColor } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route, navigation }) => ({
                tabBarIcon: ({ focused, color }) => (
                    <TabIcon name={route.name} focused={focused} color={color} />
                ),
                tabBarActiveTintColor: primaryColor,
                tabBarInactiveTintColor: colors.tabBarInactive,
                tabBarStyle: {
                    backgroundColor: colors.tabBar,
                    borderTopColor: colors.border,
                    height: 70,
                    paddingBottom: 12,
                    paddingTop: 2,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
                headerStyle: {
                    backgroundColor: colors.background,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 0,
                },
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                },
                headerTintColor: colors.text,
                headerRight: () => (
                    <AnimatedGemsDisplay onPress={() => navigation.getParent()?.navigate('GemsAndBoosters')} />
                ),
                headerRightContainerStyle: {
                    paddingRight: 16,
                },
            })}
        >
            <Tab.Screen
                name="Swipe"
                component={SwipeScreen}
                options={{
                    title: 'Discover',
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: 'transparent',
                        borderTopWidth: 0,
                        position: 'absolute',
                        height: 70,
                        paddingBottom: 12,
                        paddingTop: 2,
                        elevation: 0,
                    },
                }}
            />
            <Tab.Screen
                name="Find"
                component={FindScreen}
                options={{ title: 'Find', headerShown: false }}
            />
            <Tab.Screen
                name="Request"
                component={RequestScreen}
                options={{
                    title: 'Requests',
                    headerShown: false, // Custom header in screen
                }}
            />
            <Tab.Screen
                name="Chats"
                component={ChatsScreen}
                options={{ title: 'Chats', headerShown: false }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Me',
                    headerShown: false, // Hide header on Profile - it has its own header
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    gemsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    gemsText: {
        fontSize: 14,
        fontWeight: '600',
    },
    profileIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        overflow: 'hidden',
    },
    profileIcon: {
        width: '100%',
        height: '100%',
    },
});
